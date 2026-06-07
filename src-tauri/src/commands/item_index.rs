use std::fs::File;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Duration, Instant};

use tauri::{Manager, Emitter};
use serde::Serialize;
use rayon::prelude::*;
use walkdir::WalkDir;

use crate::dat_parser::{parse_dat_file_with_blueprints, load_item_name_and_desc, map_type_to_category};
use crate::models::UnturnedItem;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexingProgress {
    current: usize,
    total: usize,
    message: String,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub async fn pick_folder() -> Option<String> {
    rfd::FileDialog::new()
        .pick_folder()
        .map(|p| p.to_string_lossy().to_string())
}

/// Scan the Unturned game directory and optional extra paths, build an item index, and cache it.
#[tauri::command]
pub async fn scan_unturned_directory(
    app: tauri::AppHandle,
    window: tauri::Window,
    game_path: String,
    extra_paths: Vec<String>,
    preferred_lang: String,
) -> Result<Vec<UnturnedItem>, String> {
    let base_path = PathBuf::from(&game_path);
    let bundles_path = base_path.join("Bundles");

    let mut scan_targets = Vec::new();
    if bundles_path.exists() {
        let items_path = bundles_path.join("Items");
        let vehicles_path = bundles_path.join("Vehicles");
        if items_path.exists() { scan_targets.push(items_path); }
        if vehicles_path.exists() { scan_targets.push(vehicles_path); }
    }

    for p in extra_paths {
        let extra_path = PathBuf::from(p);
        if extra_path.exists() { scan_targets.push(extra_path); }
    }

    if scan_targets.is_empty() {
        return Err("未找到有效的扫描目录，请确保路径正确。".to_string());
    }

    // Detect ChineseLocalMod folder
    let mod_path = base_path.parent()
        .map(|p| p.join("ChineseLocalMod"))
        .filter(|p| p.exists());

    // Step 1: Rapidly collect all .dat file paths (CPU-bound sorting & filtering)
    let dat_file_paths: Vec<PathBuf> = scan_targets.par_iter().flat_map(|target| {
        WalkDir::new(target)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| {
                if e.file_type().is_dir() {
                    let name = e.file_name().to_string_lossy();
                    // Skip folders that definitely don't contain item/vehicle data
                    return !matches!(name.as_ref(), "Documentation" | "Scripts" | "Bundles" | ".git" | "Source" | "Trees" | "Nodes" | "Objects");
                }
                
                if e.path().extension().and_then(|s| s.to_str()) == Some("dat") {
                    if let Some(stem) = e.path().file_stem().and_then(|s| s.to_str()) {
                        let stem_lower = stem.to_lowercase();
                        // Unturned items have unique names, translations use standard language names.
                        let is_translation = matches!(
                            stem_lower.as_str(),
                            "english" | "chinese" | "simplified_chinese" | "schinese" | "german" | 
                            "spanish" | "french" | "russian" | "japanese" | "brazilian" | "portuguese" | "turkish"
                        );
                        if is_translation { return false; }
                        return true;
                    }
                }
                false
            })
            .map(|e| e.into_path())
            .collect::<Vec<_>>()
    }).collect();

    let total_files = dat_file_paths.len();
    let processed_count = Arc::new(AtomicUsize::new(0));
    let last_update = Arc::new(Mutex::new(Instant::now()));
    
    // Step 2: Parallel Parsing using Rayon
    let all_items: Vec<UnturnedItem> = dat_file_paths.par_iter().filter_map(|path| {
        let parent_dir = path.parent()?;
        
        // Parse
        let (guid, mut blueprints, parsed_properties) = parse_dat_file_with_blueprints(path);
        let id = parsed_properties.get("ID")?.trim().parse::<u32>().ok()?;

        // Blueprint "this" resolution
        for bp in &mut blueprints {
            for input in &mut bp.inputs { if input.id_or_guid.to_lowercase() == "this" { input.id_or_guid = id.to_string(); } }
            for output in &mut bp.outputs { if output.id_or_guid.to_lowercase() == "this" { output.id_or_guid = id.to_string(); } }
        }

        let (name, desc) = load_item_name_and_desc(parent_dir, &bundles_path, &preferred_lang, mod_path.as_deref())?;
        
        // Progress Reporting (Throttled to max 10 updates per second)
        let current = processed_count.fetch_add(1, Ordering::SeqCst) + 1;
        {
            let mut last = last_update.lock().unwrap();
            if last.elapsed() > Duration::from_millis(100) || current == total_files {
                let _ = window.emit("indexing-progress", IndexingProgress {
                    current,
                    total: total_files,
                    message: name.clone(),
                });
                *last = Instant::now();
            }
        }

        let raw_type = parsed_properties.get("Type").cloned().unwrap_or_default();
        let mut category = map_type_to_category(&raw_type);
        if parent_dir.to_string_lossy().contains("Vehicles") { category = Some("vehicles".to_string()); }
        let category = category?;

        Some(UnturnedItem {
            id,
            guid,
            name,
            category,
            description: desc,
            rarity: parsed_properties.get("Rarity").cloned().unwrap_or_else(|| "Common".to_string()),
            blueprints: if blueprints.is_empty() { None } else { Some(blueprints) },
        })
    }).collect();

    // Final Sort
    let mut sorted_items = all_items;
    sorted_items.sort_by_key(|item| item.id);

    // Persist Cache with Bincode (High Performance)
    if let Ok(cache_dir) = app.path().app_data_dir() {
        let _ = std::fs::create_dir_all(&cache_dir);
        let cache_file = cache_dir.join("item_index.bin");
        if let Ok(mut file) = File::create(cache_file) {
            let _ = bincode::serialize_into(&mut file, &sorted_items);
        }
    }

    let _ = window.emit("indexing-progress", IndexingProgress {
        current: total_files,
        total: total_files,
        message: "索引构建完成！".to_string(),
    });

    Ok(sorted_items)
}

/// Load the previously cached item index from disk.
#[tauri::command]
pub async fn load_cached_index(app: tauri::AppHandle) -> Result<Vec<UnturnedItem>, String> {
    if let Ok(cache_dir) = app.path().app_data_dir() {
        let bin_cache = cache_dir.join("item_index.bin");
        if bin_cache.exists() {
            if let Ok(mut file) = File::open(bin_cache) {
                if let Ok(items) = bincode::deserialize_from::<_, Vec<UnturnedItem>>(&mut file) {
                    return Ok(items);
                }
            }
        }
    }
    Err("No cache found".to_string())
}

/// Verify that the supplied path points to a valid Unturned installation.
#[tauri::command]
pub async fn verify_unturned_path(game_path: String) -> Result<String, String> {
    let path = Path::new(&game_path);
    let bundles_path = path.join("Bundles");
    if bundles_path.exists() {
        Ok("路径验证成功！已检测到 Bundles 目录。".to_string())
    } else {
        Err("路径验证失败：未检测到 Bundles 文件夹，请确认是否为 Unturned 根目录。".to_string())
    }
}

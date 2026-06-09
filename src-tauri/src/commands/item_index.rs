use std::collections::HashMap;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
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

type IconCacheMap = HashMap<String, String>;
type GameIconCache = HashMap<String, IconCacheMap>;

static ICON_PATH_CACHE: OnceLock<Mutex<GameIconCache>> = OnceLock::new();

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
        let raw_type = raw_type.to_lowercase();

        if raw_type == "spawn" {
            return None;
        }

        let mut category = map_type_to_category(&raw_type);
        if category.is_none() {
            let parent_path = parent_dir.to_string_lossy().to_lowercase();
            if parent_path.contains("bundles\\vehicles") || parent_path.contains("bundles/vehicles") {
                category = Some("vehicles".to_string());
            }
        }
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

fn icon_cache_key(game_path: &str, is_vehicle: bool) -> String {
    format!("{}|{}", game_path, if is_vehicle { "Vehicles" } else { "Items" })
}

fn normalize_guid_for_icon_lookup(guid: &str) -> String {
    guid.trim()
        .trim_matches(&['{', '}'][..])
        .replace("-", "")
        .to_lowercase()
}

fn build_icon_path_cache(search_path: &Path, is_vehicle: bool) -> IconCacheMap {
    let mut cache = IconCacheMap::new();

    if !search_path.exists() {
        return cache;
    }

    for entry in WalkDir::new(search_path).into_iter().filter_map(|entry| entry.ok()) {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let name = match path.file_name().and_then(|n| n.to_str()) {
            Some(name) => name.to_lowercase(),
            None => continue,
        };
        if !name.ends_with(".png") {
            continue;
        }

        let stem_clean = name.trim_end_matches(".png").replace("-", "");
        if stem_clean.is_empty() {
            continue;
        }

        // Exact match by normalized GUID.
        cache.entry(stem_clean.clone())
            .or_insert_with(|| path.to_string_lossy().to_string());

        // Some image packs append suffixes, e.g. <guid>_256.png or <guid>-...
        if let Some(pos) = stem_clean.find('_') {
            if pos > 0 {
                let prefix = stem_clean[..pos].to_string();
                cache.entry(prefix)
                    .or_insert_with(|| path.to_string_lossy().to_string());
            }
        }
        if let Some(pos) = stem_clean.find('-') {
            if pos > 0 {
                let prefix = stem_clean[..pos].to_string();
                cache.entry(prefix)
                    .or_insert_with(|| path.to_string_lossy().to_string());
            }
        }

        // Vehicles may use guid-r-g-b.png format.
        if is_vehicle {
            let prefix_8 = stem_clean.chars().take(32).collect::<String>();
            if !prefix_8.is_empty() && prefix_8 != stem_clean {
                cache.entry(prefix_8)
                    .or_insert_with(|| path.to_string_lossy().to_string());
            }
        }
    }

    cache
}

fn clear_icon_path_cache(game_path: &str) {
    let Some(cache) = ICON_PATH_CACHE.get() else {
        return;
    };
    let item_key = icon_cache_key(game_path, false);
    let vehicle_key = icon_cache_key(game_path, true);

    let mut cache = match cache.lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    };
    cache.remove(&item_key);
    cache.remove(&vehicle_key);
}

#[tauri::command]
pub async fn resolve_item_icon(game_path: String, guid: String, is_vehicle: bool) -> Option<String> {
    let game_path_ref = game_path.as_str();
    let base_path = PathBuf::from(game_path_ref).join("Extras");
    if !base_path.exists() {
        return None;
    }

    let sub_folder = if is_vehicle { "Vehicles" } else { "Items" };
    let search_path = base_path.join(sub_folder);

    if !search_path.exists() {
        return None;
    }

    let target_guid_clean = normalize_guid_for_icon_lookup(&guid);
    let cache_id = icon_cache_key(game_path_ref, is_vehicle);
    let mut cache = ICON_PATH_CACHE.get_or_init(|| Mutex::new(HashMap::new())).lock().map(|g| g).unwrap_or_else(|p| p.into_inner());

    if !cache.contains_key(&cache_id) {
        let icon_cache = build_icon_path_cache(&search_path, is_vehicle);
        cache.insert(cache_id.clone(), icon_cache);
    }

    cache.get(&cache_id).and_then(|index| index.get(&target_guid_clean).cloned())
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

/// Index game images by extracting the UnturnedImages module and launching the game.
#[tauri::command]
pub async fn index_game_images(app: tauri::AppHandle, game_path: String) -> Result<(), String> {
    let game_root = PathBuf::from(&game_path);
    let unturned_exe = if cfg!(target_os = "windows") {
        game_root.join("Unturned.exe")
    } else {
        return Err("当前功能仅支持 Windows。".to_string());
    };

    if !unturned_exe.exists() {
        return Err("未找到 Unturned.exe，请确保路径正确并指向 Unturned 根目录。".to_string());
    }

    let target_dir = game_root.join("Modules");

    // 1. Get resource path for the zipped module
    let resource_path = app.path().resolve("resources/UnturnedImages.zip", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("无法定位资源文件 UnturnedImages.zip: {}", e))?;

    if !resource_path.exists() {
        return Err("助手内未找到 UnturnedImages.zip 资源文件，请确保该文件已放置在 src-tauri/resources 目录下。".to_string());
    }

    // 2. Extract ZIP to Modules
    let file = File::open(&resource_path).map_err(|e| format!("无法打开资源文件: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("无效的 ZIP 文件: {}", e))?;

    let module_dir = target_dir.join("UnturnedImages");
    if module_dir.exists() {
        let _ = fs::remove_dir_all(&module_dir);
    }
    fs::create_dir_all(&target_dir).map_err(|e| format!("无法创建模块目录: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => target_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    // 3. Launch game with -NoBattlEye
    let mut child = std::process::Command::new(&unturned_exe)
        .arg("-nobattleye")
        .spawn()
        .map_err(|e| format!("启动游戏失败: {}", e))?;

    // 4. Wait for game process to exit
    let _ = child.wait();

    let error_log_path = game_root.join("Extras").join("export_error.log");
    let export_error = if error_log_path.exists() {
        let error_msg = fs::read_to_string(&error_log_path).unwrap_or_else(|_| "未知错误 (无法读取日志文件)".to_string());
        let _ = fs::remove_file(&error_log_path);
        Some(error_msg)
    } else {
        None
    };

    // 5. Cleanup the temporary module
    if module_dir.exists() {
        let _ = fs::remove_dir_all(&module_dir);
    }

    clear_icon_path_cache(&game_path);

    if let Some(err) = export_error {
        return Err(format!("图片导出过程中发生严重错误：\n{}", err));
    }

    Ok(())
}

#[tauri::command]
pub async fn remove_image_index_module(game_path: String) -> Result<(), String> {
    let game_root = PathBuf::from(&game_path);
    let module_dir = game_root.join("Modules").join("UnturnedImages");
    if module_dir.exists() {
        fs::remove_dir_all(&module_dir).map_err(|e| format!("删除失败: {}", e))?;
    }

    clear_icon_path_cache(&game_path);
    Ok(())
}

#[tauri::command]
pub async fn is_image_index_module_installed(game_path: String) -> Result<bool, String> {
    let game_root = PathBuf::from(&game_path);
    let module_dir = game_root.join("Modules").join("UnturnedImages");
    Ok(module_dir.exists())
}

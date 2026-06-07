use std::fs::File;
use std::path::Path;

use tauri::Manager;

use crate::dat_parser::scan_directory;
use crate::models::UnturnedItem;

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

/// Scan the Unturned game directory, build an item index, and cache it.
#[tauri::command]
pub async fn scan_unturned_directory(
    app: tauri::AppHandle,
    game_path: String,
    preferred_lang: String,
) -> Result<Vec<UnturnedItem>, String> {
    let path = Path::new(&game_path);
    let bundles_path = path.join("Bundles");

    if !bundles_path.exists() {
        return Err("找不到 Bundles 目录，请确保游戏安装路径正确。".to_string());
    }

    let items_path = bundles_path.join("Items");
    let vehicles_path = bundles_path.join("Vehicles");

    // Detect ChineseLocalMod folder in the parent of the Unturned installation
    let parent_dir = path.parent();
    let mod_path = parent_dir
        .map(|p| p.join("ChineseLocalMod"))
        .filter(|p| p.exists());
    let mod_ref = mod_path.as_deref();

    let mut all_items = Vec::new();

    if items_path.exists() {
        all_items.extend(scan_directory(
            &items_path,
            &bundles_path,
            &preferred_lang,
            mod_ref,
        ));
    }

    if vehicles_path.exists() {
        all_items.extend(scan_directory(
            &vehicles_path,
            &bundles_path,
            &preferred_lang,
            mod_ref,
        ));
    }

    // Sort items by ID
    all_items.sort_by_key(|item| item.id);

    // Persist to cache
    if let Ok(cache_dir) = app.path().app_data_dir() {
        let _ = std::fs::create_dir_all(&cache_dir);
        let cache_file = cache_dir.join("item_index.json");
        if let Ok(file) = File::create(cache_file) {
            let _ = serde_json::to_writer_pretty(file, &all_items);
        }
    }

    Ok(all_items)
}

/// Load the previously cached item index from disk.
#[tauri::command]
pub async fn load_cached_index(app: tauri::AppHandle) -> Result<Vec<UnturnedItem>, String> {
    if let Ok(cache_dir) = app.path().app_data_dir() {
        let cache_file = cache_dir.join("item_index.json");
        if cache_file.exists() {
            if let Ok(file) = File::open(cache_file) {
                if let Ok(items) = serde_json::from_reader::<_, Vec<UnturnedItem>>(file) {
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

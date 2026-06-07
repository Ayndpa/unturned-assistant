use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct UnturnedItem {
    id: u32,
    name: String,
    category: String,
    description: String,
    rarity: String,
}

// Map Unturned DAT types to frontend categories
fn map_type_to_category(item_type: &str) -> String {
    let t = item_type.to_lowercase();
    match t.as_str() {
        "gun" | "melee" | "throwable" => "weapons".to_string(),
        "magazine" | "sight" | "tactical" | "grip" | "barrel" => "ammo".to_string(),
        "hat" | "mask" | "glasses" | "shirt" | "pants" | "vest" | "backpack" => "apparel".to_string(),
        "vehicle" => "vehicles".to_string(),
        "medical" | "food" | "water" => "medical".to_string(),
        "structure" | "barricade" | "storage" | "sentry" => "structures".to_string(),
        _ => "other".to_string(),
    }
}

// Parse simple key-value dat files
fn parse_dat_file(path: &Path) -> HashMap<String, String> {
    let mut data = HashMap::new();
    if let Ok(file) = File::open(path) {
        let reader = BufReader::new(file);
        for line in reader.lines() {
            if let Ok(line) = line {
                // Strip comments
                let cleaned_line = if let Some(idx) = line.find("//") {
                    &line[..idx]
                } else {
                    &line
                };
                let cleaned_line = cleaned_line.trim();
                if cleaned_line.is_empty() {
                    continue;
                }
                // Split by whitespace
                let parts: Vec<&str> = cleaned_line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let key = parts[0].to_string();
                    let val = parts[1..].join(" ");
                    data.insert(key, val);
                }
            }
        }
    }
    data
}

// Load a specific language translation file without fallbacks
fn load_specific_translation(dir: &Path, lang: &str) -> (String, String) {
    let mut files_to_try = vec![format!("{}.dat", lang)];
    if lang == "Chinese" {
        files_to_try.push("Simplified_Chinese.dat".to_string());
        files_to_try.push("Schinese.dat".to_string());
    }

    for filename in files_to_try {
        let lang_path = dir.join(&filename);
        if lang_path.exists() {
            let translation = parse_dat_file(&lang_path);
            let name = translation.get("Name").cloned();
            let desc = translation.get("Description").cloned().unwrap_or_default();
            if let Some(n) = name {
                if !n.trim().is_empty() {
                    return (n, desc);
                }
            }
        }
    }
    (String::new(), String::new())
}

// Reconstruct path and load bilingual translation, checking mod and game files
fn load_item_name_and_desc(
    dir: &Path,
    bundles_root: &Path,
    preferred_lang: &str,
    mod_path: Option<&Path>,
) -> (String, String) {
    // 1. Load English translation as base
    let (mut eng_name, eng_desc) = load_specific_translation(dir, "English");
    if eng_name.is_empty() {
        eng_name = dir.file_name().and_then(|s| s.to_str()).unwrap_or("Unknown").to_string();
    }

    if preferred_lang == "Chinese" {
        let mut chi_name = String::new();
        let mut chi_desc = String::new();

        // Try to load Chinese translation from ChineseLocalMod if available
        if let Some(mod_root) = mod_path {
            if let Ok(rel_path) = dir.strip_prefix(bundles_root.parent().unwrap_or(bundles_root)) {
                let mod_dir = mod_root.join(rel_path);
                let translation_files = vec!["Schinese.dat", "Simplified_Chinese.dat", "Chinese.dat"];
                for filename in translation_files {
                    let lang_path = mod_dir.join(filename);
                    if lang_path.exists() {
                        let translation = parse_dat_file(&lang_path);
                        if let Some(n) = translation.get("Name") {
                            if !n.trim().is_empty() {
                                chi_name = n.clone();
                                chi_desc = translation.get("Description").cloned().unwrap_or_default();
                                break;
                            }
                        }
                    }
                }
            }
        }

        // If not found in mod, try local Chinese translation in game directory
        if chi_name.is_empty() {
            let (local_chi_name, local_chi_desc) = load_specific_translation(dir, "Chinese");
            if !local_chi_name.is_empty() {
                chi_name = local_chi_name;
                chi_desc = local_chi_desc;
            }
        }

        // If we found a Chinese translation that is different from English, combine them
        if !chi_name.is_empty() && chi_name.to_lowercase() != eng_name.to_lowercase() {
            let combined_name = format!("{} ({})", eng_name, chi_name);
            let desc = if !chi_desc.is_empty() { chi_desc } else { eng_desc };
            return (combined_name, desc);
        } else if !chi_name.is_empty() {
            // If identical, just return Chinese name & description
            let desc = if !chi_desc.is_empty() { chi_desc } else { eng_desc };
            return (chi_name, desc);
        }
    }

    (eng_name, eng_desc)
}

// Recursively scan Unturned directories
fn scan_directory(
    base_path: &Path,
    bundles_root: &Path,
    preferred_lang: &str,
    mod_path: Option<&Path>,
) -> Vec<UnturnedItem> {
    let mut items = Vec::new();
    
    fn walk_dir(
        dir: &Path,
        bundles_root: &Path,
        preferred_lang: &str,
        mod_path: Option<&Path>,
        items: &mut Vec<UnturnedItem>,
    ) {
        if let Ok(entries) = std::fs::read_dir(dir) {
            let mut dat_files = Vec::new();
            
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_dir() {
                        walk_dir(&path, bundles_root, preferred_lang, mod_path, items);
                    } else if path.is_file() {
                        if let Some(ext) = path.extension() {
                            if ext == "dat" {
                                dat_files.push(path);
                            }
                        }
                    }
                }
            }
            
            if !dat_files.is_empty() {
                // Find main property dat (excludes standard translation files)
                let translations = ["english", "chinese", "simplified_chinese", "schinese", "german", "spanish", "french", "russian"];
                let main_dat = dat_files.iter().find(|p| {
                    if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
                        let stem_lower = stem.to_lowercase();
                        !translations.contains(&stem_lower.as_str())
                    } else {
                        false
                    }
                });
                
                if let Some(main_dat_path) = main_dat {
                    let properties = parse_dat_file(main_dat_path);
                    if let Some(id_str) = properties.get("ID") {
                        if let Ok(id) = id_str.trim().parse::<u32>() {
                            let (name, desc) = load_item_name_and_desc(dir, bundles_root, preferred_lang, mod_path);
                            
                            let raw_type = properties.get("Type").cloned().unwrap_or_default();
                            let mut category = map_type_to_category(&raw_type);
                            
                            // Handle vehicle specific override
                            if dir.to_string_lossy().contains("Vehicles") {
                                category = "vehicles".to_string();
                            }
                            
                            let rarity = properties.get("Rarity").cloned().unwrap_or_else(|| "Common".to_string());
                            
                            items.push(UnturnedItem {
                                id,
                                name,
                                category,
                                description: desc,
                                rarity,
                            });
                        }
                    }
                }
            }
        }
    }
    
    walk_dir(base_path, bundles_root, preferred_lang, mod_path, &mut items);
    items
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn pick_folder() -> Option<String> {
    rfd::FileDialog::new()
        .pick_folder()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
async fn scan_unturned_directory(
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
    
    // Detect ChineseLocalMod folder in the same parent folder of Unturned
    let parent_dir = path.parent();
    let mod_path = parent_dir.map(|p| p.join("ChineseLocalMod")).filter(|p| p.exists());
    let mod_ref = mod_path.as_deref();
    
    let mut all_items = Vec::new();
    
    if items_path.exists() {
        all_items.extend(scan_directory(&items_path, &bundles_path, &preferred_lang, mod_ref));
    }
    
    if vehicles_path.exists() {
        all_items.extend(scan_directory(&vehicles_path, &bundles_path, &preferred_lang, mod_ref));
    }
    
    // Sort items by ID
    all_items.sort_by_key(|item| item.id);
    
    // Save to cache
    if let Ok(cache_dir) = app.path().app_data_dir() {
        let _ = std::fs::create_dir_all(&cache_dir);
        let cache_file = cache_dir.join("item_index.json");
        if let Ok(file) = File::create(cache_file) {
            let _ = serde_json::to_writer_pretty(file, &all_items);
        }
    }
    
    Ok(all_items)
}

#[tauri::command]
async fn load_cached_index(app: tauri::AppHandle) -> Result<Vec<UnturnedItem>, String> {
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

#[tauri::command]
async fn verify_unturned_path(game_path: String) -> Result<String, String> {
    let path = Path::new(&game_path);
    let bundles_path = path.join("Bundles");
    if bundles_path.exists() {
        Ok("路径验证成功！已检测到 Bundles 目录。".to_string())
    } else {
        Err("路径验证失败：未检测到 Bundles 文件夹，请确认是否为 Unturned 根目录。".to_string())
    }
}

#[tauri::command]
async fn fetch_html(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    
    let res = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    Ok(res)
}

#[tauri::command]
async fn install_localization_mod(download_url: String, game_path: String) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&download_url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    // Determine target game root directory
    let target_dir = Path::new(&game_path);
    if !target_dir.exists() {
        return Err("游戏目录不存在，请检查路径。".to_string());
    }

    // Extract zip directly to game root (overwriting files)
    let cursor = std::io::Cursor::new(res);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| format!("解析 ZIP 失败: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| format!("读取 ZIP 文件项失败: {}", e))?;
        let outpath = match file.enclosed_name() {
            Some(path) => target_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath).map_err(|e| format!("创建目录失败: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    std::fs::create_dir_all(p).map_err(|e| format!("创建父目录失败: {}", e))?;
                }
            }
            let mut outfile = std::fs::File::create(&outpath).map_err(|e| format!("创建目标文件失败: {}", e))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| format!("写入文件失败: {}", e))?;
        }
    }

    Ok(())
}

fn delete_chinese_files_recursive(dir: &Path) -> std::io::Result<()> {
    if dir.is_dir() {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                    if name == "Chinese" || name == "Simplified_Chinese" || name == "Schinese" {
                        let _ = std::fs::remove_dir_all(&path);
                        continue;
                    }
                }
                let _ = delete_chinese_files_recursive(&path);
            } else if path.is_file() {
                if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                    if name == "Chinese.dat" || name == "Schinese.dat" || name == "Simplified_Chinese.dat" {
                        let _ = std::fs::remove_file(&path);
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
async fn uninstall_localization_mod(game_path: String) -> Result<(), String> {
    let base_path = Path::new(&game_path);
    if !base_path.exists() {
        return Err("游戏目录不存在。".to_string());
    }

    // List of directories we want to scan for Chinese files/folders to delete
    let scan_dirs = ["Bundles", "Localization", "Maps", "ChineseLocalMod"];
    for dir_name in &scan_dirs {
        let dir_path = base_path.join(dir_name);
        if dir_path.exists() && dir_path.is_dir() {
            delete_chinese_files_recursive(&dir_path).map_err(|e| format!("清理 {} 目录失败: {}", dir_name, e))?;
        }
    }

    // Delete known root files
    let root_files = ["Localization.meta", "Spy.jpg", "现在就三个文件夹，没问题，不用问少文件的事了.txt", "汉化补丁说明.png"];
    for file_name in &root_files {
        let file_path = base_path.join(file_name);
        if file_path.exists() && file_path.is_file() {
            let _ = std::fs::remove_file(file_path);
        }
    }

    // If ChineseLocalMod folder exists and is empty, delete it
    let mod_path = base_path.join("ChineseLocalMod");
    if mod_path.exists() && mod_path.is_dir() {
        if let Ok(entries) = std::fs::read_dir(&mod_path) {
            if entries.count() == 0 {
                let _ = std::fs::remove_dir(mod_path);
            }
        }
    }

    Ok(())
}

#[tauri::command]
async fn is_localization_installed(game_path: String) -> bool {
    let path = Path::new(&game_path);
    if !path.exists() {
        return false;
    }
    
    // Check if any Chinese localization directories exist under Localization/
    let loc_path = path.join("Localization");
    if loc_path.exists() && loc_path.is_dir() {
        let targets = ["Chinese", "Simplified_Chinese", "Schinese"];
        for target in &targets {
            if loc_path.join(target).exists() {
                return true;
            }
        }
    }

    // Also check ChineseLocalMod folder in case they have files there
    let mod_path = path.join("ChineseLocalMod");
    if mod_path.exists() && mod_path.is_dir() {
        if let Ok(entries) = std::fs::read_dir(mod_path) {
            if entries.count() > 0 {
                return true;
            }
        }
    }
    
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            pick_folder,
            scan_unturned_directory,
            load_cached_index,
            verify_unturned_path,
            fetch_html,
            install_localization_mod,
            uninstall_localization_mod,
            is_localization_installed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use std::path::Path;

/// Fetch raw HTML from a URL (used to scrape the localization mod list).
#[tauri::command]
pub async fn fetch_html(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
             AppleWebKit/537.36 (KHTML, like Gecko) \
             Chrome/120.0.0.0 Safari/537.36",
        )
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    Ok(res)
}

/// Download a localization ZIP from `download_url` and extract it into `game_path`.
#[tauri::command]
pub async fn install_localization_mod(
    download_url: String,
    game_path: String,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
             AppleWebKit/537.36 (KHTML, like Gecko) \
             Chrome/120.0.0.0 Safari/537.36",
        )
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    let target_dir = Path::new(&game_path);
    if !target_dir.exists() {
        return Err("游戏目录不存在，请检查路径。".to_string());
    }

    let cursor = std::io::Cursor::new(res);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| format!("解析 ZIP 失败: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("读取 ZIP 文件项失败: {}", e))?;
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
            let mut outfile =
                std::fs::File::create(&outpath).map_err(|e| format!("创建目标文件失败: {}", e))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| format!("写入文件失败: {}", e))?;
        }
    }

    Ok(())
}

/// Recursively delete Chinese localisation files/directories under `dir`.
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
                    if name == "Chinese.dat"
                        || name == "Schinese.dat"
                        || name == "Simplified_Chinese.dat"
                    {
                        let _ = std::fs::remove_file(&path);
                    }
                }
            }
        }
    }
    Ok(())
}

/// Remove all Chinese localisation files from the game directory.
#[tauri::command]
pub async fn uninstall_localization_mod(game_path: String) -> Result<(), String> {
    let base_path = Path::new(&game_path);
    if !base_path.exists() {
        return Err("游戏目录不存在。".to_string());
    }

    let scan_dirs = ["Bundles", "Localization", "Maps", "ChineseLocalMod"];
    for dir_name in &scan_dirs {
        let dir_path = base_path.join(dir_name);
        if dir_path.exists() && dir_path.is_dir() {
            delete_chinese_files_recursive(&dir_path)
                .map_err(|e| format!("清理 {} 目录失败: {}", dir_name, e))?;
        }
    }

    // Delete known root-level localisation files
    let root_files = [
        "Localization.meta",
        "Spy.jpg",
        "现在就三个文件夹，没问题，不用问少文件的事了.txt",
        "汉化补丁说明.png",
    ];
    for file_name in &root_files {
        let file_path = base_path.join(file_name);
        if file_path.exists() && file_path.is_file() {
            let _ = std::fs::remove_file(file_path);
        }
    }

    // Remove ChineseLocalMod if now empty
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

/// Return `true` if a Chinese localisation pack appears to be installed.
#[tauri::command]
pub async fn is_localization_installed(game_path: String) -> bool {
    let path = Path::new(&game_path);
    if !path.exists() {
        return false;
    }

    let loc_path = path.join("Localization");
    if loc_path.exists() && loc_path.is_dir() {
        let targets = ["Chinese", "Simplified_Chinese", "Schinese"];
        for target in &targets {
            if loc_path.join(target).exists() {
                return true;
            }
        }
    }

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

use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

use crate::models::UnturnedItem;

/// Map Unturned DAT type strings to frontend category names.
pub fn map_type_to_category(item_type: &str) -> String {
    let t = item_type.to_lowercase();
    match t.as_str() {
        "gun" | "melee" | "throwable" => "weapons".to_string(),
        "magazine" | "sight" | "tactical" | "grip" | "barrel" => "ammo".to_string(),
        "hat" | "mask" | "glasses" | "shirt" | "pants" | "vest" | "backpack" => {
            "apparel".to_string()
        }
        "vehicle" => "vehicles".to_string(),
        "medical" | "food" | "water" => "medical".to_string(),
        "structure" | "barricade" | "storage" | "sentry" => "structures".to_string(),
        _ => "other".to_string(),
    }
}

/// Parse a simple key-value `.dat` file into a `HashMap`.
pub fn parse_dat_file(path: &Path) -> HashMap<String, String> {
    let mut data = HashMap::new();
    if let Ok(file) = File::open(path) {
        let reader = BufReader::new(file);
        for line in reader.lines() {
            if let Ok(line) = line {
                // Strip inline comments
                let cleaned_line = if let Some(idx) = line.find("//") {
                    &line[..idx]
                } else {
                    &line
                };
                let cleaned_line = cleaned_line.trim();
                if cleaned_line.is_empty() {
                    continue;
                }
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

/// Load a specific language translation file (no fallback).
/// Returns `(name, description)`.
pub fn load_specific_translation(dir: &Path, lang: &str) -> (String, String) {
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

/// Load bilingual (English + preferred language) item name and description.
///
/// Checks `mod_path` for a translated override before falling back to the
/// game's own translation files.
pub fn load_item_name_and_desc(
    dir: &Path,
    bundles_root: &Path,
    preferred_lang: &str,
    mod_path: Option<&Path>,
) -> (String, String) {
    // 1. English as base
    let (mut eng_name, eng_desc) = load_specific_translation(dir, "English");
    if eng_name.is_empty() {
        eng_name = dir
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string();
    }

    if preferred_lang == "Chinese" {
        let mut chi_name = String::new();
        let mut chi_desc = String::new();

        // 2a. Try ChineseLocalMod override
        if let Some(mod_root) = mod_path {
            if let Ok(rel_path) =
                dir.strip_prefix(bundles_root.parent().unwrap_or(bundles_root))
            {
                let mod_dir = mod_root.join(rel_path);
                let translation_files =
                    vec!["Schinese.dat", "Simplified_Chinese.dat", "Chinese.dat"];
                for filename in translation_files {
                    let lang_path = mod_dir.join(filename);
                    if lang_path.exists() {
                        let translation = parse_dat_file(&lang_path);
                        if let Some(n) = translation.get("Name") {
                            if !n.trim().is_empty() {
                                chi_name = n.clone();
                                chi_desc = translation
                                    .get("Description")
                                    .cloned()
                                    .unwrap_or_default();
                                break;
                            }
                        }
                    }
                }
            }
        }

        // 2b. Fall back to game directory Chinese translation
        if chi_name.is_empty() {
            let (local_chi_name, local_chi_desc) = load_specific_translation(dir, "Chinese");
            if !local_chi_name.is_empty() {
                chi_name = local_chi_name;
                chi_desc = local_chi_desc;
            }
        }

        // 3. Combine or return
        if !chi_name.is_empty() && chi_name.to_lowercase() != eng_name.to_lowercase() {
            let combined_name = format!("{} ({})", eng_name, chi_name);
            let desc = if !chi_desc.is_empty() { chi_desc } else { eng_desc };
            return (combined_name, desc);
        } else if !chi_name.is_empty() {
            let desc = if !chi_desc.is_empty() { chi_desc } else { eng_desc };
            return (chi_name, desc);
        }
    }

    (eng_name, eng_desc)
}

/// Recursively scan an Unturned directory tree and return all recognised items.
pub fn scan_directory(
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
                // Find the main property .dat (not a translation file)
                let translations = [
                    "english",
                    "chinese",
                    "simplified_chinese",
                    "schinese",
                    "german",
                    "spanish",
                    "french",
                    "russian",
                ];
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
                            let (name, desc) = load_item_name_and_desc(
                                dir,
                                bundles_root,
                                preferred_lang,
                                mod_path,
                            );

                            let raw_type = properties.get("Type").cloned().unwrap_or_default();
                            let mut category = map_type_to_category(&raw_type);

                            if dir.to_string_lossy().contains("Vehicles") {
                                category = "vehicles".to_string();
                            }

                            let rarity = properties
                                .get("Rarity")
                                .cloned()
                                .unwrap_or_else(|| "Common".to_string());

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

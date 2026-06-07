use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

use crate::models::{Blueprint, BlueprintItem};

/// Map Unturned DAT type strings to frontend category names.
pub fn map_type_to_category(item_type: &str) -> Option<String> {
    let t = item_type.to_lowercase();
    match t.as_str() {
        "gun" | "melee" | "throwable" | "charge" => Some("weapons".to_string()),
        "magazine" | "sight" | "optics" | "tactical" | "grip" | "barrel" => Some("ammo".to_string()),
        "hat" | "mask" | "glasses" | "shirt" | "pants" | "vest" | "backpack" => {
            Some("apparel".to_string())
        }
        "vehicle" => Some("vehicles".to_string()),
        "medical" | "food" | "water" => Some("medical".to_string()),
        "structure" | "barricade" | "storage" | "sentry" | "generator" | "tank" | "trap" | "beacon" => {
            Some("structures".to_string())
        }
        "supply" | "tool" | "fuel" | "filter" | "key" | "box" | "map" | "compass" => {
            Some("resources".to_string())
        }
        _ => None,
    }
}

/// Parse a simple key-value `.dat` file into a `HashMap`.
pub fn parse_dat_file(path: &Path) -> HashMap<String, String> {
    let mut data = HashMap::new();
    if let Ok(file) = File::open(path) {
        let reader = BufReader::new(file);
        for line in reader.lines() {
            if let Ok(line) = line {
                let cleaned_line = if let Some(idx) = line.find("//") {
                    &line[..idx]
                } else {
                    &line
                };
                let cleaned_line = cleaned_line.trim();
                let cleaned_line = cleaned_line.strip_prefix("\u{feff}").unwrap_or(cleaned_line);
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
        files_to_try.push("SChinese.dat".to_string());
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
) -> Option<(String, String)> {
    // 1. English as base
    let (eng_name, eng_desc) = load_specific_translation(dir, "English");

    let mut chi_name = String::new();
    let mut chi_desc = String::new();

    if preferred_lang == "Chinese" {
        // 2a. Try ChineseLocalMod override
        if let Some(mod_root) = mod_path {
            if let Ok(rel_path) =
                dir.strip_prefix(bundles_root.parent().unwrap_or(bundles_root))
            {
                let mod_dir = mod_root.join(rel_path);
                let translation_files =
                    vec!["Schinese.dat", "SChinese.dat", "Simplified_Chinese.dat", "Chinese.dat"];
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
    }

    // If neither English nor Chinese translation exists, skip this item
    if eng_name.is_empty() && chi_name.is_empty() {
        return None;
    }

    // 3. Combine or return
    if !chi_name.is_empty() && !eng_name.is_empty() && chi_name.to_lowercase() != eng_name.to_lowercase() {
        let combined_name = format!("{} ({})", eng_name, chi_name);
        let desc = if !chi_desc.is_empty() { chi_desc } else { eng_desc };
        Some((combined_name, desc))
    } else if !chi_name.is_empty() {
        let desc = if !chi_desc.is_empty() { chi_desc } else { eng_desc };
        Some((chi_name, desc))
    } else {
        Some((eng_name, eng_desc))
    }
}

// ── Blueprint Parsing Helpers ──────────────────────────────────────────────────

fn tokenize(input: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut chars = input.chars().peekable();
    while let Some(&c) = chars.peek() {
        if c.is_whitespace() {
            chars.next();
        } else if c == '{' || c == '}' || c == '[' || c == ']' {
            tokens.push(c.to_string());
            chars.next();
        } else if c == '"' {
            chars.next(); // consume opening quote
            let mut s = String::new();
            while let Some(&nc) = chars.peek() {
                if nc == '"' {
                    chars.next(); // consume closing quote
                    break;
                } else {
                    s.push(chars.next().unwrap());
                }
            }
            tokens.push(s);
        } else {
            let mut s = String::new();
            while let Some(&nc) = chars.peek() {
                if nc.is_whitespace() || nc == '{' || nc == '}' || nc == '[' || nc == ']' || nc == '"' {
                    break;
                }
                s.push(chars.next().unwrap());
            }
            tokens.push(s);
        }
    }
    tokens
}

fn parse_item_qty_str(s: &str) -> BlueprintItem {
    let s = s.trim();
    if s.contains(" x ") {
        let parts: Vec<&str> = s.split(" x ").collect();
        let id_or_guid = parts[0].trim().to_string();
        let amount = parts[1].trim().parse::<u32>().unwrap_or(1);
        BlueprintItem {
            id_or_guid,
            amount,
            is_tool: false,
        }
    } else {
        BlueprintItem {
            id_or_guid: s.to_string(),
            amount: 1,
            is_tool: false,
        }
    }
}

fn parse_single_blueprint(tokens: &[String]) -> Option<Blueprint> {
    let mut inputs = Vec::new();
    let mut outputs = Vec::new();
    let mut category = String::new();
    let mut skill_level = None;
    
    let mut j = 0;
    while j < tokens.len() {
        let key = &tokens[j];
        if key == "CategoryTag" || key == "Type" {
            if j + 1 < tokens.len() {
                category = tokens[j + 1].clone();
                j += 2;
            } else {
                j += 1;
            }
        } else if key == "Build" {
            if j + 1 < tokens.len() {
                if let Ok(lvl) = tokens[j + 1].parse::<u32>() {
                    skill_level = Some(lvl);
                }
                j += 2;
            } else {
                j += 1;
            }
        } else if key == "InputItems" {
            j += 1;
            if j < tokens.len() {
                if tokens[j] == "[" {
                    j += 1;
                    while j < tokens.len() && tokens[j] != "]" {
                        if tokens[j] == "{" {
                            j += 1;
                            let mut item_id = String::new();
                            let mut amount = 1;
                            let mut is_tool = false;
                            while j < tokens.len() && tokens[j] != "}" {
                                let sub_key = &tokens[j];
                                if sub_key == "ID" || sub_key == "Guid" {
                                    if j + 1 < tokens.len() {
                                        item_id = tokens[j + 1].clone();
                                        j += 2;
                                    } else {
                                        j += 1;
                                    }
                                } else if sub_key == "Amount" {
                                    if j + 1 < tokens.len() {
                                        if let Ok(amt) = tokens[j + 1].parse::<u32>() {
                                            amount = amt;
                                        }
                                        j += 2;
                                    } else {
                                        j += 1;
                                    }
                                } else if sub_key == "Delete" {
                                    if j + 1 < tokens.len() {
                                        if tokens[j + 1] == "false" {
                                            is_tool = true;
                                        }
                                        j += 2;
                                    } else {
                                        j += 1;
                                    }
                                } else {
                                    j += 1;
                                }
                            }
                            if !item_id.is_empty() {
                                inputs.push(BlueprintItem {
                                    id_or_guid: item_id,
                                    amount,
                                    is_tool,
                                });
                            }
                            if j < tokens.len() && tokens[j] == "}" {
                                j += 1;
                            }
                        } else {
                            j += 1;
                        }
                    }
                    if j < tokens.len() && tokens[j] == "]" {
                        j += 1;
                    }
                } else {
                    let val = &tokens[j];
                    inputs.push(parse_item_qty_str(val));
                    j += 1;
                }
            }
        } else if key == "OutputItems" {
            j += 1;
            if j < tokens.len() {
                if tokens[j] == "[" {
                    j += 1;
                    while j < tokens.len() && tokens[j] != "]" {
                        if tokens[j] == "{" {
                            j += 1;
                            let mut item_id = String::new();
                            let mut amount = 1;
                            while j < tokens.len() && tokens[j] != "}" {
                                let sub_key = &tokens[j];
                                if sub_key == "ID" || sub_key == "Guid" {
                                    if j + 1 < tokens.len() {
                                        item_id = tokens[j + 1].clone();
                                        j += 2;
                                    } else {
                                        j += 1;
                                    }
                                } else if sub_key == "Amount" {
                                    if j + 1 < tokens.len() {
                                        if let Ok(amt) = tokens[j + 1].parse::<u32>() {
                                            amount = amt;
                                        }
                                        j += 2;
                                    } else {
                                        j += 1;
                                    }
                                } else {
                                    j += 1;
                                }
                            }
                            if !item_id.is_empty() {
                                outputs.push(BlueprintItem {
                                    id_or_guid: item_id,
                                    amount,
                                    is_tool: false,
                                });
                            }
                            if j < tokens.len() && tokens[j] == "}" {
                                j += 1;
                            }
                        } else {
                            j += 1;
                        }
                    }
                    if j < tokens.len() && tokens[j] == "]" {
                        j += 1;
                    }
                } else {
                    let val = &tokens[j];
                    outputs.push(parse_item_qty_str(val));
                    j += 1;
                }
            }
        } else {
            j += 1;
        }
    }
    
    let skill = match skill_level {
        Some(1) => Some("Crafting I".to_string()),
        Some(2) => Some("Crafting II".to_string()),
        Some(3) => Some("Crafting III".to_string()),
        _ => None,
    };

    Some(Blueprint {
        inputs,
        outputs,
        type_or_category: category,
        skill,
        skill_level,
        map_index: None,
    })
}

fn parse_blueprints_from_tokens(tokens: &[String]) -> Vec<Blueprint> {
    let mut blueprints = Vec::new();
    let mut i = 0;
    while i < tokens.len() {
        if tokens[i] == "{" {
            i += 1;
            let mut blueprint_tokens = Vec::new();
            let mut brace_count = 1;
            while i < tokens.len() {
                if tokens[i] == "{" {
                    brace_count += 1;
                } else if tokens[i] == "}" {
                    brace_count -= 1;
                    if brace_count == 0 {
                        i += 1;
                        break;
                    }
                }
                blueprint_tokens.push(tokens[i].clone());
                i += 1;
            }
            if let Some(bp) = parse_single_blueprint(&blueprint_tokens) {
                blueprints.push(bp);
            }
        } else {
            i += 1;
        }
    }
    blueprints
}

fn parse_old_blueprints(properties: &HashMap<String, String>) -> Vec<Blueprint> {
    let mut blueprints = Vec::new();
    let mut bp_idx = 0;
    
    while properties.contains_key(&format!("Blueprint_{}_Type", bp_idx)) {
        let prefix = format!("Blueprint_{}_", bp_idx);
        let bp_type = properties.get(&format!("{}Type", prefix)).cloned().unwrap_or_default();
        
        let mut inputs = Vec::new();
        let mut outputs = Vec::new();
        
        let supplies_count = properties
            .get(&format!("{}Supplies", prefix))
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(0);
            
        for s_idx in 0..supplies_count {
            let supply_prefix = format!("{}Supply_{}_", prefix, s_idx);
            if let Some(s_id) = properties.get(&format!("{}ID", supply_prefix)) {
                let amount = properties
                    .get(&format!("{}Amount", supply_prefix))
                    .and_then(|s| s.parse::<u32>().ok())
                    .unwrap_or(1);
                inputs.push(BlueprintItem {
                    id_or_guid: s_id.clone(),
                    amount,
                    is_tool: false,
                });
            }
        }
        
        if supplies_count == 0 {
            let supply_prefix = format!("{}Supply_0_", prefix);
            if let Some(s_id) = properties.get(&format!("{}ID", supply_prefix)) {
                let amount = properties
                    .get(&format!("{}Amount", supply_prefix))
                    .and_then(|s| s.parse::<u32>().ok())
                    .unwrap_or(1);
                inputs.push(BlueprintItem {
                    id_or_guid: s_id.clone(),
                    amount,
                    is_tool: false,
                });
            }
        }
        
        if let Some(t_id) = properties.get(&format!("{}Tool", prefix)) {
            inputs.push(BlueprintItem {
                id_or_guid: t_id.clone(),
                amount: 1,
                is_tool: true,
            });
        }
        
        let mut product_id = "this".to_string();
        if let Some(prod_id) = properties.get(&format!("{}Product", prefix)) {
            product_id = prod_id.clone();
        }
        
        let amount = properties
            .get(&format!("{}Amount", prefix))
            .and_then(|s| s.parse::<u32>().ok())
            .or_else(|| {
                properties.get(&format!("{}Products", prefix)).and_then(|s| s.parse::<u32>().ok())
            })
            .unwrap_or(1);
            
        outputs.push(BlueprintItem {
            id_or_guid: product_id,
            amount,
            is_tool: false,
        });
        
        let skill_level = properties
            .get(&format!("{}Build", prefix))
            .and_then(|s| s.parse::<u32>().ok());
            
        let skill = match skill_level {
            Some(1) => Some("Crafting I".to_string()),
            Some(2) => Some("Crafting II".to_string()),
            Some(3) => Some("Crafting III".to_string()),
            _ => None,
        };
        
        blueprints.push(Blueprint {
            inputs,
            outputs,
            type_or_category: bp_type,
            skill,
            skill_level,
            map_index: Some(bp_idx),
        });
        
        bp_idx += 1;
    }
    blueprints
}

pub fn parse_dat_file_with_blueprints(
    path: &Path,
) -> (Option<String>, Vec<Blueprint>, HashMap<String, String>) {
    let mut properties = HashMap::new();
    let mut guid = None;
    let mut blueprints = Vec::new();
    
    if let Ok(file) = File::open(path) {
        let reader = BufReader::new(file);
        
        let mut inside_blueprints_block = false;
        let mut blueprints_block_text = String::new();
        let mut bracket_count = 0;
        
        for line in reader.lines().map_while(Result::ok) {
            let cleaned_line = if let Some(idx) = line.find("//") {
                &line[..idx]
            } else {
                &line
            };
            let cleaned_line = cleaned_line.trim();
            let cleaned_line = cleaned_line.strip_prefix("\u{feff}").unwrap_or(cleaned_line);
            if cleaned_line.is_empty() {
                continue;
            }
            
            if inside_blueprints_block {
                blueprints_block_text.push_str(cleaned_line);
                blueprints_block_text.push(' ');
                
                for c in cleaned_line.chars() {
                    if c == '[' {
                        bracket_count += 1;
                    } else if c == ']' {
                        bracket_count -= 1;
                    }
                }
                
                if bracket_count <= 0 {
                    inside_blueprints_block = false;
                    let tokens = tokenize(&blueprints_block_text);
                    blueprints.extend(parse_blueprints_from_tokens(&tokens));
                }
                continue;
            }
            
            if cleaned_line == "Blueprints" {
                inside_blueprints_block = true;
                bracket_count = 0;
                blueprints_block_text.clear();
                continue;
            }
            
            if cleaned_line.starts_with("Blueprints") && cleaned_line.contains('[') {
                inside_blueprints_block = true;
                bracket_count = 0;
                blueprints_block_text.clear();
                let bp_part = &cleaned_line["Blueprints".len()..];
                blueprints_block_text.push_str(bp_part);
                blueprints_block_text.push(' ');
                for c in bp_part.chars() {
                    if c == '[' {
                        bracket_count += 1;
                    } else if c == ']' {
                        bracket_count -= 1;
                    }
                }
                if bracket_count <= 0 {
                    inside_blueprints_block = false;
                    let tokens = tokenize(&blueprints_block_text);
                    blueprints.extend(parse_blueprints_from_tokens(&tokens));
                }
                continue;
            }
            
            let parts: Vec<&str> = cleaned_line.split_whitespace().collect();
            if parts.len() >= 2 {
                let key = parts[0].to_string();
                let val = parts[1..].join(" ");
                
                if key == "GUID" {
                    guid = Some(val.clone());
                }
                properties.insert(key, val);
            }
        }
        
        let old_bps = parse_old_blueprints(&properties);
        blueprints.extend(old_bps);
    }
    
    (guid, blueprints, properties)
}

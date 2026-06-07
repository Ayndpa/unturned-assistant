mod commands;
mod dat_parser;
mod models;

use commands::{ime::*, item_index::*, localization::*, pagefile::*};

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
            is_localization_installed,
            check_ime_compatibility,
            set_ime_compatibility,
            restart_ime,
            get_pagefile_status,
            set_custom_pagefile,
            set_automatic_pagefile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

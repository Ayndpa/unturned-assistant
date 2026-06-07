mod commands;
mod dat_parser;
mod models;

use commands::{ime::*, item_index::*, localization::*, pagefile::*, theme::*};
use tauri::{webview::Color, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_acrylic;

                let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
                // 使用极低透明度的叠加色，实现清澈的亚克力效果
                let _ = apply_acrylic(&window, Some((20, 20, 20, 1)));
                let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
            }

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                let _ = apply_vibrancy(&window, NSVisualEffectMaterial::AppearanceBased, None, None);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            pick_folder,
            scan_unturned_directory,
            load_cached_index,
            verify_unturned_path,
            resolve_item_icon,
            index_game_images,
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
            get_windows_accent_color,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

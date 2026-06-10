#[tauri::command]
pub fn get_windows_accent_color() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;

        let run_reg = |key: &str, value: &str| -> Option<u32> {
            let output = Command::new("reg")
                .args(&["query", key, "/v", value])
                .creation_flags(0x08000000) // CREATE_NO_WINDOW
                .output()
                .ok()?;
            if !output.status.success() {
                return None;
            }
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains(value) {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 3 {
                        let hex_str = parts[2].trim_start_matches("0x");
                        if let Ok(val) = u32::from_str_radix(hex_str, 16) {
                            return Some(val);
                        }
                    }
                }
            }
            None
        };

        if let Some(val) = run_reg("HKCU\\Software\\Microsoft\\Windows\\DWM", "AccentColor") {
            let r = (val & 0xFF) as u8;
            let g = ((val >> 8) & 0xFF) as u8;
            let b = ((val >> 16) & 0xFF) as u8;
            return Ok(format!("#{:02x}{:02x}{:02x}", r, g, b));
        }

        if let Some(val) = run_reg(
            "HKCU\\Software\\Microsoft\\Windows\\DWM",
            "ColorizationColor",
        ) {
            let r = ((val >> 16) & 0xFF) as u8;
            let g = ((val >> 8) & 0xFF) as u8;
            let b = (val & 0xFF) as u8;
            return Ok(format!("#{:02x}{:02x}{:02x}", r, g, b));
        }
    }

    Ok("#0078d4".to_string())
}

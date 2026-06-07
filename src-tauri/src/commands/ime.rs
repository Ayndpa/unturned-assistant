/// Query whether the Microsoft Pinyin IME is in legacy compatibility mode.
#[tauri::command]
pub async fn check_ime_compatibility() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let output = Command::new("reg")
            .args(&[
                "query",
                r"HKCU\Software\Policies\Microsoft\InputMethod\Settings\CHS",
                "/v",
                "ConfigureImeVersion",
            ])
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    if stdout.contains("0x1") {
                        return Ok(true);
                    }
                }
                Ok(false)
            }
            Err(e) => Err(format!("查询注册表失败: {}", e)),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

/// Enable or disable Microsoft IME legacy compatibility mode.
#[tauri::command]
pub async fn set_ime_compatibility(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        let args = if enabled {
            "Start-Process powershell -ArgumentList '-NoProfile -WindowStyle Hidden -Command & { \
             reg add \"HKCU\\Software\\Policies\\Microsoft\\InputMethod\\Settings\\CHS\" /v ConfigureImeVersion /t REG_DWORD /d 1 /f; \
             reg add \"HKCU\\Software\\Policies\\Microsoft\\InputMethod\\Settings\\CHT\" /v ConfigureImeVersion /t REG_DWORD /d 1 /f \
             }' -Verb RunAs -WindowStyle Hidden"
        } else {
            "Start-Process powershell -ArgumentList '-NoProfile -WindowStyle Hidden -Command & { \
             reg delete \"HKCU\\Software\\Policies\\Microsoft\\InputMethod\\Settings\\CHS\" /v ConfigureImeVersion /f; \
             reg delete \"HKCU\\Software\\Policies\\Microsoft\\InputMethod\\Settings\\CHT\" /v ConfigureImeVersion /f \
             }' -Verb RunAs -WindowStyle Hidden"
        };

        let output = Command::new("powershell")
            .args(&["-NoProfile", "-WindowStyle", "Hidden", "-Command", args])
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    Ok(())
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    Err(format!("执行提权命令失败: {}", stderr))
                }
            }
            Err(e) => Err(format!("启动 PowerShell 失败: {}", e)),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("该功能仅支持 Windows 系统。".to_string())
    }
}

/// Kill the IME processes, clear the cache, and restart ctfmon.exe.
#[tauri::command]
pub async fn restart_ime() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::path::Path;
        use std::process::Command;
        use std::thread;
        use std::time::Duration;

        // 1. Kill IME-related processes to release file locks
        let _ = Command::new("taskkill")
            .args(&["/f", "/im", "TextInputHost.exe"])
            .output();
        let _ = Command::new("taskkill")
            .args(&["/f", "/im", "ChsIME.exe"])
            .output();
        let _ = Command::new("taskkill")
            .args(&["/f", "/im", "ctfmon.exe"])
            .output();

        thread::sleep(Duration::from_millis(500));

        // 2. Delete the IME cache directory
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let cache_dir = Path::new(&local_app_data)
                .join("Packages")
                .join("MicrosoftWindows.Client.CBS_cw5n1h2txyewy")
                .join("LocalState")
                .join("InputMethod");
            if cache_dir.exists() {
                let _ = std::fs::remove_dir_all(&cache_dir);
            }
        }

        thread::sleep(Duration::from_millis(300));

        // 3. Restart ctfmon.exe
        let output = Command::new("cmd")
            .args(&["/c", "start ctfmon.exe"])
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    Ok(())
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    Err(format!("启动 ctfmon.exe 失败: {}", stderr))
                }
            }
            Err(e) => Err(format!("执行重启命令失败: {}", e)),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("该功能仅支持 Windows 系统。".to_string())
    }
}

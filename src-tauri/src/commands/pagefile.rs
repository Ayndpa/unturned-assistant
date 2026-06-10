use crate::models::{DiskInfo, PageFileEntry, SystemPageFileStatus};

/// Query all local fixed disks and the current pagefile configuration.
#[tauri::command]
pub async fn get_pagefile_status() -> Result<SystemPageFileStatus, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;

        // ── Disk info ────────────────────────────────────────────────────────
        let disk_output = Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-WindowStyle",
                "Hidden",
                "-Command",
                "Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' \
                 | Select-Object DeviceID, FreeSpace, Size \
                 | ConvertTo-Json -Compress",
            ])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("无法查询磁盘信息: {}", e))?;

        let disk_json = String::from_utf8_lossy(&disk_output.stdout);
        let disk_json = disk_json.trim();

        // ── Pagefile info ────────────────────────────────────────────────────
        let pf_output = Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-WindowStyle",
                "Hidden",
                "-Command",
                "$auto = (Get-CimInstance Win32_ComputerSystem).AutomaticManagedPagefile; \
                 $files = Get-CimInstance Win32_PageFileSetting \
                   | Select-Object Name, InitialSize, MaximumSize \
                   | ConvertTo-Json -Compress; \
                 Write-Output ($auto.ToString() + '|' + $files)",
            ])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("无法查询虚拟内存配置: {}", e))?;

        let pf_raw = String::from_utf8_lossy(&pf_output.stdout);
        let pf_raw = pf_raw.trim();

        // Parse automatic flag and pagefile entries
        let (auto_str, pf_json) = if let Some(pos) = pf_raw.find('|') {
            (&pf_raw[..pos], &pf_raw[pos + 1..])
        } else {
            (pf_raw.as_ref(), "")
        };
        let automatic_managed = auto_str.trim().eq_ignore_ascii_case("true");

        let page_files: Vec<PageFileEntry> = if pf_json.is_empty() || pf_json == "null" {
            vec![]
        } else if pf_json.starts_with('[') {
            let raw: Vec<serde_json::Value> = serde_json::from_str(pf_json).unwrap_or_default();
            raw.iter()
                .map(|v| PageFileEntry {
                    name: v["Name"].as_str().unwrap_or("").to_string(),
                    initial_size_mb: v["InitialSize"].as_u64().unwrap_or(0),
                    maximum_size_mb: v["MaximumSize"].as_u64().unwrap_or(0),
                })
                .collect()
        } else {
            let raw: serde_json::Value =
                serde_json::from_str(pf_json).unwrap_or(serde_json::Value::Null);
            if raw.is_null() {
                vec![]
            } else {
                vec![PageFileEntry {
                    name: raw["Name"].as_str().unwrap_or("").to_string(),
                    initial_size_mb: raw["InitialSize"].as_u64().unwrap_or(0),
                    maximum_size_mb: raw["MaximumSize"].as_u64().unwrap_or(0),
                }]
            }
        };

        // Parse disk list
        let disk_values: Vec<serde_json::Value> = if disk_json.starts_with('[') {
            serde_json::from_str(disk_json).unwrap_or_default()
        } else if disk_json.starts_with('{') {
            let v: serde_json::Value = serde_json::from_str(disk_json).unwrap_or_default();
            vec![v]
        } else {
            vec![]
        };

        let max_free = disk_values
            .iter()
            .map(|v| v["FreeSpace"].as_u64().unwrap_or(0))
            .max()
            .unwrap_or(0);

        let disks: Vec<DiskInfo> = disk_values
            .iter()
            .map(|v| {
                let free = v["FreeSpace"].as_u64().unwrap_or(0);
                let total = v["Size"].as_u64().unwrap_or(0);
                DiskInfo {
                    device_id: v["DeviceID"].as_str().unwrap_or("").to_string(),
                    free_space_gb: free as f64 / 1_073_741_824.0,
                    total_size_gb: total as f64 / 1_073_741_824.0,
                    is_recommended: free == max_free && max_free > 0,
                }
            })
            .collect();

        Ok(SystemPageFileStatus {
            automatic_managed,
            page_files,
            disks,
        })
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(SystemPageFileStatus {
            automatic_managed: true,
            page_files: vec![],
            disks: vec![],
        })
    }
}

/// Set a fixed 8 GB pagefile on the disk with the most free space.
#[tauri::command]
pub async fn set_custom_pagefile() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::io::Write;
        use std::os::windows::process::CommandExt;
        use std::process::Command;

        let script_lines = [
            "$cs = Get-CimInstance Win32_ComputerSystem",
            "$cs.AutomaticManagedPagefile = $False",
            "Set-CimInstance -InputObject $cs",
            "$existing = Get-CimInstance Win32_PageFileSetting",
            "if ($existing) { $existing | Remove-CimInstance }",
            "$best = Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' \
             | Sort-Object FreeSpace -Descending | Select-Object -First 1",
            "$drive = $best.DeviceID",
            r#"$pfName = "$drive\pagefile.sys""#,
            "New-CimInstance -ClassName Win32_PageFileSetting \
             -Property @{ Name = $pfName; InitialSize = 8192; MaximumSize = 8192 } | Out-Null",
            "exit 0",
        ];
        let script = script_lines.join("\r\n");

        let tmp_path = std::env::temp_dir().join("ua_set_pagefile.ps1");
        {
            let mut f = std::fs::File::create(&tmp_path)
                .map_err(|e| format!("无法创建临时脚本文件: {}", e))?;
            f.write_all(script.as_bytes())
                .map_err(|e| format!("写入临时脚本失败: {}", e))?;
        }

        let ps_path = tmp_path.to_string_lossy().to_string();
        let cmd = format!(
            "Start-Process powershell -ArgumentList \"-NoProfile -ExecutionPolicy Bypass -File '{}'\" -Verb RunAs -Wait",
            ps_path
        );

        let output = Command::new("powershell")
            .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &cmd])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("启动 PowerShell 失败: {}", e))?;

        let _ = std::fs::remove_file(&tmp_path);

        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("设置虚拟内存失败: {}", stderr))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("该功能仅支持 Windows 系统。".to_string())
    }
}

/// Restore Windows automatic pagefile management.
#[tauri::command]
pub async fn set_automatic_pagefile() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::io::Write;
        use std::os::windows::process::CommandExt;
        use std::process::Command;

        let script_lines = [
            "$cs = Get-CimInstance Win32_ComputerSystem",
            "$cs.AutomaticManagedPagefile = $True",
            "Set-CimInstance -InputObject $cs",
            "exit 0",
        ];
        let script = script_lines.join("\r\n");

        let tmp_path = std::env::temp_dir().join("ua_auto_pagefile.ps1");
        {
            let mut f = std::fs::File::create(&tmp_path)
                .map_err(|e| format!("无法创建临时脚本文件: {}", e))?;
            f.write_all(script.as_bytes())
                .map_err(|e| format!("写入临时脚本失败: {}", e))?;
        }

        let ps_path = tmp_path.to_string_lossy().to_string();
        let cmd = format!(
            "Start-Process powershell -ArgumentList \"-NoProfile -ExecutionPolicy Bypass -File '{}'\" -Verb RunAs -Wait",
            ps_path
        );

        let output = Command::new("powershell")
            .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &cmd])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("启动 PowerShell 失败: {}", e))?;

        let _ = std::fs::remove_file(&tmp_path);

        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("恢复自动管理失败: {}", stderr))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("该功能仅支持 Windows 系统。".to_string())
    }
}

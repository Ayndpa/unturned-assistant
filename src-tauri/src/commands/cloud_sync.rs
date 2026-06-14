use std::collections::HashMap;
use std::fs;

use libsql::{Builder, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::Emitter;

use crate::models::{SyncResult, UnturnedItem};

// ── Configuration ──────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct TursoConfig {
    url: String,
    token: String,
}

/// Read Turso credentials. Priority:
/// 1. `turso_config.json` in current directory or parent directories
/// 2. Compile-time environment variables (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN)
fn get_turso_config() -> Option<(String, String)> {
    let search_dirs = [
        std::path::PathBuf::from("turso_config.json"),
        std::path::PathBuf::from("../turso_config.json"),
        std::path::PathBuf::from("../../turso_config.json"),
    ];

    for path in &search_dirs {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<TursoConfig>(&content) {
                    if !config.url.is_empty() && !config.token.is_empty() {
                        return Some((config.url, config.token));
                    }
                }
            }
        }
    }

    let url = option_env!("TURSO_DATABASE_URL")?.to_string();
    let token = option_env!("TURSO_AUTH_TOKEN")?.to_string();
    if url.is_empty() || token.is_empty() {
        return None;
    }
    Some((url, token))
}

/// Convert libsql:// URL to https:// URL for HTTP API calls.
fn libsql_to_http_url(url: &str) -> String {
    url.replacen("libsql://", "https://", 1)
}

/// Create a connection to the remote Turso database (for queries).
async fn create_turso_connection() -> Result<Connection, String> {
    let (url, token) = get_turso_config().ok_or(
        "Turso 数据库配置缺失：请在 src-tauri/ 下创建 turso_config.json 或设置环境变量。",
    )?;

    let db = Builder::new_remote(url, token)
        .build()
        .await
        .map_err(|e| format!("无法连接 Turso 数据库: {}", e))?;

    let conn = db
        .connect()
        .map_err(|e| format!("无法建立数据库连接: {}", e))?;

    Ok(conn)
}

/// Ensure the `items` table exists with bilingual columns and workshop_id composite key.
async fn ensure_table(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS items (
            id              INTEGER,
            workshop_id     TEXT NOT NULL DEFAULT '',
            guid            TEXT,
            name_en         TEXT NOT NULL DEFAULT '',
            name_cn         TEXT NOT NULL DEFAULT '',
            category        TEXT NOT NULL,
            description_en  TEXT NOT NULL DEFAULT '',
            description_cn  TEXT NOT NULL DEFAULT '',
            rarity          TEXT NOT NULL DEFAULT 'Common',
            blueprints      TEXT,
            PRIMARY KEY (id, workshop_id)
        )",
        (),
    )
    .await
    .map_err(|e| format!("创建表失败: {}", e))?;
    Ok(())
}

// ── Serialization helpers ──────────────────────────────────────────────────────

fn blueprints_to_json(blueprints: &Option<Vec<crate::models::Blueprint>>) -> Option<String> {
    blueprints
        .as_ref()
        .and_then(|bp| serde_json::to_string(bp).ok())
}

fn json_to_blueprints(json: Option<&str>) -> Option<Vec<crate::models::Blueprint>> {
    json.and_then(|s| serde_json::from_str(s).ok())
}

/// Split a combined display name like "Work Jeans (工穿牛仔裤（4x3）)" into (English, Chinese).
fn split_bilingual_name(name: &str, is_chinese: bool) -> (String, String) {
    if let Some(pos) = name.rfind(" (") {
        if name.ends_with(')') && pos > 0 {
            let en_part = name[..pos].to_string();
            let cn_part = name[pos + 2..name.len() - 1].to_string();
            return (en_part, cn_part);
        }
    }
    if is_chinese {
        (String::new(), name.to_string())
    } else {
        (name.to_string(), String::new())
    }
}

// ── Pipeline API helpers ──────────────────────────────────────────────────────

fn sql_value(val: &str) -> Value {
    json!({"type": "text", "value": val})
}

fn sql_null() -> Value {
    json!({"type": "null"})
}

fn sql_int(val: i64) -> Value {
    json!({"type": "integer", "value": val.to_string()})
}

/// Execute multiple SQL statements in a single Turso pipeline HTTP request.
/// Each entry in `stmts` is (sql, args_json_array).
async fn execute_pipeline(
    url: &str,
    token: &str,
    stmts: Vec<(String, Vec<Value>)>,
) -> Result<(), String> {
    let http_url = libsql_to_http_url(url);
    let endpoint = format!("{}/v2/pipeline", http_url);

    let requests: Vec<Value> = stmts
        .into_iter()
        .map(|(sql, args)| {
            json!({
                "type": "execute",
                "stmt": {
                    "sql": sql,
                    "args": args
                }
            })
        })
        .collect();

    let body = json!({ "requests": requests });

    let client = reqwest::Client::new();
    let resp = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Pipeline 请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Pipeline 请求失败 ({}): {}", status, text));
    }

    // Check for errors in the response
    let resp_body: Value = resp
        .json()
        .await
        .map_err(|e| format!("解析 Pipeline 响应失败: {}", e))?;

    if let Some(results) = resp_body.get("results").and_then(|r| r.as_array()) {
        for (i, result) in results.iter().enumerate() {
            if let Some(err) = result.get("error") {
                return Err(format!("语句 {} 执行失败: {}", i, err));
            }
        }
    }

    Ok(())
}

// ── Cloud sync commands ───────────────────────────────────────────────────────

/// Load all items from the Turso cloud database.
#[tauri::command]
pub async fn load_cloud_index(preferred_lang: String) -> Result<Vec<UnturnedItem>, String> {
    let conn = create_turso_connection().await?;
    ensure_table(&conn).await?;

    let is_chinese = preferred_lang.to_lowercase().contains("chinese");

    let sql = if is_chinese {
        "SELECT id, workshop_id, guid,
            CASE WHEN name_cn != '' THEN name_cn ELSE name_en END as name,
            category,
            CASE WHEN description_cn != '' THEN description_cn ELSE description_en END as description,
            rarity, blueprints
        FROM items ORDER BY workshop_id, id"
    } else {
        "SELECT id, workshop_id, guid,
            CASE WHEN name_en != '' THEN name_en ELSE name_cn END as name,
            category,
            CASE WHEN description_en != '' THEN description_en ELSE description_cn END as description,
            rarity, blueprints
        FROM items ORDER BY workshop_id, id"
    };

    let mut rows = conn
        .query(sql, ())
        .await
        .map_err(|e| format!("查询云端数据失败: {}", e))?;

    let mut items = Vec::new();

    while let Some(row) = rows
        .next()
        .await
        .map_err(|e| format!("读取云端数据行失败: {}", e))?
    {
        let id: i64 = row.get(0).map_err(|e| format!("读取 id 失败: {}", e))?;
        let workshop_id: String =
            row.get(1).map_err(|e| format!("读取 workshop_id 失败: {}", e))?;
        let guid: Option<String> = row.get(2).map_err(|e| format!("读取 guid 失败: {}", e))?;
        let name: String = row.get(3).map_err(|e| format!("读取 name 失败: {}", e))?;
        let category: String = row.get(4).map_err(|e| format!("读取 category 失败: {}", e))?;
        let description: String =
            row.get(5).map_err(|e| format!("读取 description 失败: {}", e))?;
        let rarity: String = row.get(6).map_err(|e| format!("读取 rarity 失败: {}", e))?;
        let blueprints_json: Option<String> =
            row.get(7).map_err(|e| format!("读取 blueprints 失败: {}", e))?;

        items.push(UnturnedItem {
            id: id as u32,
            guid,
            name,
            category,
            description,
            rarity,
            blueprints: json_to_blueprints(blueprints_json.as_deref()),
            workshop_id: if workshop_id.is_empty() {
                None
            } else {
                Some(workshop_id)
            },
        });
    }

    Ok(items)
}

/// Sync local items to the cloud database.
/// Uses Turso pipeline API to batch multiple INSERTs in a single HTTP request.
#[tauri::command]
pub async fn sync_local_to_cloud(
    window: tauri::Window,
    items: Vec<UnturnedItem>,
    preferred_lang: String,
) -> Result<SyncResult, String> {
    let (url, token) = get_turso_config().ok_or("Turso 配置缺失")?;

    let conn = create_turso_connection().await?;
    ensure_table(&conn).await?;

    let is_chinese = preferred_lang.to_lowercase().contains("chinese");

    // Step 1: Query all existing (id, workshop_id) pairs from the cloud
    let mut rows = conn
        .query("SELECT id, workshop_id FROM items", ())
        .await
        .map_err(|e| format!("查询云端已有 ID 失败: {}", e))?;

    let mut cloud_keys: HashMap<String, bool> = HashMap::new();
    while let Some(row) = rows
        .next()
        .await
        .map_err(|e| format!("读取云端 ID 行失败: {}", e))?
    {
        let id: i64 = row.get(0).map_err(|e| format!("读取 id 失败: {}", e))?;
        let wid: String = row.get(1).map_err(|e| format!("读取 workshop_id 失败: {}", e))?;
        cloud_keys.insert(format!("{}:{}", id, wid), true);
    }

    // Step 2: Compute diff and categorize
    let mut new_items: Vec<&UnturnedItem> = Vec::new();
    let mut existing_items: Vec<&UnturnedItem> = Vec::new();

    for item in &items {
        let wid = item.workshop_id.as_deref().unwrap_or("");
        if cloud_keys.contains_key(&format!("{}:{}", item.id, wid)) {
            existing_items.push(item);
        } else {
            new_items.push(item);
        }
    }

    let total_to_process = items.len();

    if total_to_process == 0 {
        let _ = window.emit(
            "cloud-sync-progress",
            CloudSyncProgress {
                current: 0,
                total: 0,
                message: "本地无数据，跳过同步。".to_string(),
            },
        );
        return Ok(SyncResult {
            uploaded: 0,
            skipped: 0,
        });
    }

    // Step 3: Batch INSERT new items via pipeline API (100 per request)
    let pipeline_batch = 100;
    let mut uploaded: usize = 0;

    for chunk in new_items.chunks(pipeline_batch) {
        let mut stmts: Vec<(String, Vec<Value>)> = Vec::with_capacity(chunk.len());

        for item in chunk {
            let workshop_id = item.workshop_id.as_deref().unwrap_or("");
            let (name_en, name_cn) = split_bilingual_name(&item.name, is_chinese);
            let (desc_en, desc_cn) = if is_chinese {
                (String::new(), item.description.clone())
            } else {
                (item.description.clone(), String::new())
            };
            let bp_json = blueprints_to_json(&item.blueprints);

            let sql = "INSERT OR IGNORE INTO items (id, workshop_id, guid, name_en, name_cn, category, description_en, description_cn, rarity, blueprints) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)".to_string();
            let args = vec![
                sql_int(item.id as i64),
                sql_value(workshop_id),
                match &item.guid {
                    Some(g) => sql_value(g),
                    None => sql_null(),
                },
                sql_value(&name_en),
                sql_value(&name_cn),
                sql_value(&item.category),
                sql_value(&desc_en),
                sql_value(&desc_cn),
                sql_value(&item.rarity),
                match bp_json.as_deref() {
                    Some(b) => sql_value(b),
                    None => sql_null(),
                },
            ];
            stmts.push((sql, args));
        }

        execute_pipeline(&url, &token, stmts)
            .await
            .map_err(|e| format!("批量插入失败: {}", e))?;

        uploaded += chunk.len();

        let _ = window.emit(
            "cloud-sync-progress",
            CloudSyncProgress {
                current: uploaded,
                total: total_to_process,
                message: format!("已同步 {} / {} 条到云端...", uploaded, total_to_process),
            },
        );
    }

    // Step 4: Batch UPDATE existing items via pipeline API
    let mut updated: usize = 0;
    for chunk in existing_items.chunks(pipeline_batch) {
        let mut stmts: Vec<(String, Vec<Value>)> = Vec::with_capacity(chunk.len());

        for item in chunk {
            let workshop_id = item.workshop_id.as_deref().unwrap_or("");
            let (name_en, name_cn) = split_bilingual_name(&item.name, is_chinese);
            let (desc_en, desc_cn) = if is_chinese {
                (String::new(), item.description.clone())
            } else {
                (item.description.clone(), String::new())
            };
            let bp_json = blueprints_to_json(&item.blueprints);

            let sql = "UPDATE items SET
                name_en = CASE WHEN name_en = '' THEN ?3 ELSE name_en END,
                name_cn = CASE WHEN name_cn = '' THEN ?4 ELSE name_cn END,
                description_en = CASE WHEN description_en = '' THEN ?5 ELSE description_en END,
                description_cn = CASE WHEN description_cn = '' THEN ?6 ELSE description_cn END,
                guid = COALESCE(?7, guid),
                rarity = ?8,
                blueprints = COALESCE(?9, blueprints)
            WHERE id = ?1 AND workshop_id = ?2"
                .to_string();
            let args = vec![
                sql_int(item.id as i64),
                sql_value(workshop_id),
                sql_value(&name_en),
                sql_value(&name_cn),
                sql_value(&desc_en),
                sql_value(&desc_cn),
                match &item.guid {
                    Some(g) => sql_value(g),
                    None => sql_null(),
                },
                sql_value(&item.rarity),
                match bp_json.as_deref() {
                    Some(b) => sql_value(b),
                    None => sql_null(),
                },
            ];
            stmts.push((sql, args));
        }

        execute_pipeline(&url, &token, stmts)
            .await
            .map_err(|e| format!("批量更新失败: {}", e))?;

        updated += chunk.len();

        let _ = window.emit(
            "cloud-sync-progress",
            CloudSyncProgress {
                current: uploaded + updated,
                total: total_to_process,
                message: format!(
                    "已更新 {} / {} 条云端条目...",
                    updated,
                    existing_items.len()
                ),
            },
        );
    }

    let skipped = existing_items.len() - updated;

    let _ = window.emit(
        "cloud-sync-progress",
        CloudSyncProgress {
            current: total_to_process,
            total: total_to_process,
            message: format!(
                "云同步完成！新增 {} 条，补全 {} 条，跳过 {} 条。",
                uploaded, updated, skipped
            ),
        },
    );

    Ok(SyncResult {
        uploaded: uploaded + updated,
        skipped,
    })
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CloudSyncProgress {
    current: usize,
    total: usize,
    message: String,
}

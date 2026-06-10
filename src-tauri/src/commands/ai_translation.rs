use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::dat_parser::parse_dat_file;

// ── Data Structures ────────────────────────────────────────────────────────────

/// Fields that are candidates for translation (key + english value).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatableField {
    pub key: String,
    pub value: String,
}

/// A directory that has an English.dat but is missing Schinese.dat.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingTranslationItem {
    /// Absolute path to the directory containing English.dat
    pub dir_path: String,
    /// Display name (last path component)
    pub dir_name: String,
    /// Fields parsed from English.dat that should be translated
    pub fields: Vec<TranslatableField>,
}

/// Result of translating and writing a single Schinese.dat
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslationResult {
    pub dir_path: String,
    pub written_path: String,
    pub status: String, // "success" | "error"
    pub error: Option<String>,
}

// ── Translatable keys (fields worth sending to LLM) ───────────────────────────

/// Keys from English.dat that should be translated to Chinese.
/// We skip purely numeric / ID / path / boolean fields.
const TRANSLATABLE_KEYS: &[&str] = &[
    "Name",
    "Description",
    "Use",
    "Eat",
    "Drink",
    "Equip",
    "Dequip",
    "Inspect",
    "Pickup",
    "Place",
    "Drop",
    "Craft",
    "Refill",
    "Lock",
    "Unlock",
    "Enter",
    "Exit",
    "Load",
    "Unload",
    "Plant",
    "Harvest",
    "Repair",
    "Detach",
    "Attach",
    "Fuel",
    "Siphon",
    "Ignite",
    "Douse",
    "Upgrade",
    "Degrade",
    "Convert",
    "Salvage",
    "Research",
    "Extract",
    "Expand",
    "Hack",
    "Disable",
    "Enable",
    "Open",
    "Close",
    "Pet",
    "Tame",
    "Feed",
    "Breed",
    "Hurt",
    "Shear",
    "Milk",
    "Skin",
    "Sit",
];

// ── Helper: check if Chinese translation already exists ────────────────────────

fn has_chinese_translation(dir: &Path) -> bool {
    let candidates = [
        "Schinese.dat",
        "SChinese.dat",
        "Chinese.dat",
        "Simplified_Chinese.dat",
    ];
    candidates.iter().any(|name| dir.join(name).exists())
}

// ── Command: scan a user-specified folder ──────────────────────────────────────

/// Recursively scan `mod_path` for directories that contain `English.dat`
/// but have no existing Chinese translation file.
#[tauri::command]
pub async fn scan_missing_translations(
    mod_path: String,
) -> Result<Vec<MissingTranslationItem>, String> {
    let base = Path::new(&mod_path);
    if !base.exists() {
        return Err(format!("目录不存在：{}", mod_path));
    }
    if !base.is_dir() {
        return Err(format!("指定路径不是目录：{}", mod_path));
    }

    let mut results = Vec::new();
    scan_recursive(base, &mut results);
    Ok(results)
}

fn scan_recursive(dir: &Path, results: &mut Vec<MissingTranslationItem>) {
    let english_path = dir.join("English.dat");
    if english_path.exists() && !has_chinese_translation(dir) {
        // Parse English.dat and extract translatable fields
        let data = parse_dat_file(&english_path);
        let fields: Vec<TranslatableField> = TRANSLATABLE_KEYS
            .iter()
            .filter_map(|&key| {
                data.get(key).map(|val| TranslatableField {
                    key: key.to_string(),
                    value: val.clone(),
                })
            })
            .collect();

        if !fields.is_empty() {
            let dir_name = dir
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();

            results.push(MissingTranslationItem {
                dir_path: dir.to_string_lossy().to_string(),
                dir_name,
                fields,
            });
        }
    }

    // Recurse into subdirectories
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                scan_recursive(&path, results);
            }
        }
    }
}

// ── OpenAI-compatible chat completion structures ───────────────────────────────

#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessageResponse,
}

#[derive(Deserialize)]
struct ChatMessageResponse {
    content: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

// ── OpenAI /models response structures ────────────────────────────────────────

#[derive(Deserialize)]
struct ModelObject {
    id: String,
}

#[derive(Deserialize)]
struct ModelsResponse {
    data: Vec<ModelObject>,
}

// ── Command: fetch available models from /models endpoint ──────────────────────

/// Fetch the list of available model IDs from `{api_url}/models`.
#[tauri::command]
pub async fn fetch_available_models(
    api_url: String,
    api_key: String,
) -> Result<Vec<String>, String> {
    let endpoint = format!("{}/models", api_url.trim_end_matches('/'));

    let client = reqwest::Client::builder()
        .user_agent("unturned-assistant/0.1")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("API 错误 {}: {}", status, body));
    }

    let models_resp: ModelsResponse = resp
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let mut ids: Vec<String> = models_resp.data.into_iter().map(|m| m.id).collect();
    ids.sort();
    Ok(ids)
}

// ── Command: test model availability ──────────────────────────────────────────

/// Result of a model availability test.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelTestResult {
    pub ok: bool,
    /// Round-trip latency in milliseconds
    pub latency_ms: u64,
    /// Short excerpt from the model's reply (proves it responded)
    pub reply_preview: String,
    pub error: Option<String>,
}

/// Send a minimal one-token request and return latency + short reply preview.
#[tauri::command]
pub async fn test_model_availability(
    api_url: String,
    api_key: String,
    model: String,
) -> Result<ModelTestResult, String> {
    let endpoint = format!("{}/chat/completions", api_url.trim_end_matches('/'));

    let request_body = ChatRequest {
        model: model.clone(),
        messages: vec![ChatMessage {
            role: "user".to_string(),
            content: "Reply with exactly one word: OK".to_string(),
        }],
        temperature: 0.0,
    };

    let client = reqwest::Client::builder()
        .user_agent("unturned-assistant/0.1")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let start = std::time::Instant::now();

    let resp = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request_body)
        .send()
        .await;

    let latency_ms = start.elapsed().as_millis() as u64;

    match resp {
        Err(e) => Ok(ModelTestResult {
            ok: false,
            latency_ms,
            reply_preview: String::new(),
            error: Some(format!("连接失败: {}", e)),
        }),
        Ok(r) if !r.status().is_success() => {
            let status = r.status();
            let body = r.text().await.unwrap_or_default();
            Ok(ModelTestResult {
                ok: false,
                latency_ms,
                reply_preview: String::new(),
                error: Some(format!("API 错误 {}: {}", status, body)),
            })
        }
        Ok(r) => {
            let chat: ChatResponse = r.json().await.map_err(|e| format!("解析响应失败: {}", e))?;
            let reply = chat
                .choices
                .into_iter()
                .next()
                .map(|c| c.message.content)
                .unwrap_or_default();
            let preview = if reply.len() > 60 {
                format!("{}…", &reply[..60])
            } else {
                reply
            };
            Ok(ModelTestResult {
                ok: true,
                latency_ms,
                reply_preview: preview,
                error: None,
            })
        }
    }
}

// ── Command: call LLM and write Schinese.dat ──────────────────────────────────

/// Call the LLM API to translate the fields in `item`, then write `Schinese.dat`
/// next to the existing `English.dat`.
#[tauri::command]
pub async fn translate_and_write_schinese(
    item: MissingTranslationItem,
    api_url: String,
    api_key: String,
    model: String,
) -> Result<TranslationResult, String> {
    let dir = Path::new(&item.dir_path);
    let written_path = dir.join("Schinese.dat");

    // Build the user message: list each field for translation
    let fields_text: String = item
        .fields
        .iter()
        .map(|f| format!("{} {}", f.key, f.value))
        .collect::<Vec<_>>()
        .join("\n");

    let system_prompt = "你是一位专业的 Unturned 游戏汉化专家。\
请将以下 Unturned .dat 文件中的英文字段翻译为简体中文。\
规则：\
1. 保留原始格式：每行「Key 翻译内容」，Key 不翻译，仅翻译值；\
2. 专有名词（武器型号、地名等）可保留英文或音译；\
3. 只输出翻译后的 key-value 行，不要任何额外解释或标点符号；\
4. 如果某个值本身就是中文或数字，直接原样保留。";

    let user_message = format!(
        "请翻译以下游戏道具/载具属性（来自目录：{}）：\n\n{}",
        item.dir_name, fields_text
    );

    let request_body = ChatRequest {
        model: model.clone(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_message,
            },
        ],
        temperature: 0.3,
    };

    // Call the API
    let endpoint = format!("{}/chat/completions", api_url.trim_end_matches('/'));

    let client = reqwest::Client::builder()
        .user_agent("unturned-assistant/0.1")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("API 错误 {}: {}", status, body));
    }

    let chat_resp: ChatResponse = resp
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let translated_text = chat_resp
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .unwrap_or_default();

    if translated_text.trim().is_empty() {
        return Err("LLM 返回了空内容，请检查 API 配置".to_string());
    }

    // Write Schinese.dat with UTF-8 BOM (matches game convention)
    let bom = b"\xef\xbb\xbf";
    let content = format!("{}\n", translated_text.trim());
    let mut file_content = bom.to_vec();
    file_content.extend_from_slice(content.as_bytes());

    std::fs::write(&written_path, &file_content)
        .map_err(|e| format!("写入 Schinese.dat 失败: {}", e))?;

    Ok(TranslationResult {
        dir_path: item.dir_path.clone(),
        written_path: written_path.to_string_lossy().to_string(),
        status: "success".to_string(),
        error: None,
    })
}

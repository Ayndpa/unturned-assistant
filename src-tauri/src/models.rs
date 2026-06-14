use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintItem {
    pub id_or_guid: String,
    pub amount: u32,
    pub is_tool: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Blueprint {
    pub inputs: Vec<BlueprintItem>,
    pub outputs: Vec<BlueprintItem>,
    pub type_or_category: String,
    pub skill: Option<String>,
    pub skill_level: Option<u32>,
    pub map_index: Option<u32>,
}

/// A single Unturned item or vehicle entry.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnturnedItem {
    pub id: u32,
    pub guid: Option<String>,
    pub name: String,
    pub category: String,
    pub description: String,
    pub rarity: String,
    pub blueprints: Option<Vec<Blueprint>>,
    /// Steam Workshop ID for mod items. None/empty for base game items.
    pub workshop_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ItemIndexCache {
    pub version: u32,
    pub items: Vec<UnturnedItem>,
}

/// Information about a single local disk drive.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub device_id: String,
    pub free_space_gb: f64,
    pub total_size_gb: f64,
    pub is_recommended: bool,
}

/// A Windows pagefile.sys entry.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PageFileEntry {
    pub name: String,
    pub initial_size_mb: u64,
    pub maximum_size_mb: u64,
}

/// Combined pagefile + disk status returned to the frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SystemPageFileStatus {
    pub automatic_managed: bool,
    pub page_files: Vec<PageFileEntry>,
    pub disks: Vec<DiskInfo>,
}

/// Result of a cloud sync operation.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    /// Number of items uploaded to the cloud.
    pub uploaded: usize,
    /// Number of items skipped (already exist in the cloud).
    pub skipped: usize,
}

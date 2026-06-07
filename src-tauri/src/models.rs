use serde::{Deserialize, Serialize};

/// A single Unturned item or vehicle entry.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnturnedItem {
    pub id: u32,
    pub name: String,
    pub category: String,
    pub description: String,
    pub rarity: String,
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

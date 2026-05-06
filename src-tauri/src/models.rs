use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FolderInfo {
    pub path: String,
    pub name: String,
    pub image_count: usize,
    pub video_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Album {
    pub id: String,
    pub album_name: String,
    pub asset_count: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadConfig {
    pub server_url: String,
    pub api_key: String,
    pub folders: Vec<String>,
    pub album_id: String,
    pub images: bool,
    pub videos: bool,
    pub concurrency: usize,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UploadResult {
    pub uploaded: u32,
    pub skipped: u32,
    pub errors: u32,
    pub error_details: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProgressEvent {
    pub total: u32,
    pub completed: u32,
    pub skipped: u32,
    pub errors: u32,
    pub current_file: String,
}

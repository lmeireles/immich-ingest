use tauri::AppHandle;
use crate::{
    immich,
    models::{Album, FolderInfo, UploadConfig, UploadResult},
    scanner::scan_dcim,
    uploader::run_upload,
};

#[tauri::command]
pub fn scan_dcim_command(root: String) -> Result<Vec<FolderInfo>, String> {
    Ok(scan_dcim(&root))
}

#[tauri::command]
pub async fn test_connection(server_url: String, api_key: String) -> Result<String, String> {
    immich::test_connection(&server_url, &api_key).await
}

#[tauri::command]
pub async fn fetch_albums(server_url: String, api_key: String) -> Result<Vec<Album>, String> {
    immich::fetch_albums(&server_url, &api_key).await
}

#[tauri::command]
pub async fn create_album(
    server_url: String,
    api_key: String,
    name: String,
) -> Result<Album, String> {
    immich::create_album(&server_url, &api_key, &name).await
}

#[tauri::command]
pub async fn start_upload(
    app: AppHandle,
    config: UploadConfig,
) -> Result<UploadResult, String> {
    Ok(run_upload(app, config).await)
}


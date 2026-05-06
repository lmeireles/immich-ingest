use tauri::AppHandle;
use crate::{
    immich,
    models::{Album, FolderInfo, UploadConfig, UploadResult},
    scanner::{collect_files, scan_dcim},
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

#[tauri::command]
pub fn list_folder_files(folder: String, images: bool, videos: bool) -> Result<Vec<String>, String> {
    let paths = collect_files(&folder, images, videos);
    Ok(paths
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect())
}

#[tauri::command]
pub fn delete_files(paths: Vec<String>) -> Result<u32, String> {
    let mut count = 0u32;
    for path in &paths {
        match std::fs::remove_file(path) {
            Ok(_) => count += 1,
            Err(e) => return Err(format!("Failed to delete {}: {}", path, e)),
        }
    }
    Ok(count)
}

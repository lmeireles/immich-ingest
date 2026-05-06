mod commands;
mod immich;
mod models;
mod scanner;
mod uploader;

use commands::{
    create_album, fetch_albums, scan_dcim_command, start_upload, test_connection,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            scan_dcim_command,
            test_connection,
            fetch_albums,
            create_album,
            start_upload,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

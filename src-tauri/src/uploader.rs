use std::sync::{Arc, Mutex};
use futures::stream::{self, StreamExt};
use tauri::{AppHandle, Emitter};
use crate::{
    immich,
    models::{ProgressEvent, UploadConfig, UploadResult},
    scanner::collect_files,
};

pub async fn run_upload(app: AppHandle, config: UploadConfig) -> UploadResult {
    let mut all_files = vec![];
    for folder in &config.folders {
        all_files.extend(collect_files(folder, config.images, config.videos));
    }

    let total = all_files.len() as u32;
    let result = Arc::new(Mutex::new(UploadResult {
        uploaded: 0,
        skipped: 0,
        errors: 0,
        error_details: vec![],
    }));
    let completed = Arc::new(Mutex::new(0u32));
    let asset_ids: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(vec![]));

    let concurrency = config.concurrency.max(1).min(16);

    stream::iter(all_files)
        .for_each_concurrent(concurrency, |path| {
            let app = app.clone();
            let config = &config;
            let result = Arc::clone(&result);
            let completed = Arc::clone(&completed);
            let asset_ids = Arc::clone(&asset_ids);

            async move {
                let filename = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                let upload_result =
                    immich::upload_asset(&config.server_url, &config.api_key, &path).await;

                let mut r = result.lock().unwrap();
                let mut c = completed.lock().unwrap();
                *c += 1;

                match upload_result {
                    Ok((id, is_duplicate)) => {
                        if is_duplicate {
                            r.skipped += 1;
                        } else {
                            r.uploaded += 1;
                            asset_ids.lock().unwrap().push(id);
                        }
                    }
                    Err(e) => {
                        r.errors += 1;
                        r.error_details.push(format!("{}: {}", filename, e));
                    }
                }

                let event = ProgressEvent {
                    total,
                    completed: *c,
                    skipped: r.skipped,
                    errors: r.errors,
                    current_file: filename,
                };
                drop(r);
                drop(c);

                let _ = app.emit("upload://progress", event);
            }
        })
        .await;

    let ids = asset_ids.lock().unwrap().clone();
    if !ids.is_empty() {
        if let Err(e) = immich::add_assets_to_album(
            &config.server_url,
            &config.api_key,
            &config.album_id,
            &ids,
        )
        .await
        {
            let mut r = result.lock().unwrap();
            r.error_details.push(format!("Album assignment failed: {}", e));
        }
    }

    let final_result = result.lock().unwrap();
    UploadResult {
        uploaded: final_result.uploaded,
        skipped: final_result.skipped,
        errors: final_result.errors,
        error_details: final_result.error_details.clone(),
    }
}

use std::path::Path;
use reqwest::Client;
use serde::Deserialize;
use crate::models::Album;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AssetResponse {
    id: String,
    status: String,
}

#[derive(Deserialize)]
struct AlbumRaw {
    id: String,
    #[serde(rename = "albumName")]
    album_name: String,
    #[serde(rename = "assetCount")]
    asset_count: Option<u32>,
}

#[derive(Deserialize)]
struct CreateAlbumResponse {
    id: String,
    #[serde(rename = "albumName")]
    album_name: String,
}

fn client() -> Client {
    Client::builder()
        .danger_accept_invalid_certs(false)
        .build()
        .expect("failed to build http client")
}

fn base(url: &str) -> String {
    url.trim_end_matches('/').to_string()
}

pub async fn test_connection(server_url: &str, api_key: &str) -> Result<String, String> {
    let resp = client()
        .get(format!("{}/api/albums", base(server_url)))
        .header("x-api-key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }

    let albums: Vec<AlbumRaw> = resp.json().await.map_err(|e| e.to_string())?;
    Ok(format!("Connected ({} album{})", albums.len(), if albums.len() == 1 { "" } else { "s" }))
}

pub async fn fetch_albums(server_url: &str, api_key: &str) -> Result<Vec<Album>, String> {
    let resp = client()
        .get(format!("{}/api/albums", base(server_url)))
        .header("x-api-key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }

    let raw: Vec<AlbumRaw> = resp.json().await.map_err(|e| e.to_string())?;
    Ok(raw
        .into_iter()
        .map(|a| Album {
            id: a.id,
            album_name: a.album_name,
            asset_count: a.asset_count,
        })
        .collect())
}

pub async fn create_album(
    server_url: &str,
    api_key: &str,
    name: &str,
) -> Result<Album, String> {
    let body = serde_json::json!({ "albumName": name });
    let resp = client()
        .post(format!("{}/api/albums", base(server_url)))
        .header("x-api-key", api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }

    let raw: CreateAlbumResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(Album {
        id: raw.id,
        album_name: raw.album_name,
        asset_count: Some(0),
    })
}

/// Returns (asset_id, is_duplicate).
pub async fn upload_asset(
    server_url: &str,
    api_key: &str,
    file_path: &Path,
) -> Result<(String, bool), String> {
    let filename = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let metadata = std::fs::metadata(file_path).map_err(|e| e.to_string())?;
    let mtime = metadata
        .modified()
        .ok()
        .and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| {
                let secs = d.as_secs() as i64;
                chrono::DateTime::from_timestamp(secs, 0)
                    .map(|dt| dt.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string())
            })
        })
        .flatten()
        .unwrap_or_else(|| "1970-01-01T00:00:00.000Z".to_string());

    let file_bytes = std::fs::read(file_path).map_err(|e| e.to_string())?;
    let mime = mime_for(&filename);

    let part = reqwest::multipart::Part::bytes(file_bytes)
        .file_name(filename.clone())
        .mime_str(mime)
        .map_err(|e| e.to_string())?;

    let form = reqwest::multipart::Form::new()
        .part("assetData", part)
        .text("deviceAssetId", filename.clone())
        .text("deviceId", "immich-ingest")
        .text("fileCreatedAt", mtime.clone())
        .text("fileModifiedAt", mtime);

    let resp = client()
        .post(format!("{}/api/assets", base(server_url)))
        .header("x-api-key", api_key)
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let asset: AssetResponse = resp.json().await.map_err(|e| e.to_string())?;

    // 200 = duplicate, 201 = created
    let is_duplicate = status.as_u16() == 200 || asset.status == "duplicate";
    Ok((asset.id, is_duplicate))
}

pub async fn add_assets_to_album(
    server_url: &str,
    api_key: &str,
    album_id: &str,
    asset_ids: &[String],
) -> Result<(), String> {
    if asset_ids.is_empty() {
        return Ok(());
    }
    let body = serde_json::json!({ "ids": asset_ids });
    let resp = client()
        .put(format!("{}/api/albums/{}/assets", base(server_url), album_id))
        .header("x-api-key", api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }
    Ok(())
}

fn mime_for(filename: &str) -> &'static str {
    let ext = filename
        .rsplit('.')
        .next()
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "heic" | "heif" => "image/heic",
        "mp4" => "video/mp4",
        "mov" => "video/quicktime",
        "avi" => "video/x-msvideo",
        "mkv" => "video/x-matroska",
        _ => "application/octet-stream",
    }
}

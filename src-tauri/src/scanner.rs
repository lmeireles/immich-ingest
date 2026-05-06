use std::path::Path;
use walkdir::WalkDir;
use crate::models::FolderInfo;

const IMAGE_EXTS: &[&str] = &[
    "jpg", "jpeg", "png", "heic", "heif", "raf", "arw", "cr2", "cr3", "nef",
    "dng", "orf", "rw2",
];
const VIDEO_EXTS: &[&str] = &["mp4", "mov", "avi", "mkv"];

pub fn scan_dcim(root: &str) -> Vec<FolderInfo> {
    let dcim = Path::new(root).join("DCIM");
    if !dcim.is_dir() {
        return vec![];
    }

    let mut folders = vec![];

    let entries = match std::fs::read_dir(&dcim) {
        Ok(e) => e,
        Err(_) => return vec![],
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let mut image_count = 0;
        let mut video_count = 0;

        for file in WalkDir::new(&path)
            .min_depth(1)
            .max_depth(3)
            .into_iter()
            .flatten()
        {
            if !file.file_type().is_file() {
                continue;
            }
            let ext = file
                .path()
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| e.to_lowercase())
                .unwrap_or_default();

            if IMAGE_EXTS.contains(&ext.as_str()) {
                image_count += 1;
            } else if VIDEO_EXTS.contains(&ext.as_str()) {
                video_count += 1;
            }
        }

        folders.push(FolderInfo {
            path: path.to_string_lossy().to_string(),
            name,
            image_count,
            video_count,
        });
    }

    folders.sort_by(|a, b| a.name.cmp(&b.name));
    folders
}

pub fn collect_files(folder: &str, images: bool, videos: bool) -> Vec<std::path::PathBuf> {
    WalkDir::new(folder)
        .min_depth(1)
        .max_depth(3)
        .into_iter()
        .flatten()
        .filter(|e| e.file_type().is_file())
        .filter(|e| {
            let ext = e
                .path()
                .extension()
                .and_then(|x| x.to_str())
                .map(|x| x.to_lowercase())
                .unwrap_or_default();
            (images && IMAGE_EXTS.contains(&ext.as_str()))
                || (videos && VIDEO_EXTS.contains(&ext.as_str()))
        })
        .map(|e| e.into_path())
        .collect()
}

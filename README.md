# immich-ingest

Desktop app for bulk-uploading camera SD card images to [Immich](https://immich.app). Built with Tauri 2, React, and TypeScript.

![Home screen](docs/screenshots/home.png)

## What it does

1. Select your SD card root folder
2. Choose which DCIM subfolders to upload
3. Pick an Immich album (or create one)
4. Upload images and/or videos in parallel
5. Optionally delete files from the card after a successful upload

Duplicate detection is handled automatically by Immich — already-uploaded files are skipped without re-uploading.

## Supported file types

Images: JPG, JPEG, PNG, HEIC, RAF, ARW, CR2, CR3, NEF, DNG, ORF, RW2

Videos: MP4, MOV, AVI, MKV

Works with any camera following the DCF standard (Fujifilm, Sony, Canon, Nikon, etc.).

## Setup

![Settings](docs/screenshots/settings.png)

1. In your Immich web UI: **Account Settings → API Keys → New API Key**
2. Install the app (or run `npm run tauri dev` for development)
3. Open Settings (gear icon), enter your Immich server URL and API key
4. Click **Test Connection** to verify

## Development

Requirements: Node 18+, Rust 1.75+, Tauri CLI v2

```bash
npm install
npm run tauri dev
```

Build a release binary:

```bash
npm run tauri build
```

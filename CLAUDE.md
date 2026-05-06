# immich-ingest

Tauri 2 + React 19 + TypeScript desktop app for bulk-uploading camera SD card images to Immich.

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Rust, Tauri 2
- **HTTP**: `reqwest` (Rust) — all Immich API calls go through Rust commands, not the frontend
- **Settings**: `tauri-plugin-store` → `settings.json` in app data dir
- **File I/O**: `tauri-plugin-fs` + `walkdir` (Rust)
- **Dialogs**: `tauri-plugin-dialog`

## Commands

```bash
npm run tauri dev    # dev server + Rust hot-compile
npm run tauri build  # release binary
npx tsc --noEmit     # type-check frontend
cargo check          # type-check Rust (run from src-tauri/)
```

## Tauri command pattern

All Rust-side logic lives in `src-tauri/src/`. Commands are thin wrappers in `commands.rs` that delegate to domain modules:

```
commands.rs   → thin #[tauri::command] wrappers
scanner.rs    → DCIM folder scanning, file enumeration
immich.rs     → Immich REST API client
uploader.rs   → concurrent upload loop with tokio semaphore
models.rs     → shared Serde structs
```

Frontend calls via `invoke("command_name", { camelCaseArgs })`. Rust event emission uses `app.emit("upload://progress", payload)`.

## Immich API endpoints used

| Method | Path | Purpose |
|---|---|---|
| GET | /api/users/me | Test connection |
| GET | /api/albums | List albums |
| POST | /api/albums | Create album |
| POST | /api/assets | Upload asset (multipart) |
| PUT | /api/albums/{id}/assets | Add assets to album |

Auth header: `x-api-key: <key>` on all requests.

## Key plugin permissions

In `src-tauri/capabilities/default.json`:
- `dialog:default` — folder picker
- `fs:default` + `fs:read-all` — recursive DCIM scan
- `fs:allow-remove` — card cleanup
- `store:default` — settings persistence

## Settings keys (tauri-plugin-store)

`serverUrl`, `apiKey`, `lastCardPath`, `lastAlbumId`, `imagesEnabled`, `videosEnabled`, `deleteAfterUpload`, `concurrency`

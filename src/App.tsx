import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { FolderOpen, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { FolderList } from "@/components/FolderList";
import { AlbumSelect } from "@/components/AlbumSelect";
import { UploadProgress } from "@/components/UploadProgress";
import { useSettings } from "@/hooks/useSettings";
import {
  Album,
  FolderInfo,
  ProgressEvent,
  UploadResult,
} from "@/lib/types";

type AppState = "idle" | "scanned" | "uploading" | "done";

export default function App() {
  const { settings, updateSettings, ready } = useSettings();

  const [appState, setAppState] = useState<AppState>("idle");
  const [cardPath, setCardPath] = useState("");
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [images, setImages] = useState(true);
  const [videos, setVideos] = useState(true);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [scanError, setScanError] = useState("");
  const [albumsError, setAlbumsError] = useState("");

  // Restore settings into local state once loaded
  useEffect(() => {
    if (!ready) return;
    setImages(settings.imagesEnabled);
    setVideos(settings.videosEnabled);
    setSelectedAlbumId(settings.lastAlbumId);
    if (settings.serverUrl && settings.apiKey) {
      void loadAlbums(settings.serverUrl, settings.apiKey);
    }
  }, [ready]);

  async function loadAlbums(serverUrl: string, apiKey: string) {
    setAlbumsError("");
    try {
      const list = await invoke<Album[]>("fetch_albums", { serverUrl, apiKey });
      list.sort((a, b) => a.albumName.localeCompare(b.albumName));
      setAlbums(list);
    } catch (e) {
      setAlbumsError(String(e));
    }
  }

  async function handleSelectCard() {
    const chosen = await open({ directory: true, multiple: false });
    if (!chosen || typeof chosen !== "string") return;

    setCardPath(chosen);
    setScanError("");
    try {
      const found = await invoke<FolderInfo[]>("scan_dcim_command", { root: chosen });
      setFolders(found);
      setSelectedFolders(new Set(found.map((f) => f.path)));
      setAppState("scanned");
      await updateSettings({ lastCardPath: chosen });
    } catch (e) {
      setScanError(String(e));
      setAppState("idle");
    }
  }

  function toggleFolder(path: string) {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function handleUpload() {
    if (!selectedAlbumId) return;

    setProgress(null);
    setResult(null);
    setAppState("uploading");

    const unlisten = await listen<ProgressEvent>("upload://progress", (e) => {
      setProgress(e.payload);
    });

    try {
      const uploadResult = await invoke<UploadResult>("start_upload", {
        config: {
          serverUrl: settings.serverUrl,
          apiKey: settings.apiKey,
          folders: Array.from(selectedFolders),
          albumId: selectedAlbumId,
          images,
          videos,
          concurrency: settings.concurrency,
        },
      });

      setResult(uploadResult);
      setAppState("done");
      await updateSettings({ lastAlbumId: selectedAlbumId });
    } catch (e) {
      setResult({
        uploaded: 0,
        skipped: 0,
        errors: 1,
        errorDetails: [String(e)],
      });
      setAppState("done");
    } finally {
      unlisten();
    }
  }

  function handleReset() {
    setAppState("scanned");
    setProgress(null);
    setResult(null);
  }

  const totalFiles = folders
    .filter((f) => selectedFolders.has(f.path))
    .reduce(
      (sum, f) =>
        sum + (images ? f.imageCount : 0) + (videos ? f.videoCount : 0),
      0
    );

  const hasConnection = settings.serverUrl && settings.apiKey;

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2.5">
        <h1 className="font-semibold text-base tracking-tight">Immich Ingest</h1>
        <SettingsDrawer
          settings={settings}
          onSave={(patch) => {
            void updateSettings(patch);
            if (patch.serverUrl || patch.apiKey) {
              const url = patch.serverUrl ?? settings.serverUrl;
              const key = patch.apiKey ?? settings.apiKey;
              if (url && key) void loadAlbums(url, key);
            }
          }}
        />
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-5">
        {!hasConnection && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
            Open Settings and enter your Immich server URL and API key to get started. The key needs <strong>Album Read/Write</strong> and <strong>Asset Read/Write</strong> permissions.
          </div>
        )}

        {/* Card selector */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            SD Card
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSelectCard} className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Select SD Card
            </Button>
            {cardPath && (
              <span className="text-sm text-muted-foreground font-mono truncate">
                {cardPath}
              </span>
            )}
          </div>
          {scanError && (
            <p className="text-sm text-destructive">{scanError}</p>
          )}
        </div>

        {/* Folder list */}
        {(appState === "scanned" || appState === "uploading" || appState === "done") && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              DCIM Folders
            </Label>
            <FolderList
              folders={folders}
              selected={selectedFolders}
              onToggle={toggleFolder}
              onSelectAll={() =>
                setSelectedFolders(new Set(folders.map((f) => f.path)))
              }
              onDeselectAll={() => setSelectedFolders(new Set())}
            />
          </div>
        )}

        {/* File types */}
        {appState !== "idle" && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              File Types
            </Label>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="images"
                  checked={images}
                  onCheckedChange={(c) => {
                    const val = c === true;
                    setImages(val);
                    void updateSettings({ imagesEnabled: val });
                  }}
                />
                <Label htmlFor="images">Images</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="videos"
                  checked={videos}
                  onCheckedChange={(c) => {
                    const val = c === true;
                    setVideos(val);
                    void updateSettings({ videosEnabled: val });
                  }}
                />
                <Label htmlFor="videos">Videos</Label>
              </div>
            </div>
          </div>
        )}

        {/* Album selection */}
        {appState !== "idle" && hasConnection && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Upload to Album
            </Label>
            {albumsError ? (
              <p className="text-sm text-destructive">{albumsError}</p>
            ) : (
              <AlbumSelect
                albums={albums}
                selectedId={selectedAlbumId}
                serverUrl={settings.serverUrl}
                apiKey={settings.apiKey}
                onSelect={(id) => setSelectedAlbumId(id)}
                onAlbumCreated={(album) =>
                  setAlbums((prev) => [...prev, album].sort((a, b) =>
                    a.albumName.localeCompare(b.albumName)
                  ))
                }
              />
            )}
          </div>
        )}

        {/* Upload progress */}
        {(appState === "uploading" || appState === "done") && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Progress
            </Label>
            <UploadProgress progress={progress} result={result} />
          </div>
        )}

      </main>

      {/* Footer action */}
      <footer className="border-t px-4 py-3 flex items-center justify-between gap-3">
        {appState === "done" && (
          <Button variant="ghost" onClick={handleReset} size="sm">
            Upload more
          </Button>
        )}
        <div className="flex-1" />
        {appState === "scanned" && (
          <Button
            onClick={handleUpload}
            disabled={
              !hasConnection ||
              !selectedAlbumId ||
              selectedFolders.size === 0 ||
              totalFiles === 0 ||
              (!images && !videos)
            }
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload {totalFiles > 0 ? `${totalFiles} files` : ""}
          </Button>
        )}
        {appState === "uploading" && (
          <Button disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </Button>
        )}
      </footer>

    </div>
  );
}

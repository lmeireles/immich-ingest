export interface FolderInfo {
  path: string;
  name: string;
  imageCount: number;
  videoCount: number;
}

export interface Album {
  id: string;
  albumName: string;
  assetCount?: number;
}

export interface UploadConfig {
  serverUrl: string;
  apiKey: string;
  folders: string[];
  albumId: string;
  images: boolean;
  videos: boolean;
  concurrency: number;
}

export interface UploadResult {
  uploaded: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export interface ProgressEvent {
  total: number;
  completed: number;
  skipped: number;
  errors: number;
  currentFile: string;
}

export interface Settings {
  serverUrl: string;
  apiKey: string;
  lastCardPath: string;
  lastAlbumId: string;
  imagesEnabled: boolean;
  videosEnabled: boolean;
  deleteAfterUpload: boolean;
  concurrency: number;
}

export const DEFAULT_SETTINGS: Settings = {
  serverUrl: "",
  apiKey: "",
  lastCardPath: "",
  lastAlbumId: "",
  imagesEnabled: true,
  videosEnabled: true,
  deleteAfterUpload: false,
  concurrency: 4,
};

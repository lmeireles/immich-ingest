import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Album } from "@/lib/types";

const CREATE_NEW = "__create_new__";

interface Props {
  albums: Album[];
  selectedId: string;
  serverUrl: string;
  apiKey: string;
  onSelect: (id: string) => void;
  onAlbumCreated: (album: Album) => void;
}

export function AlbumSelect({
  albums,
  selectedId,
  serverUrl,
  apiKey,
  onSelect,
  onAlbumCreated,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const album = await invoke<Album>("create_album", {
        serverUrl,
        apiKey,
        name: newName.trim(),
      });
      onAlbumCreated(album);
      onSelect(album.id);
      setCreating(false);
      setNewName("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectChange(value: string) {
    if (value === CREATE_NEW) {
      setCreating(true);
    } else {
      setCreating(false);
      onSelect(value);
    }
  }

  return (
    <div className="space-y-2">
      <Select value={creating ? CREATE_NEW : selectedId} onValueChange={(v) => v && handleSelectChange(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Select an album..." />
        </SelectTrigger>
        <SelectContent>
          {albums.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.albumName}
              {a.assetCount !== undefined && (
                <span className="ml-2 text-muted-foreground text-xs">
                  ({a.assetCount})
                </span>
              )}
            </SelectItem>
          ))}
          <SelectItem value={CREATE_NEW}>
            <span className="flex items-center gap-1.5 text-primary">
              <Plus className="h-3.5 w-3.5" /> Create new album...
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {creating && (
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Album name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={loading || !newName.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

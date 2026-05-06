import { FolderInfo } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  folders: FolderInfo[];
  selected: Set<string>;
  onToggle: (path: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function FolderList({
  folders,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: Props) {
  if (folders.length === 0) {
    return (
      <p className="text-sm text-destructive">
        No DCIM folders found. Check that a DCIM/ directory exists at the card root.
      </p>
    );
  }

  const allSelected = folders.every((f) => selected.has(f.path));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
      </div>

      <div className="rounded-md border divide-y max-h-52 overflow-y-auto">
        {folders.map((folder) => {
          const id = `folder-${folder.path}`;
          const total = folder.imageCount + folder.videoCount;
          return (
            <div key={folder.path} className="flex items-center gap-3 px-3 py-2">
              <Checkbox
                id={id}
                checked={selected.has(folder.path)}
                onCheckedChange={() => onToggle(folder.path)}
              />
              <Label htmlFor={id} className="flex-1 cursor-pointer font-mono text-sm">
                {folder.name}
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {folder.imageCount > 0 && `${folder.imageCount} img`}
                {folder.imageCount > 0 && folder.videoCount > 0 && " · "}
                {folder.videoCount > 0 && `${folder.videoCount} vid`}
                {total === 0 && "empty"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, SkipForward, AlertCircle, Loader2 } from "lucide-react";
import { ProgressEvent, UploadResult } from "@/lib/types";

interface Props {
  progress: ProgressEvent | null;
  result: UploadResult | null;
}

export function UploadProgress({ progress, result }: Props) {
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {progress && (
        <>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {progress.completed} / {progress.total} files
              </span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>

          {!result && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="font-mono truncate">{progress.currentFile}</span>
            </div>
          )}
        </>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="gap-1.5 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              {result.uploaded} uploaded
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <SkipForward className="h-3.5 w-3.5" />
              {result.skipped} skipped
            </Badge>
            {result.errors > 0 && (
              <Badge variant="destructive" className="gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {result.errors} errors
              </Badge>
            )}
          </div>

          {result.errorDetails.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
              {result.errorDetails.map((e, i) => (
                <p key={i} className="font-mono text-xs text-destructive">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

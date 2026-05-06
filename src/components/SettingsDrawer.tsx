import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings as SettingsIcon, CheckCircle, XCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "@/lib/types";

interface Props {
  settings: Settings;
  onSave: (patch: Partial<Settings>) => void;
}

export function SettingsDrawer({ settings, onSave }: Props) {
  const [serverUrl, setServerUrl] = useState(settings.serverUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [concurrency, setConcurrency] = useState(settings.concurrency);
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  async function handleTest() {
    setTestStatus("idle");
    setTestMsg("Connecting...");
    try {
      const name = await invoke<string>("test_connection", {
        serverUrl: serverUrl.trim(),
        apiKey: apiKey.trim(),
      });
      setTestStatus("ok");
      setTestMsg(`Connected as ${name}`);
    } catch (e) {
      setTestStatus("error");
      setTestMsg(String(e));
    }
  }

  function handleSave() {
    onSave({
      serverUrl: serverUrl.trim(),
      apiKey: apiKey.trim(),
      concurrency,
    });
  }

  return (
    <Sheet>
      <SheetTrigger>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="px-4">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="serverUrl">Immich Server URL</Label>
            <Input
              id="serverUrl"
              placeholder="http://192.168.1.100:2283"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Your Immich API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="concurrency">Upload concurrency (1–16)</Label>
            <Input
              id="concurrency"
              type="number"
              min={1}
              max={16}
              value={concurrency}
              onChange={(e) =>
                setConcurrency(
                  Math.min(16, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleTest}>
              Test Connection
            </Button>
            {testStatus === "ok" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> {testMsg}
              </span>
            )}
            {testStatus === "error" && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <XCircle className="h-4 w-4" /> {testMsg}
              </span>
            )}
            {testStatus === "idle" && testMsg && (
              <span className="text-sm text-muted-foreground">{testMsg}</span>
            )}
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

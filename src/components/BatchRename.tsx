import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PenLine } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface BatchRenameConfig {
  enabled: boolean;
  pattern: string;
}

interface BatchRenameProps {
  config: BatchRenameConfig;
  onChange: (config: BatchRenameConfig) => void;
  fileCount: number;
}

/**
 * Generates output filename from pattern.
 * Supports: {name} = original name, {n} = 1-indexed number, {ext} = output extension
 */
export function applyRenamePattern(
  pattern: string,
  originalName: string,
  index: number,
  outputExt: string
): string {
  const dot = originalName.lastIndexOf(".");
  const baseName = dot > 0 ? originalName.substring(0, dot) : originalName;

  if (!pattern.trim()) return `${baseName}.${outputExt}`;

  return pattern
    .replace(/\{name\}/gi, baseName)
    .replace(/\{n\}/gi, String(index + 1))
    .replace(/\{ext\}/gi, outputExt)
    + `.${outputExt}`;
}

export default function BatchRename({ config, onChange, fileCount }: BatchRenameProps) {
  const preview = config.pattern
    ? applyRenamePattern(config.pattern, "photo", 0, "webp")
    : "photo.webp";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium text-foreground font-display">Batch Rename</label>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
        />
      </div>

      {config.enabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={config.pattern}
              onChange={(e) => onChange({ ...config, pattern: e.target.value })}
              className="flex-1 h-9 text-sm font-mono"
              placeholder="{name}-compressed"
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Tokens:</span>
            <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{"{name}"}</code>
            <span>original name</span>
            <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{"{n}"}</code>
            <span>number (1, 2…)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: <span className="text-foreground font-medium">{preview}</span>
          </p>
        </div>
      )}
    </div>
  );
}

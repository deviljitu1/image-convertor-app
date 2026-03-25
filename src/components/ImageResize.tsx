import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Maximize2, Lock, Unlock } from "lucide-react";
import { useState } from "react";

export interface ResizeConfig {
  enabled: boolean;
  mode: "pixels" | "percentage";
  width: number;
  height: number;
  percentage: number;
  maintainAspectRatio: boolean;
}

interface ImageResizeProps {
  config: ResizeConfig;
  onChange: (config: ResizeConfig) => void;
}

export default function ImageResize({ config, onChange }: ImageResizeProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium text-foreground font-display">Resize Images</label>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
        />
      </div>

      {config.enabled && (
        <div className="space-y-3">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden w-fit">
            {(["pixels", "percentage"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onChange({ ...config, mode })}
                className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                  config.mode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {config.mode === "pixels" ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-8">W</label>
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  value={config.width || ""}
                  onChange={(e) => onChange({ ...config, width: parseInt(e.target.value) || 0 })}
                  className="w-24 h-9 text-sm text-center font-semibold"
                  placeholder="Width"
                />
              </div>
              <button
                onClick={() => onChange({ ...config, maintainAspectRatio: !config.maintainAspectRatio })}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  config.maintainAspectRatio
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
                title={config.maintainAspectRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
              >
                {config.maintainAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-8">H</label>
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  value={config.height || ""}
                  onChange={(e) => onChange({ ...config, height: parseInt(e.target.value) || 0 })}
                  className="w-24 h-9 text-sm text-center font-semibold"
                  placeholder="Height"
                  disabled={config.maintainAspectRatio && config.width > 0}
                />
              </div>
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Scale to</span>
              <Input
                type="number"
                min={1}
                max={500}
                value={config.percentage}
                onChange={(e) => onChange({ ...config, percentage: parseInt(e.target.value) || 100 })}
                className="w-20 h-9 text-sm text-center font-semibold"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

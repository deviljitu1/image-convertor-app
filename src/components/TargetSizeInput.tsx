import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Target } from "lucide-react";

export type SizeUnit = "KB" | "MB";

export interface TargetSizeConfig {
  enabled: boolean;
  value: number;
  unit: SizeUnit;
}

interface TargetSizeInputProps {
  config: TargetSizeConfig;
  onChange: (config: TargetSizeConfig) => void;
}

export default function TargetSizeInput({ config, onChange }: TargetSizeInputProps) {
  const handleValueChange = (raw: string) => {
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0) {
      onChange({ ...config, value: num });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium text-foreground font-display">Target File Size</label>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
        />
      </div>

      {config.enabled && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            step={1}
            value={config.value}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-24 text-sm"
            placeholder="Size"
          />
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["KB", "MB"] as SizeUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => onChange({ ...config, unit: u })}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  config.unit === u
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-1">
            Auto-adjusts quality to hit target
          </span>
        </div>
      )}
    </div>
  );
}

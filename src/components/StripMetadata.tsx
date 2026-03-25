import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";

interface StripMetadataProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function StripMetadata({ enabled, onChange }: StripMetadataProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <div>
          <label className="text-sm font-medium text-foreground font-display block">Strip Metadata</label>
          <p className="text-xs text-muted-foreground">Remove EXIF, GPS, camera info for privacy</p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
}

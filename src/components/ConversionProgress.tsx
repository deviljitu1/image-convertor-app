import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ConversionProgressProps {
  current: number;
  total: number;
  currentFileName: string;
}

export default function ConversionProgress({ current, total, currentFileName }: ConversionProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-3 py-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-foreground font-medium font-display">
            Converting {current}/{total}
          </span>
        </div>
        <span className="text-primary font-semibold">{percent}%</span>
      </div>
      <Progress value={percent} className="h-2" />
      <p className="text-xs text-muted-foreground truncate">
        Processing: {currentFileName}
      </p>
    </div>
  );
}

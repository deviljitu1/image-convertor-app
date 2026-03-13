import { Slider } from "@/components/ui/slider";

interface QualitySliderProps {
  quality: number;
  onChange: (q: number) => void;
}

export default function QualitySlider({ quality, onChange }: QualitySliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground font-display">Quality</label>
        <span className="text-sm font-semibold text-primary">{quality}%</span>
      </div>
      <Slider
        value={[quality]}
        onValueChange={([v]) => onChange(v)}
        min={10}
        max={100}
        step={5}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Smaller file</span>
        <span>Higher quality</span>
      </div>
    </div>
  );
}

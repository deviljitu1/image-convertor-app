export type OutputFormat = "png" | "jpeg" | "webp" | "gif" | "bmp" | "avif" | "ico" | "svg" | "tiff";

export const FORMAT_LIST: { value: OutputFormat; label: string; mime: string }[] = [
  { value: "png", label: "PNG", mime: "image/png" },
  { value: "jpeg", label: "JPG", mime: "image/jpeg" },
  { value: "webp", label: "WebP", mime: "image/webp" },
  { value: "gif", label: "GIF", mime: "image/gif" },
  { value: "bmp", label: "BMP", mime: "image/bmp" },
  { value: "avif", label: "AVIF", mime: "image/avif" },
  { value: "ico", label: "ICO", mime: "image/x-icon" },
  { value: "tiff", label: "TIFF", mime: "image/tiff" },
];

interface FormatSelectorProps {
  selected: OutputFormat;
  onChange: (f: OutputFormat) => void;
}

export default function FormatSelector({ selected, onChange }: FormatSelectorProps) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground font-display mb-2 block">Output Format</label>
      <div className="flex flex-wrap gap-2">
        {FORMAT_LIST.map(f => (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className={`format-chip ${selected === f.value ? "format-chip-active" : "format-chip-inactive"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

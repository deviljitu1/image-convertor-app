import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
}

const ACCEPTED = "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml,image/avif,image/x-icon";

export default function DropZone({ onFilesAdded, files, onRemoveFile }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (dropped.length) onFilesAdded(dropped);
  }, [onFilesAdded]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) onFilesAdded(selected);
    e.target.value = "";
  }, [onFilesAdded]);

  return (
    <div
      className={`drop-zone ${dragActive ? "drop-zone-active" : ""} p-8 md:p-12 text-center`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      {files.length === 0 ? (
        <label className="cursor-pointer flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-display font-semibold text-foreground">
              Drop images here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG, JPG, WebP, GIF, BMP, TIFF, SVG, AVIF, ICO
            </p>
          </div>
          <input type="file" className="hidden" accept={ACCEPTED} multiple onChange={handleChange} />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 justify-center">
            {files.map((f, i) => (
              <div key={i} className="relative group bg-card rounded-lg p-2 shadow-[var(--shadow-sm)] flex items-center gap-2 pr-8 border border-border">
                <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{f.name}</span>
                <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
                <button
                  onClick={() => onRemoveFile(i)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
            <Upload className="w-4 h-4" /> Add more
            <input type="file" className="hidden" accept={ACCEPTED} multiple onChange={handleChange} />
          </label>
        </div>
      )}
    </div>
  );
}

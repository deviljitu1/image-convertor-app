import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon, GripVertical, FileArchive } from "lucide-react";
import JSZip from "jszip";

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
  onReorder: (files: File[]) => void;
}

const ACCEPTED = "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml,image/avif,image/x-icon,application/zip,application/x-zip-compressed";

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff", ".tif", ".svg", ".avif", ".ico"];

async function extractImagesFromZip(file: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(file);
  const images: File[] = [];
  const entries = Object.entries(zip.files).filter(
    ([name, entry]) => !entry.dir && IMAGE_EXTS.some(ext => name.toLowerCase().endsWith(ext))
  );
  for (const [name, entry] of entries) {
    const blob = await entry.async("blob");
    const fileName = name.split("/").pop() || name;
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
      gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff", tif: "image/tiff",
      svg: "image/svg+xml", avif: "image/avif", ico: "image/x-icon",
    };
    images.push(new File([blob], fileName, { type: mimeMap[ext] || "image/png" }));
  }
  return images;
}

export default function DropZone({ onFilesAdded, files, onRemoveFile, onReorder }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    // If reordering internally, handle that
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const reordered = [...files];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(overIdx, 0, moved);
      onReorder(reordered);
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setDragIdx(null);
    setOverIdx(null);
    const dropped = Array.from(e.dataTransfer.files);
    processFiles(dropped);
  }, [onFilesAdded, files, onReorder, dragIdx, overIdx]);

  const processFiles = useCallback(async (selected: File[]) => {
    const images: File[] = [];
    for (const f of selected) {
      if (f.type === "application/zip" || f.type === "application/x-zip-compressed" || f.name.toLowerCase().endsWith(".zip")) {
        const extracted = await extractImagesFromZip(f);
        images.push(...extracted);
      } else if (f.type.startsWith("image/")) {
        images.push(f);
      }
    }
    if (images.length) onFilesAdded(images);
  }, [onFilesAdded]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    processFiles(selected);
    e.target.value = "";
  }, [processFiles]);

  const handleItemDragEnd = () => {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const reordered = [...files];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(overIdx, 0, moved);
      onReorder(reordered);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div
      className={`drop-zone ${dragActive ? "drop-zone-active" : ""} p-8 md:p-12 text-center`}
      onDragOver={(e) => { e.preventDefault(); if (dragIdx === null) setDragActive(true); }}
      onDragLeave={() => { if (dragIdx === null) setDragActive(false); }}
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
          <div className="flex flex-wrap gap-2 justify-center">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
                onDragEnd={handleItemDragEnd}
                className={`relative group bg-card rounded-lg p-2 shadow-[var(--shadow-sm)] flex items-center gap-1.5 pr-8 border transition-all cursor-grab active:cursor-grabbing ${
                  overIdx === i && dragIdx !== null && dragIdx !== i
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-border"
                } ${dragIdx === i ? "opacity-40" : ""}`}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{f.name}</span>
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

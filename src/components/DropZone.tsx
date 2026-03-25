import { useCallback, useState, useMemo } from "react";
import { Upload, X, GripVertical, FileArchive, ImageIcon, Trash2 } from "lucide-react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
  onReorder: (files: File[]) => void;
  onClearAll: () => void;
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileThumbnail({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  return (
    <img
      src={url}
      alt=""
      className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0 border border-border"
      onLoad={() => URL.revokeObjectURL(url)}
    />
  );
}

export default function DropZone({ onFilesAdded, files, onRemoveFile, onReorder, onClearAll }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
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
    await processFiles(dropped);
  }, [onFilesAdded, files, onReorder, dragIdx, overIdx]);

  const processFiles = useCallback(async (selected: File[]) => {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  }, [onFilesAdded]);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    await processFiles(selected);
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

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div
      className={`drop-zone relative ${dragActive ? "drop-zone-active" : ""} ${files.length === 0 ? "p-10 md:p-14" : "p-5"} text-center transition-all duration-300`}
      onDragOver={(e) => { e.preventDefault(); if (dragIdx === null) setDragActive(true); }}
      onDragLeave={() => { if (dragIdx === null) setDragActive(false); }}
      onDrop={handleDrop}
    >
      {loading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-primary font-display font-semibold">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Extracting images...
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <label className="cursor-pointer flex flex-col items-center gap-5 group">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">
              Drop images or ZIP here
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              or <span className="text-primary font-medium underline underline-offset-2">browse files</span> from your computer
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
            {["PNG", "JPG", "WebP", "GIF", "AVIF", "SVG", "BMP", "TIFF", "ICO"].map((fmt) => (
              <span key={fmt} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                {fmt}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
              <FileArchive className="w-3 h-3" /> ZIP
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Supports large files • No size limit • 100% local</p>
          <input type="file" className="hidden" accept={ACCEPTED} multiple onChange={handleChange} />
        </label>
      ) : (
        <div className="space-y-3">
          {/* Summary bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-foreground">
                {files.length} image{files.length > 1 ? "s" : ""}
              </span>
              <span className="text-muted-foreground">({formatFileSize(totalSize)})</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-primary cursor-pointer hover:underline font-medium">
                <Upload className="w-3.5 h-3.5" /> Add more
                <input type="file" className="hidden" accept={ACCEPTED} multiple onChange={handleChange} />
              </label>
              <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            </div>
          </div>

          {/* File list */}
          <div className="grid gap-1.5 max-h-60 overflow-y-auto pr-1">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
                onDragEnd={handleItemDragEnd}
                className={`relative group bg-background/50 rounded-lg p-2 flex items-center gap-2.5 pr-9 border transition-all cursor-grab active:cursor-grabbing ${
                  overIdx === i && dragIdx !== null && dragIdx !== i
                    ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                    : "border-border/50 hover:border-border"
                } ${dragIdx === i ? "opacity-40 scale-95" : ""}`}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                <FileThumbnail file={f} />
                <div className="min-w-0 text-left flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                </div>
                <button
                  onClick={() => onRemoveFile(i)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

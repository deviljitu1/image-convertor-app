import { useState, useRef, useCallback } from "react";
import { X, Eye } from "lucide-react";
import type { ConvertedFile } from "@/lib/imageConverter";

interface BeforeAfterPreviewProps {
  result: ConvertedFile;
  onClose: () => void;
}

export default function BeforeAfterPreview({ result, onClose }: BeforeAfterPreviewProps) {
  const [split, setSplit] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateSplit = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSplit(pct);
  }, []);

  const handlePointerDown = () => { dragging.current = true; };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updateSplit(e.clientX);
  };
  const handlePointerUp = () => { dragging.current = false; };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-lg max-w-3xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-sm text-foreground">
              Before / After — {result.name}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Comparison area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-video cursor-col-resize select-none overflow-hidden bg-muted"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* After (full width behind) */}
          <img
            src={result.url}
            alt="After"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />

          {/* Before (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${split}%` }}
          >
            <img
              src={result.originalUrl}
              alt="Before"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ width: `${containerRef.current?.offsetWidth || 100}px`, maxWidth: "none" }}
              draggable={false}
            />
          </div>

          {/* Slider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg"
            style={{ left: `${split}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md text-xs font-bold">
              ⇔
            </div>
          </div>

          {/* Labels */}
          <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded">
            Original
          </span>
          <span className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded">
            Converted
          </span>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <span>Original: {formatSize(result.originalSize)}</span>
          <span>Converted: {formatSize(result.newSize)}</span>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

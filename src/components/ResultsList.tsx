import { useState } from "react";
import { Download, Check, ArrowDown, Archive, Eye, Sparkles } from "lucide-react";
import type { ConvertedFile } from "@/lib/imageConverter";
import { Button } from "@/components/ui/button";
import BeforeAfterPreview from "@/components/BeforeAfterPreview";
import JSZip from "jszip";

interface ResultsListProps {
  results: ConvertedFile[];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function savingPercent(orig: number, next: number) {
  if (orig === 0) return 0;
  return Math.round(((orig - next) / orig) * 100);
}

export default function ResultsList({ results }: ResultsListProps) {
  const [compareIdx, setCompareIdx] = useState<number | null>(null);

  const downloadAllZip = async () => {
    const zip = new JSZip();
    results.forEach(r => zip.file(r.name, r.blob));
    const content = await zip.generateAsync({ type: "blob", streamFiles: true });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalNew = results.reduce((s, r) => s + r.newSize, 0);
  const totalSaved = savingPercent(totalOriginal, totalNew);

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-success" />
          </div>
          <span className="font-display font-bold text-foreground">
            {results.length} file{results.length > 1 ? "s" : ""} ready
          </span>
        </div>
        <Button onClick={downloadAllZip} size="sm" className="gap-2 font-display" style={{ background: "var(--gradient-accent)" }}>
          <Archive className="w-4 h-4" /> Download ZIP
        </Button>
      </div>

      {/* Savings banner */}
      {totalSaved > 0 && (
        <div className="bg-success/10 border border-success/20 text-success rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          You saved {formatSize(totalOriginal - totalNew)} ({totalSaved}% smaller)
          <span className="text-success/70 ml-auto text-xs">
            {formatSize(totalOriginal)} → {formatSize(totalNew)}
          </span>
        </div>
      )}

      {/* File list */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {results.map((r, i) => {
          const saved = savingPercent(r.originalSize, r.newSize);
          return (
            <div key={i} className="bg-background/50 border border-border/50 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-border transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <img src={r.url} alt="" className="w-11 h-11 rounded-lg object-cover bg-muted shrink-0 border border-border" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(r.originalSize)} → {formatSize(r.newSize)}
                    {saved > 0 && <span className="text-success font-medium ml-1.5">-{saved}%</span>}
                    {saved < 0 && <span className="text-warning font-medium ml-1.5">+{Math.abs(saved)}%</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setCompareIdx(i)}
                  className="w-8 h-8 rounded-lg bg-muted/50 text-muted-foreground flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Compare before/after"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <a
                  href={r.url}
                  download={r.name}
                  className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {compareIdx !== null && (
        <BeforeAfterPreview
          result={results[compareIdx]}
          onClose={() => setCompareIdx(null)}
        />
      )}
    </div>
  );
}

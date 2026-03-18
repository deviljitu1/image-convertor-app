import { useState } from "react";
import { Download, Check, ArrowDown, Archive, Eye } from "lucide-react";
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
    const content = await zip.generateAsync({ type: "blob" });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-accent" />
          <span className="font-display font-semibold text-foreground">
            {results.length} file{results.length > 1 ? "s" : ""} converted
          </span>
        </div>
        {results.length > 1 && (
          <Button onClick={downloadAllZip} size="sm" variant="outline" className="gap-2">
            <Archive className="w-4 h-4" /> Download ZIP
          </Button>
        )}
      </div>

      {totalSaved > 0 && (
        <div className="bg-accent/10 text-accent rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2">
          <ArrowDown className="w-4 h-4" />
          Total savings: {formatSize(totalOriginal - totalNew)} ({totalSaved}% smaller)
        </div>
      )}

      <div className="space-y-2">
        {results.map((r, i) => {
          const saved = savingPercent(r.originalSize, r.newSize);
          return (
            <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3 min-w-0">
                <img src={r.url} alt="" className="w-10 h-10 rounded object-cover bg-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(r.originalSize)} → {formatSize(r.newSize)}
                    {saved > 0 && <span className="text-accent ml-1">(-{saved}%)</span>}
                    {saved < 0 && <span className="text-warning ml-1">(+{Math.abs(saved)}%)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setCompareIdx(i)}
                  className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Compare before/after"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <a
                  href={r.url}
                  download={r.name}
                  className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
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

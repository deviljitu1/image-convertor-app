import { useState } from "react";
import DropZone from "@/components/DropZone";
import FormatSelector, { type OutputFormat } from "@/components/FormatSelector";
import QualitySlider from "@/components/QualitySlider";
import TargetSizeInput, { type TargetSizeConfig } from "@/components/TargetSizeInput";
import BatchRename, { type BatchRenameConfig, applyRenamePattern } from "@/components/BatchRename";
import ResultsList from "@/components/ResultsList";
import { convertAll, type ConvertedFile } from "@/lib/imageConverter";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Loader2, Sparkles } from "lucide-react";

export default function Index() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState<TargetSizeConfig>({
    enabled: false,
    value: 100,
    unit: "KB",
  });
  const [batchRename, setBatchRename] = useState<BatchRenameConfig>({
    enabled: false,
    pattern: "{name}-compressed",
  });
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState<ConvertedFile[]>([]);

  const getTargetBytes = (): number | undefined => {
    if (!targetSize.enabled) return undefined;
    return targetSize.unit === "KB" ? targetSize.value * 1024 : targetSize.value * 1024 * 1024;
  };

  const handleConvert = async () => {
    if (!files.length) return;
    setConverting(true);
    setResults([]);
    try {
      let converted = await convertAll(files, format, quality, getTargetBytes());

      // Apply batch rename if enabled
      if (batchRename.enabled && batchRename.pattern.trim()) {
        const ext = format === "jpeg" ? "jpg" : format;
        converted = converted.map((r, i) => ({
          ...r,
          name: applyRenamePattern(batchRename.pattern, files[i]?.name || r.name, i, ext),
        }));
      }

      setResults(converted);

      // Auto-download as ZIP
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      converted.forEach((r) => zip.file(r.name, r.blob));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "converted-images.zip";
      a.click();
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setConverting(false);
    }
  };

  const handleReset = () => {
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setFiles([]);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background" style={{ backgroundImage: "var(--gradient-surface)" }}>
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <ArrowRightLeft className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground leading-tight">Pixel Forge</h1>
            <p className="text-xs text-muted-foreground">Image converter & compressor</p>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3 h-3" /> Free &middot; No upload &middot; 100% in-browser
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight mb-2">
          Convert & compress images<br />in seconds
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          PNG, JPG, WebP, GIF, BMP, AVIF, SVG, TIFF, ICO — convert between any format with adjustable quality.
        </p>
      </section>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-lg)] p-6 space-y-6">
          <DropZone
            files={files}
            onFilesAdded={(newFiles) => { setFiles((prev) => [...prev, ...newFiles]); setResults([]); }}
            onRemoveFile={(i) => { setFiles((prev) => prev.filter((_, idx) => idx !== i)); setResults([]); }}
            onReorder={(reordered) => { setFiles(reordered); setResults([]); }}
          />

          {files.length > 0 && (
            <>
              <FormatSelector selected={format} onChange={setFormat} />
              <QualitySlider quality={quality} onChange={setQuality} />
              <TargetSizeInput config={targetSize} onChange={setTargetSize} />
              <BatchRename config={batchRename} onChange={setBatchRename} fileCount={files.length} />

              <div className="flex gap-3">
                <Button
                  onClick={handleConvert}
                  disabled={converting}
                  className="flex-1 gap-2 font-display font-semibold"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {converting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</>
                  ) : (
                    <><ArrowRightLeft className="w-4 h-4" /> Convert {files.length} file{files.length > 1 ? "s" : ""}</>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} className="font-display">
                  Clear
                </Button>
              </div>
            </>
          )}

          {results.length > 0 && (
            <div className="border-t border-border pt-6">
              <ResultsList results={results} />
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground max-w-lg mx-auto space-y-2">
          <p className="font-display font-medium text-foreground">Why Pixel Forge?</p>
          <p>All conversions happen locally in your browser — no files are uploaded to any server. Convert PNG to WebP for faster websites, compress JPEG for smaller emails, or change formats for compatibility. Completely free, unlimited, and private.</p>
        </div>
      </main>
    </div>
  );
}

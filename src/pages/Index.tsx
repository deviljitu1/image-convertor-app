import { useState, useCallback } from "react";
import DropZone from "@/components/DropZone";
import FormatSelector, { type OutputFormat } from "@/components/FormatSelector";
import QualitySlider from "@/components/QualitySlider";
import TargetSizeInput, { type TargetSizeConfig } from "@/components/TargetSizeInput";
import BatchRename, { type BatchRenameConfig, applyRenamePattern } from "@/components/BatchRename";
import ImageResize, { type ResizeConfig } from "@/components/ImageResize";
import StripMetadata from "@/components/StripMetadata";
import ConversionProgress from "@/components/ConversionProgress";
import ResultsList from "@/components/ResultsList";
import DarkModeToggle from "@/components/DarkModeToggle";
import { convertAllSequential, type ConvertedFile } from "@/lib/imageConverter";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Sparkles, Zap, Shield, Layers, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";

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
    pattern: "{name}-{n}",
  });
  const [resize, setResize] = useState<ResizeConfig>({
    enabled: false,
    mode: "percentage",
    width: 0,
    height: 0,
    percentage: 50,
    maintainAspectRatio: true,
  });
  const [stripMetadata, setStripMetadata] = useState(true);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, fileName: "" });
  const [results, setResults] = useState<ConvertedFile[]>([]);

  const getTargetBytes = (): number | undefined => {
    if (!targetSize.enabled) return undefined;
    return targetSize.unit === "KB" ? targetSize.value * 1024 : targetSize.value * 1024 * 1024;
  };

  const handleConvert = async () => {
    if (!files.length) return;
    setConverting(true);
    setResults([]);
    setProgress({ current: 0, total: files.length, fileName: files[0]?.name || "" });

    try {
      let converted = await convertAllSequential(
        files,
        format,
        quality,
        getTargetBytes(),
        resize,
        (current, fileName) => {
          setProgress({ current, total: files.length, fileName });
        }
      );

      // Apply batch rename
      if (batchRename.enabled && batchRename.pattern.trim()) {
        const ext = format === "jpeg" ? "jpg" : format;
        converted = converted.map((r, i) => ({
          ...r,
          name: applyRenamePattern(batchRename.pattern, files[i]?.name || r.name, i, ext),
        }));
        const nameCounts = new Map<string, number>();
        converted = converted.map((r) => {
          const count = nameCounts.get(r.name) || 0;
          nameCounts.set(r.name, count + 1);
          if (count > 0) {
            const dot = r.name.lastIndexOf(".");
            const base = dot > 0 ? r.name.substring(0, dot) : r.name;
            const extension = dot > 0 ? r.name.substring(dot) : "";
            return { ...r, name: `${base}-${count}${extension}` };
          }
          return r;
        });
      }

      setResults(converted);

      // Auto-download as ZIP
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      converted.forEach((r) => zip.file(r.name, r.blob));
      const zipBlob = await zip.generateAsync({ type: "blob", streamFiles: true });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "converted-images.zip";
      a.click();
      URL.revokeObjectURL(zipUrl);

      const totalOriginal = converted.reduce((s, r) => s + r.originalSize, 0);
      const totalNew = converted.reduce((s, r) => s + r.newSize, 0);
      const savedPct = totalOriginal > 0 ? Math.round(((totalOriginal - totalNew) / totalOriginal) * 100) : 0;

      toast.success(`${converted.length} files converted!`, {
        description: savedPct > 0 ? `Saved ${savedPct}% file size` : undefined,
      });
    } catch (err) {
      console.error(err);
      toast.error("Conversion failed", { description: "Some images could not be processed." });
    } finally {
      setConverting(false);
    }
  };

  const handleReset = useCallback(() => {
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setFiles([]);
    setResults([]);
  }, [results]);

  return (
    <div className="min-h-screen bg-background" style={{ backgroundImage: "var(--gradient-surface)" }}>
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <ArrowRightLeft className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">Pixel Forge</h1>
              <p className="text-[11px] text-muted-foreground">Convert • Compress • Resize</p>
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" /> Free &middot; No upload &middot; 100% in-browser
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-3">
          Convert & compress images
          <br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
            in seconds
          </span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-base">
          PNG, JPG, WebP, GIF, BMP, AVIF, SVG, TIFF, ICO — convert between any format.
          Resize, compress, rename. No file size limits.
        </p>
      </section>

      {/* Main Card */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-card border border-border/70 rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
          {/* Drop Zone */}
          <div className="p-6 pb-4">
            <DropZone
              files={files}
              onFilesAdded={(newFiles) => { setFiles((prev) => [...prev, ...newFiles]); setResults([]); }}
              onRemoveFile={(i) => { setFiles((prev) => prev.filter((_, idx) => idx !== i)); setResults([]); }}
              onReorder={(reordered) => { setFiles(reordered); setResults([]); }}
              onClearAll={handleReset}
            />
          </div>

          {/* Settings */}
          {files.length > 0 && (
            <div className="border-t border-border/50">
              <div className="p-6 space-y-5">
                <FormatSelector selected={format} onChange={setFormat} />

                <div className="grid md:grid-cols-2 gap-5">
                  <QualitySlider quality={quality} onChange={setQuality} />
                  <ImageResize config={resize} onChange={setResize} />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <TargetSizeInput config={targetSize} onChange={setTargetSize} />
                  <BatchRename config={batchRename} onChange={setBatchRename} fileCount={files.length} />
                </div>

                <StripMetadata enabled={stripMetadata} onChange={setStripMetadata} />

                {/* Convert button */}
                {converting ? (
                  <ConversionProgress
                    current={progress.current}
                    total={progress.total}
                    currentFileName={progress.fileName}
                  />
                ) : (
                  <Button
                    onClick={handleConvert}
                    disabled={converting}
                    size="lg"
                    className="w-full gap-2.5 font-display font-bold text-base h-12"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Zap className="w-5 h-5" />
                    Convert {files.length} file{files.length > 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="border-t border-border/50 p-6">
              <ResultsList results={results} />
            </div>
          )}
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            { icon: Shield, title: "100% Private", desc: "Everything runs in your browser. No files leave your device." },
            { icon: Layers, title: "Batch Processing", desc: "Convert hundreds of images at once. Upload ZIP archives for bulk ops." },
            { icon: MonitorSmartphone, title: "No Limits", desc: "No file size cap, no watermarks, no sign-ups. Completely free forever." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border/50 rounded-xl p-5 text-center hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-muted-foreground">
          <p>Built with ❤️ — No data ever leaves your browser</p>
        </div>
      </main>
    </div>
  );
}

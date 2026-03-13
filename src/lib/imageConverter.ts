import type { OutputFormat } from "@/components/FormatSelector";
import { FORMAT_LIST } from "@/components/FormatSelector";

export interface ConvertedFile {
  name: string;
  blob: Blob;
  originalSize: number;
  newSize: number;
  format: OutputFormat;
  url: string;
}

export async function convertImage(
  file: File,
  format: OutputFormat,
  quality: number
): Promise<ConvertedFile> {
  return new Promise((resolve, reject) => {
    // For SVG input being converted to SVG output, just pass through
    if (file.type === "image/svg+xml" && format === "svg") {
      const url = URL.createObjectURL(file);
      resolve({
        name: replaceExt(file.name, "svg"),
        blob: file,
        originalSize: file.size,
        newSize: file.size,
        format,
        url,
      });
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const formatInfo = FORMAT_LIST.find(f => f.value === format);
        const mime = formatInfo?.mime || "image/png";
        const q = quality / 100;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Conversion failed"));
              return;
            }
            const url = URL.createObjectURL(blob);
            resolve({
              name: replaceExt(file.name, format === "jpeg" ? "jpg" : format),
              blob,
              originalSize: file.size,
              newSize: blob.size,
              format,
              url,
            });
          },
          mime,
          q
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.substring(0, dot) : name;
  return `${base}.${ext}`;
}

export async function convertAll(
  files: File[],
  format: OutputFormat,
  quality: number
): Promise<ConvertedFile[]> {
  return Promise.all(files.map(f => convertImage(f, format, quality)));
}

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

/**
 * Apply a subtle sharpening filter to maintain clarity after compression.
 * Uses unsharp-mask technique via canvas convolution.
 */
function sharpenCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  amount: number = 0.3
) {
  const w = canvas.width;
  const h = canvas.height;
  const srcData = ctx.getImageData(0, 0, w, h);
  const src = srcData.data;
  const dest = ctx.createImageData(w, h);
  const d = dest.data;

  // Simple unsharp: blend original with difference from box-blurred version
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        // Average of 4 neighbors
        const avg =
          (src[((y - 1) * w + x) * 4 + c] +
            src[((y + 1) * w + x) * 4 + c] +
            src[(y * w + x - 1) * 4 + c] +
            src[(y * w + x + 1) * 4 + c]) / 4;
        const sharp = src[i + c] + (src[i + c] - avg) * amount;
        d[i + c] = Math.max(0, Math.min(255, sharp));
      }
      d[i + 3] = src[i + 3]; // alpha
    }
  }
  ctx.putImageData(dest, 0, 0);
}

/** Convert a single image at a specific quality (0–1), with optional sharpening */
function convertAtQuality(
  img: HTMLImageElement,
  mime: string,
  quality: number,
  applySharpen: boolean = false
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;

    // Use high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0);

    // Apply sharpening when compressing aggressively to preserve clarity
    if (applySharpen) {
      sharpenCanvas(canvas, ctx, 0.25);
    }

    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Conversion failed"))),
      mime,
      quality
    );
  });
}

/** Load File into an HTMLImageElement */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Binary-search quality to get the blob as close to targetBytes as possible
 * while keeping quality as high as we can.
 */
async function compressToTarget(
  img: HTMLImageElement,
  mime: string,
  targetBytes: number,
  maxQuality: number
): Promise<Blob> {
  // Never go below 0.05 quality to preserve clarity
  let lo = 0.05;
  let hi = maxQuality;
  let bestBlob = await convertAtQuality(img, mime, hi, false);

  // If even at max quality we're under target, return that
  if (bestBlob.size <= targetBytes) return bestBlob;

  // Binary search for highest quality that fits target
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    // Apply sharpening when quality drops below 0.5 to compensate for compression artifacts
    const needsSharpen = mid < 0.5;
    const blob = await convertAtQuality(img, mime, mid, needsSharpen);
    if (blob.size <= targetBytes) {
      bestBlob = blob;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return bestBlob;
}

export async function convertImage(
  file: File,
  format: OutputFormat,
  quality: number,
  targetBytes?: number
): Promise<ConvertedFile> {
  // SVG passthrough
  if (file.type === "image/svg+xml" && format === "svg") {
    const url = URL.createObjectURL(file);
    return {
      name: replaceExt(file.name, "svg"),
      blob: file,
      originalSize: file.size,
      newSize: file.size,
      format,
      url,
    };
  }

  const img = await loadImage(file);
  const formatInfo = FORMAT_LIST.find((f) => f.value === format);
  const mime = formatInfo?.mime || "image/png";
  const q = quality / 100;

  let blob: Blob;

  if (targetBytes && targetBytes > 0) {
    blob = await compressToTarget(img, mime, targetBytes, q);
  } else {
    blob = await convertAtQuality(img, mime, q, false);
  }

  const url = URL.createObjectURL(blob);
  return {
    name: replaceExt(file.name, format === "jpeg" ? "jpg" : format),
    blob,
    originalSize: file.size,
    newSize: blob.size,
    format,
    url,
  };
}

function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.substring(0, dot) : name;
  return `${base}.${ext}`;
}

export async function convertAll(
  files: File[],
  format: OutputFormat,
  quality: number,
  targetBytes?: number
): Promise<ConvertedFile[]> {
  return Promise.all(files.map((f) => convertImage(f, format, quality, targetBytes)));
}

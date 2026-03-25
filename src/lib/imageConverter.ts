import type { OutputFormat } from "@/components/FormatSelector";
import { FORMAT_LIST } from "@/components/FormatSelector";
import type { ResizeConfig } from "@/components/ImageResize";

export interface ConvertedFile {
  name: string;
  blob: Blob;
  originalSize: number;
  newSize: number;
  format: OutputFormat;
  url: string;
  originalUrl: string;
}

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

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const avg =
          (src[((y - 1) * w + x) * 4 + c] +
            src[((y + 1) * w + x) * 4 + c] +
            src[(y * w + x - 1) * 4 + c] +
            src[(y * w + x + 1) * 4 + c]) / 4;
        const sharp = src[i + c] + (src[i + c] - avg) * amount;
        d[i + c] = Math.max(0, Math.min(255, sharp));
      }
      d[i + 3] = src[i + 3];
    }
  }
  ctx.putImageData(dest, 0, 0);
}

function getResizedDimensions(
  naturalWidth: number,
  naturalHeight: number,
  resize?: ResizeConfig
): { width: number; height: number } {
  if (!resize || !resize.enabled) return { width: naturalWidth, height: naturalHeight };

  if (resize.mode === "percentage") {
    const scale = resize.percentage / 100;
    return {
      width: Math.round(naturalWidth * scale),
      height: Math.round(naturalHeight * scale),
    };
  }

  // Pixels mode
  if (resize.maintainAspectRatio) {
    if (resize.width > 0) {
      const ratio = resize.width / naturalWidth;
      return { width: resize.width, height: Math.round(naturalHeight * ratio) };
    }
    if (resize.height > 0) {
      const ratio = resize.height / naturalHeight;
      return { width: Math.round(naturalWidth * ratio), height: resize.height };
    }
  }

  return {
    width: resize.width > 0 ? resize.width : naturalWidth,
    height: resize.height > 0 ? resize.height : naturalHeight,
  };
}

function convertAtQuality(
  img: HTMLImageElement,
  mime: string,
  quality: number,
  applySharpen: boolean = false,
  resize?: ResizeConfig
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { width, height } = getResizedDimensions(img.naturalWidth, img.naturalHeight, resize);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Use createObjectURL for large files instead of readAsDataURL (avoids memory issues)
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

async function compressToTarget(
  img: HTMLImageElement,
  mime: string,
  targetBytes: number,
  maxQuality: number,
  resize?: ResizeConfig
): Promise<Blob> {
  let lo = 0.05;
  let hi = maxQuality;
  let bestBlob = await convertAtQuality(img, mime, hi, false, resize);

  if (bestBlob.size <= targetBytes) return bestBlob;

  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    const needsSharpen = mid < 0.5;
    const blob = await convertAtQuality(img, mime, mid, needsSharpen, resize);
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
  targetBytes?: number,
  resize?: ResizeConfig
): Promise<ConvertedFile> {
  if (file.type === "image/svg+xml" && format === "svg") {
    const url = URL.createObjectURL(file);
    return {
      name: replaceExt(file.name, "svg"),
      blob: file,
      originalSize: file.size,
      newSize: file.size,
      format,
      url,
      originalUrl: url,
    };
  }

  const img = await loadImage(file);
  const formatInfo = FORMAT_LIST.find((f) => f.value === format);
  const mime = formatInfo?.mime || "image/png";
  const q = quality / 100;

  let blob: Blob;

  if (targetBytes && targetBytes > 0) {
    blob = await compressToTarget(img, mime, targetBytes, q, resize);
  } else {
    blob = await convertAtQuality(img, mime, q, false, resize);
  }

  const originalUrl = URL.createObjectURL(file);
  const url = URL.createObjectURL(blob);
  return {
    name: replaceExt(file.name, format === "jpeg" ? "jpg" : format),
    blob,
    originalSize: file.size,
    newSize: blob.size,
    format,
    url,
    originalUrl,
  };
}

function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.substring(0, dot) : name;
  return `${base}.${ext}`;
}

/** Convert files one-by-one for better memory handling and progress tracking */
export async function convertAllSequential(
  files: File[],
  format: OutputFormat,
  quality: number,
  targetBytes?: number,
  resize?: ResizeConfig,
  onProgress?: (current: number, fileName: string) => void
): Promise<ConvertedFile[]> {
  const results: ConvertedFile[] = [];
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files[i].name);
    const result = await convertImage(files[i], format, quality, targetBytes, resize);
    results.push(result);
  }
  onProgress?.(files.length, "");
  return results;
}

export async function convertAll(
  files: File[],
  format: OutputFormat,
  quality: number,
  targetBytes?: number,
  resize?: ResizeConfig
): Promise<ConvertedFile[]> {
  return Promise.all(files.map((f) => convertImage(f, format, quality, targetBytes, resize)));
}

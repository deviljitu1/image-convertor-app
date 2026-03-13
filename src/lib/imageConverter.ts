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

/** Convert a single image at a specific quality (0–1) */
function convertAtQuality(
  img: HTMLImageElement,
  mime: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
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
  let lo = 0.01;
  let hi = maxQuality;
  let bestBlob = await convertAtQuality(img, mime, hi);

  // If even at max quality we're under target, return that
  if (bestBlob.size <= targetBytes) return bestBlob;

  // Binary search for ~10 iterations
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const blob = await convertAtQuality(img, mime, mid);
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
    blob = await convertAtQuality(img, mime, q);
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

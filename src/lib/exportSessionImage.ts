// src/lib/exportSessionImage.ts - Generate filtered session exports using html-to-image.

import {
  EXPORT_BACKGROUND_COLOR,
  EXPORT_FILENAME,
  EXPORT_PIXEL_RATIO,
  EXPORT_SHARE_JPEG_QUALITY,
} from "./exportConfig";

const EXPORT_EXCLUDE_FLAG = "exportExclude";

type ExportSessionImageOptions = {
  pixelRatio?: number;
  backgroundColor?: string;
};

type ExportSessionImageResult = {
  blob: Blob;
  file: File;
};

let htmlToImagePromise:
  | Promise<typeof import("html-to-image")>
  | null = null;

const loadHtmlToImage = () => {
  if (!htmlToImagePromise) {
    htmlToImagePromise = import("html-to-image");
  }
  return htmlToImagePromise;
};

const filter = (node: HTMLElement): boolean => {
  if (!(node instanceof HTMLElement)) return true;
  return node.dataset?.[EXPORT_EXCLUDE_FLAG] !== "true";
};

function forceInlineImageLoad(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  images.forEach((img) => {
    const image = img as HTMLImageElement & { loading?: string };
    if (image.loading === "lazy") {
      image.loading = "eager";
    }
    if ("decoding" in image) {
      image.decoding = "sync";
    }
  });
}

const isTransparent = (color: string | null) => {
  if (!color) return true;
  if (color === "transparent") return true;
  if (color.startsWith("rgba")) {
    const alpha = Number.parseFloat(color.split(",")[3]);
    return Number.isFinite(alpha) ? alpha === 0 : false;
  }
  if (color.startsWith("hsla")) {
    const alpha = Number.parseFloat(color.split(",")[3]);
    return Number.isFinite(alpha) ? alpha === 0 : false;
  }
  return false;
};

async function ensureImagesDecoded(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return;

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();

      if ("decode" in img) {
        return (img as HTMLImageElement & { decode?: () => Promise<void> })
          .decode?.()
          .catch(() => undefined);
      }

      return new Promise<void>((resolve) => {
        const image = img as HTMLImageElement;
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }),
  );
}

export async function exportSessionImage(
  node: HTMLElement | null,
  options: ExportSessionImageOptions = {},
): Promise<ExportSessionImageResult> {
  if (!node) {
    throw new Error("exportSessionImage: target node is missing");
  }

  const { toBlob, toPng } = await loadHtmlToImage();

  const pixelRatio = options.pixelRatio ?? EXPORT_PIXEL_RATIO;
  const providedBackground = options.backgroundColor ?? EXPORT_BACKGROUND_COLOR;

  forceInlineImageLoad(node);
  await ensureImagesDecoded(node);

  let backgroundColor: string | undefined = providedBackground;
  if (!backgroundColor || backgroundColor === "transparent") {
    backgroundColor = undefined;
  }

  if (!backgroundColor) {
    const computed = window.getComputedStyle(node);
    const computedBackground = computed.backgroundColor;
    backgroundColor = isTransparent(computedBackground)
      ? undefined
      : computedBackground;
  }

  const baseOptions = {
    pixelRatio,
    backgroundColor,
    filter,
    style: {
      borderRadius: "0px",
      overflow: "visible",
    },
  };

  let blob = await toBlob(node, baseOptions);

  if (!blob || blob.size === 0) {
    const dataUrl = await toPng(node, baseOptions);
    const response = await fetch(dataUrl);
    blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error("exportSessionImage: empty blob generated");
    }
  }

  const type = blob.type && blob.type.length > 0 ? blob.type : "image/png";
  const file = fileFromBlob(blob, EXPORT_FILENAME, type);

  return { blob, file };
}

export async function pngBlobToJpegBlob(
  pngBlob: Blob,
  backgroundColor?: string | null,
  quality: number = EXPORT_SHARE_JPEG_QUALITY,
): Promise<Blob> {
  if (!pngBlob || pngBlob.size === 0) {
    throw new Error("pngBlobToJpegBlob: source blob is empty");
  }

  const fillColor = !backgroundColor || isTransparent(backgroundColor)
    ? "#ffffff"
    : backgroundColor;

  const objectUrl = URL.createObjectURL(pngBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("pngBlobToJpegBlob: failed to load image"));
      img.src = objectUrl;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      throw new Error("pngBlobToJpegBlob: unable to determine image dimensions");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("pngBlobToJpegBlob: failed to acquire 2d context");
    }

    context.fillStyle = fillColor;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("pngBlobToJpegBlob: canvas.toBlob returned null"));
          }
        },
        "image/jpeg",
        quality,
      );
    });

    if (!jpegBlob || jpegBlob.size === 0) {
      throw new Error("pngBlobToJpegBlob: produced blob is empty");
    }

    return jpegBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function fileFromBlob(blob: Blob, filename: string, typeOverride?: string): File {
  const type = typeOverride || blob.type || "application/octet-stream";
  return new File([blob], filename, { type, lastModified: Date.now() });
}

type ShareFilenameOptions = {
  taskName?: string;
  durationMinutes?: number;
  timestamp?: Date;
};

const sanitizeTaskNameForFilename = (taskName?: string) => {
    const trimmed = taskName?.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");

    const sanitized = normalized
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");

    return sanitized.length > 0 ? sanitized : null;
  };

const formatDurationSegment = (durationMinutes?: number) => {
    if (!Number.isFinite(durationMinutes) || !durationMinutes) {
      return null;
    }

    const roundedMinutes = Math.max(1, Math.round(durationMinutes));
    return `${roundedMinutes}min`;
  };

const formatDateSegment = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

export function generateShareFilename(
  extension: "png" | "jpg" | "jpeg",
  options: ShareFilenameOptions = {},
): string {
  const { taskName, durationMinutes, timestamp } = options;

  const taskSegment = sanitizeTaskNameForFilename(taskName) ?? "session";
  const durationSegment = formatDurationSegment(durationMinutes);
  const dateSegment = formatDateSegment(timestamp ?? new Date());

  const segments = [taskSegment];
  if (durationSegment) {
    segments.push(durationSegment);
  }
  segments.push(dateSegment);

  return `${segments.join("-")}.${extension}`;
}

export async function blobToTypedFile(
  blob: Blob,
  filename: string,
): Promise<File> {
  const buffer = await blob.arrayBuffer();
  const typedBuffer = new Uint8Array(buffer);
  return new File([typedBuffer], filename, {
    type: blob.type || "application/octet-stream",
    lastModified: Date.now(),
  });
}

type StorageManagerWithOpfs = StorageManager & {
  getDirectory?: () => Promise<FileSystemDirectoryHandle>;
};

type PersistedOpfsFile = {
  file: File;
  cleanup: () => Promise<void>;
};

const SHARE_CACHE_DIRECTORY = "share-cache";

export async function persistBlobToOpfs(
  blob: Blob,
  filename: string,
): Promise<PersistedOpfsFile | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = navigator.storage as StorageManagerWithOpfs | undefined;
  if (!storage?.getDirectory) {
    return null;
  }

  try {
    const rootHandle = await storage.getDirectory();
    const cacheHandle = await rootHandle.getDirectoryHandle(SHARE_CACHE_DIRECTORY, {
      create: true,
    });

    const uniqueDirectoryName =
      (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
      Date.now().toString(36);

    const folderHandle = await cacheHandle.getDirectoryHandle(uniqueDirectoryName, {
      create: true,
    });

    const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    const file = await fileHandle.getFile();

    const cleanup = async () => {
      try {
        await folderHandle.removeEntry(filename);
      } catch (cleanupError) {
        console.warn("persistBlobToOpfs: cleanup failed", cleanupError);
      }

      try {
        await cacheHandle.removeEntry(uniqueDirectoryName, { recursive: true });
      } catch (cleanupError) {
        console.warn("persistBlobToOpfs: folder cleanup failed", cleanupError);
      }
    };

    return { file, cleanup };
  } catch (error) {
    console.warn("persistBlobToOpfs: failed to persist blob", error);
    return null;
  }
}

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
  const file = new File([blob], EXPORT_FILENAME, { type });

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

export function generateShareFilename(extension: "png" | "jpg"): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `timer-mirror-session-${stamp}.${extension}`;
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

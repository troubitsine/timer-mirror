// src/lib/exportSessionImage.ts - Generate filtered session exports using html-to-image.

import {
  EXPORT_BACKGROUND_COLOR,
  EXPORT_FILENAME,
  EXPORT_PIXEL_RATIO,
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

  await ensureImagesDecoded(node);

  let backgroundColor: string | undefined = providedBackground;
  if (!providedBackground) {
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
  };

  let blob = await toBlob(node, baseOptions);

  if (!blob) {
    const dataUrl = await toPng(node, baseOptions);
    const response = await fetch(dataUrl);
    blob = await response.blob();
  }

  const type = blob.type && blob.type.length > 0 ? blob.type : "image/png";
  const file = new File([blob], EXPORT_FILENAME, { type });

  return { blob, file };
}

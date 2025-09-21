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

export async function exportSessionImage(
  node: HTMLElement | null,
  options: ExportSessionImageOptions = {},
): Promise<ExportSessionImageResult> {
  if (!node) {
    throw new Error("exportSessionImage: target node is missing");
  }

  const { toBlob, toPng } = await loadHtmlToImage();

  const pixelRatio = options.pixelRatio ?? EXPORT_PIXEL_RATIO;
  const backgroundColor = options.backgroundColor ?? EXPORT_BACKGROUND_COLOR;

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

  const file = new File([blob], EXPORT_FILENAME, { type: "image/png" });

  return { blob, file };
}

// blobGradients.ts
// Shared accent-color blob gradients for SessionCompleteGlow + TaskBadgeBlobs.

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string): RgbColor | null => {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHsl = ({ r, g, b }: RgbColor) => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta) % 6;
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
};

const hslToRgb = (h: number, s: number, l: number): RgbColor => {
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - chroma / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = chroma;
    g1 = x;
  } else if (h < 120) {
    r1 = x;
    g1 = chroma;
  } else if (h < 180) {
    g1 = chroma;
    b1 = x;
  } else if (h < 240) {
    g1 = x;
    b1 = chroma;
  } else if (h < 300) {
    r1 = x;
    b1 = chroma;
  } else {
    r1 = chroma;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
};

const shiftAccentColor = (
  hex: string,
  {
    hueShift = 0,
    saturationShift = 0,
    lightnessShift = 0,
  }: {
    hueShift?: number;
    saturationShift?: number;
    lightnessShift?: number;
  },
) => {
  const base = hexToRgb(hex) ?? { r: 255, g: 255, b: 255 };
  const { h, s, l } = rgbToHsl(base);
  const nextHue = (h + hueShift + 360) % 360;
  const nextSaturation = clamp(s + saturationShift, 0, 100);
  const nextLightness = clamp(l + lightnessShift, 0, 100);
  return hslToRgb(nextHue, nextSaturation, nextLightness);
};

const rgba = ({ r, g, b }: RgbColor, alpha: number) =>
  `rgba(${r}, ${g}, ${b}, ${alpha})`;

export const buildBlobGradients = (accentColor: string) => {
  // Subtle hue and lightness tweaks keep blobs related but not identical.
  const primary = shiftAccentColor(accentColor, {
    saturationShift: -6,
    lightnessShift: 12,
  });
  const secondary = shiftAccentColor(accentColor, {
    hueShift: 12,
    saturationShift: -10,
    lightnessShift: 16,
  });
  const tertiary = shiftAccentColor(accentColor, {
    hueShift: -14,
    saturationShift: -8,
    lightnessShift: 8,
  });

  return {
    primary: `radial-gradient(circle at center, ${rgba(primary, 0.55)} 0%, ${rgba(primary, 0)} 65%)`,
    secondary: `radial-gradient(circle at center, ${rgba(secondary, 0.45)} 0%, ${rgba(secondary, 0)} 70%)`,
    tertiary: `radial-gradient(circle at center, ${rgba(tertiary, 0.42)} 0%, ${rgba(tertiary, 0)} 68%)`,
  };
};

export type BlobGradients = ReturnType<typeof buildBlobGradients>;

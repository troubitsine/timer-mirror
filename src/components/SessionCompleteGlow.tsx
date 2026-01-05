// SessionCompleteGlow.tsx
// Ambient glow layer for SessionCompletePage; adds animated blobs tied to the montage accent color.
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isMobileDevice } from "@/lib/deviceDetection";

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

const buildBlobGradients = (accentColor: string) => {
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

const SessionCompleteGlow = ({ accentColor }: { accentColor: string }) => {
  const [isSafari, setIsSafari] = useState(false);
  const pointerBlobRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const isMobile = isMobileDevice();
  const gradients = useMemo(
    () => buildBlobGradients(accentColor),
    [accentColor],
  );

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (event: MouseEvent) => {
      const offsetX = event.clientX - window.innerWidth / 2;
      const offsetY = event.clientY - window.innerHeight / 2;
      pointerState.current.tx = offsetX * 0.08;
      pointerState.current.ty = offsetY * 0.08;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    let frameId = 0;

    const tick = () => {
      const state = pointerState.current;
      state.x += (state.tx - state.x) / 20;
      state.y += (state.ty - state.y) / 20;
      if (pointerBlobRef.current) {
        pointerBlobRef.current.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isMobile]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-[1] pointer-events-none overflow-hidden"
    >
      <svg className="absolute h-0 w-0">
        <defs>
          <filter id="session-complete-blob-blur">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div
        className={cn(
          "absolute inset-0",
          isSafari
            ? "blur-3xl"
            : "[filter:url(#session-complete-blob-blur)_blur(32px)]",
        )}
      >
        <div
          className={cn(
            "absolute left-[-12%] bottom-[-38%] w-[72vw] h-[72vw] max-w-[760px] max-h-[760px] min-w-[320px] min-h-[320px] rounded-full mix-blend-screen opacity-80 animate-session-blob-float-1",
          )}
          style={{ background: gradients.primary }}
        />
        <div
          className={cn(
            "absolute right-[-8%] bottom-[-34%] w-[58vw] h-[58vw] max-w-[640px] max-h-[640px] min-w-[260px] min-h-[260px] rounded-full mix-blend-screen opacity-70 animate-session-blob-float-2",
          )}
          style={{ background: gradients.secondary }}
        />
        <div
          className={cn(
            "absolute left-[18%] bottom-[-42%] w-[52vw] h-[52vw] max-w-[600px] max-h-[600px] min-w-[240px] min-h-[240px] rounded-full mix-blend-screen opacity-65 animate-session-blob-float-3",
          )}
        >
          <div
            ref={pointerBlobRef}
            className="h-full w-full rounded-full will-change-transform"
            style={{ background: gradients.tertiary }}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionCompleteGlow;

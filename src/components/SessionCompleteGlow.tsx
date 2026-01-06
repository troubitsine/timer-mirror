// SessionCompleteGlow.tsx
// Ambient glow layer for SessionCompletePage; adds animated blobs tied to the montage accent color.
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isMobileDevice } from "@/lib/deviceDetection";
import { buildBlobGradients } from "@/lib/blobGradients";

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
      pointerState.current.ty = offsetY * 0.03;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    let frameId = 0;

    const tick = () => {
      const state = pointerState.current;
      state.x += (state.tx - state.x) / 10;
      state.y += (state.ty - state.y) / 10;
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
            "absolute left-[-2%] bottom-[-27%] sm:bottom-[-65%] w-[84vw] h-[72vw] max-w-[760px] max-h-[760px] min-w-[320px] min-h-[320px] rounded-full mix-blend-screen opacity-85 animate-session-blob-float-1",
          )}
          style={{ background: gradients.primary }}
        />
        <div
          className={cn(
            "absolute right-[1%] bottom-[-22%] sm:bottom-[-53%] w-[58vw] h-[58vw] max-w-[640px] max-h-[640px] min-w-[260px] min-h-[260px] rounded-full mix-blend-screen opacity-75 animate-session-blob-float-2",
          )}
          style={{ background: gradients.secondary }}
        />
        <div
          className={cn(
            "absolute left-[33%] bottom-[-25%] sm:bottom-[-43%] w-[58vw] h-[52vw] max-w-[600px] max-h-[600px] min-w-[240px] min-h-[240px] rounded-full mix-blend-screen opacity-80 animate-session-blob-float-3",
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

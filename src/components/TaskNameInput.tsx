import React, { memo, useEffect, useRef, useState } from "react";
import { getTextWidth, getFontString } from "@/lib/textWidth";

interface TaskNameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  isRunning?: boolean;
}

const TaskNameInput = ({
  value,
  onChange,
  placeholder = "Write down what you want to work on",
  readOnly = false,
  autoFocus = false,
  className = "",
  isRunning = false,
}: TaskNameInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const marqueeTextRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (!inputRef.current || !containerRef.current || !contentRef.current) {
      return;
    }

    // Get the parent container width
    const parentWidth = containerRef.current.parentElement?.clientWidth || 0;

    if (isRunning) {
      const containerStyles = window.getComputedStyle(containerRef.current);
      const contentStyles = window.getComputedStyle(contentRef.current);
      const maxWidthValue = Number.parseFloat(containerStyles.maxWidth);
      const resolvedMaxWidth =
        Number.isFinite(maxWidthValue) && maxWidthValue > 0
          ? maxWidthValue
          : parentWidth || 512;
      const maxAllowedWidth =
        parentWidth > 0 ? Math.min(parentWidth, resolvedMaxWidth) : resolvedMaxWidth;

      const paddingLeft = Number.parseFloat(contentStyles.paddingLeft);
      const paddingRight = Number.parseFloat(contentStyles.paddingRight);
      const paddingWidth =
        Number.isFinite(paddingLeft + paddingRight) && paddingLeft + paddingRight > 0
          ? paddingLeft + paddingRight
          : 48;

      const font = getFontString(inputRef.current);
      const currentTextWidth = getTextWidth(value || placeholder, font);
      const minWidth = 200;
      // Use max width as the constraint so overflow detection matches the visual container.
      const containerWidth = Math.min(
        Math.max(currentTextWidth + paddingWidth, minWidth),
        maxAllowedWidth || currentTextWidth + paddingWidth,
      );
      setWidth(containerWidth);

      const availableWidth = Math.max(containerWidth - paddingWidth, 0);
      const needsScroll = currentTextWidth > availableWidth + 1;
      setShouldScroll(needsScroll);
    } else {
      // Use 100% of parent width instead of a fixed max width
      setWidth(0); // Setting to 0 will make it use 100% width from CSS
      setShouldScroll(false);
    }
  }, [value, placeholder, isRunning]);

  useEffect(() => {
    if (!shouldScroll || !marqueeTrackRef.current || !marqueeTextRef.current) {
      return;
    }

    const updateMarquee = () => {
      const textWidth = marqueeTextRef.current?.getBoundingClientRect().width;
      if (!textWidth) {
        return;
      }

      const gap = 32;
      const distance = textWidth + gap;
      const duration = distance * 0.05;

      marqueeTrackRef.current?.style.setProperty(
        "--task-marquee-distance",
        `${distance}px`,
      );
      marqueeTrackRef.current?.style.setProperty(
        "--task-marquee-duration",
        `${duration}s`,
      );
    };

    const rafId = window.requestAnimationFrame(updateMarquee);
    window.addEventListener("resize", updateMarquee);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateMarquee);
    };
  }, [shouldScroll, value]);

  return (
    <div
      ref={containerRef}
      style={{ width: width > 0 ? width : "100%" }}
      className={`
        relative 
        group 
        ${!readOnly ? "hover:bg-neutral-900/5" : ""}
        rounded-xl
        focus-within:ring-2 focus-within:ring-white/50
        overflow-hidden
        min-h-[32px] sm:min-h-[52px]
        w-full max-w-lg mx-auto
      `}
    >
      {/* Background with inner stroke */}
      <div
        className="
          absolute inset-0 
          bg-gradient-to-b from-neutral-700/50 to-neutral-900/50 
          backdrop-blur-md 
          rounded-xl
          before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]
        "
      />

      {/* Content container */}
      <div
        ref={contentRef}
        className="relative h-full flex items-center px-3 py-2 sm:px-6 sm:py-3"
      >
        {shouldScroll ? (
          <div className="overflow-hidden w-full">
            <div
              ref={marqueeTrackRef}
              className="inline-flex whitespace-nowrap text-white/90 text-base sm:text-lg text-center gap-8 [animation:task-name-marquee_var(--task-marquee-duration,12s)_linear_infinite] [will-change:transform] [backface-visibility:hidden]"
            >
              <span ref={marqueeTextRef}>{value}</span>
              <span aria-hidden="true">{value}</span>
            </div>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            autoFocus={autoFocus}
            onChange={(e) => onChange(e.target.value)}
            className={`
              w-full 
              text-white/90 
              placeholder:text-white/55 
              text-base sm:text-lg 
              text-center 
              bg-transparent 
              focus:outline-none 
              transition-colors 
              ${className}
            `}
          />
        )}
      </div>
    </div>
  );
};

export default memo(TaskNameInput);

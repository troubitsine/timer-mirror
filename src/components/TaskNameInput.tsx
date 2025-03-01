import React, { useEffect, useRef, useState } from "react";
import { getTextWidth, getFontString } from "@/lib/textWidth";
import { motion } from "framer-motion";

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
  const [width, setWidth] = useState<number>(0);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (inputRef.current && containerRef.current) {
      // Get the parent container width
      const parentWidth = containerRef.current.parentElement?.clientWidth || 0;

      if (isRunning) {
        const font = getFontString(inputRef.current);
        const currentTextWidth = getTextWidth(value || placeholder, font);
        const paddingWidth = 48;
        const minWidth = 200;
        // Use parent width as the constraint instead of a fixed 512px
        const containerWidth = Math.min(
          Math.max(currentTextWidth + paddingWidth, minWidth),
          parentWidth > 0 ? parentWidth : 512,
        );
        setWidth(containerWidth);

        if (currentTextWidth > containerWidth - paddingWidth) {
          setShouldScroll(true);
          setTextWidth(currentTextWidth);
        } else {
          setShouldScroll(false);
        }
      } else {
        // Use 100% of parent width instead of a fixed max width
        setWidth(0); // Setting to 0 will make it use 100% width from CSS
        setShouldScroll(false);
      }
    }
  }, [value, placeholder, isRunning]);

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
      <div className="relative h-full flex items-center px-3 py-2 sm:px-6 sm:py-3">
        {shouldScroll ? (
          <div className="overflow-hidden">
            <div className="flex">
              <motion.div
                initial={{ x: 0 }}
                animate={{
                  x: -(textWidth + 32),
                }}
                transition={{
                  duration: textWidth * 0.05,
                  ease: "linear",
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 2,
                }}
                className="flex whitespace-nowrap text-white/90 text-lg text-center"
              >
                <span>{value}</span>
                <span className="ml-8">{value}</span>
              </motion.div>
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

export default TaskNameInput;

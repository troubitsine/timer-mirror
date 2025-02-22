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
      if (isRunning) {
        const font = getFontString(inputRef.current);
        const currentTextWidth = getTextWidth(value || placeholder, font);
        const paddingWidth = 48;
        const minWidth = 200;
        const maxWidth = 512;
        const containerWidth = Math.min(
          Math.max(currentTextWidth + paddingWidth, minWidth),
          maxWidth,
        );
        setWidth(containerWidth);

        if (currentTextWidth > containerWidth - paddingWidth) {
          setShouldScroll(true);
          setTextWidth(currentTextWidth);
        } else {
          setShouldScroll(false);
        }
      } else {
        setWidth(512);
        setShouldScroll(false);
      }
    }
  }, [value, placeholder, isRunning]);

  return (
    <div
      ref={containerRef}
      style={{ width: width > 0 ? width : "auto" }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/50 to-neutral-900/50 rounded-xl backdrop-blur-md [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.1)]" />
      <div className="relative px-6 py-3 rounded-xl">
        {shouldScroll ? (
          <div className="overflow-hidden">
            <div className="flex">
              <motion.div
                initial={{ x: 0 }}
                animate={{
                  x: -(textWidth + 32),
                }}
                transition={{
                  duration: textWidth * 0.025,
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
            className={`w-full text-white/90 placeholder:text-white/55 text-lg text-center shadow-sm bg-transparent hover:bg-neutral-900/5 focus:bg-neutral-900/5 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-white focus:ring-inset transition-colors ${className}`}
          />
        )}
      </div>
    </div>
  );
};

export default TaskNameInput;

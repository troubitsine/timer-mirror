import React, { useEffect, useRef, useState } from "react";
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
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (inputRef.current) {
      if (isRunning) {
        const font = getFontString(inputRef.current);
        const textWidth = getTextWidth(value || placeholder, font);
        const paddingWidth = 48; // 24px padding on each side
        const minWidth = 200;
        const maxWidth = 512;

        setWidth(
          Math.min(Math.max(textWidth + paddingWidth, minWidth), maxWidth),
        );
      } else {
        setWidth(512);
      }
    }
  }, [value, placeholder]);

  return (
    <div style={{ width: width > 0 ? width : "auto" }} className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/50 to-neutral-900/50 rounded-xl backdrop-blur-md [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.1)]" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={`relative w-full text-white/90 placeholder:text-white/55 px-6 py-3 rounded-xl text-lg text-center shadow-sm bg-transparent hover:bg-neutral-900/5 focus:bg-neutral-900/5 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-white focus:ring-inset transition-colors ${className}`}
      />
    </div>
  );
};

export default TaskNameInput;

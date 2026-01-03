import React, { useRef, useEffect, useCallback } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
  type SpringOptions,
} from "framer-motion";

type TiltProps = {
  children: React.ReactNode;
  className?: string;
  style?: MotionStyle;
  rotationFactor?: number;
  isRevese?: boolean;
  springOptions?: SpringOptions;
};

export default function Tilt({
  children,
  className,
  style,
  rotationFactor = 19,
  isRevese = false,
  springOptions,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, springOptions);
  const ySpring = useSpring(y, springOptions);

  const rotateX = useTransform(
    ySpring,
    [-0.8, 0.8],
    isRevese
      ? [rotationFactor, -rotationFactor]
      : [-rotationFactor, rotationFactor],
  );
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    isRevese
      ? [-rotationFactor, rotationFactor]
      : [rotationFactor, -rotationFactor],
  );

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Calculate mouse position relative to the center of the element
      const centerX = rect.left + width / 2;
      const centerY = rect.top + height / 2;

      // Calculate the distance from mouse to center
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      // Calculate normalized position (-0.5 to 0.5)
      // Use a divisor to control sensitivity - larger values make the effect more subtle
      const sensitivity = Math.max(window.innerWidth, window.innerHeight) / 2;
      const xPos = distanceX / sensitivity;
      const yPos = distanceY / sensitivity;

      x.set(xPos);
      y.set(yPos);
    },
    [ref, x, y],
  );

  const resetPosition = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  useEffect(() => {
    // Add global mouse move listener
    window.addEventListener("mousemove", handleMouseMove);

    // Reset position when component unmounts
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      resetPosition();
    };
  }, [handleMouseMove, resetPosition]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        ...style,
        transform,
      }}
    >
      {children}
    </motion.div>
  );
}

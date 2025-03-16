import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { isMobileDevice } from "@/lib/deviceDetection";
import { motion } from "framer-motion";
import { CheckIcon } from "@radix-ui/react-icons";

interface OnboardingCardProps {
  className?: string;
  initialCollapsed?: boolean;
  hasCameraPermission?: boolean;
}

const OnboardingCard = ({
  className = "",
  initialCollapsed,
  hasCameraPermission = false,
}: OnboardingCardProps) => {
  // Initialize with initialCollapsed if provided, otherwise check localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (initialCollapsed !== undefined) return initialCollapsed;
    const savedState = localStorage.getItem("onboardingCollapsed");
    return savedState === "true";
  });
  const isMobile = isMobileDevice();

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("onboardingCollapsed", String(newState));
  };

  // Don't render on mobile
  if (isMobile) return null;

  return (
    <div
      className={`w-full lg:w-[65vw] min-w-[300px] max-w-[1800px] mx-auto mb-4 ${className}`}
    >
      <motion.div
        className={`px-4 py-4 bg-neutral-600/55
               before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-xl before:pointer-events-none
               backdrop-blur-md rounded-xl`}
        animate={{ height: isCollapsed ? "auto" : "auto" }}
        transition={{ duration: 0.3, bounce: 0 }}
      >
        <div className="flex flex-col items-center relative">
          <div className="absolute right-0 top-1">
            <motion.div
              layout
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleCollapsed}
                  className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm px-[11px]  py-[6px]"
                >
                  {isCollapsed ? "About" : "Hide"}
                </Button>
              </motion.div>
            </motion.div>
          </div>
          <h1 className="text-2xl font-semibold text-white/90 mb-1">
            Focus Reel
          </h1>
        </div>

        <motion.div
          className="overflow-hidden"
          animate={{
            height: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
          }}
          initial={{
            height: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
          }}
          transition={{ duration: 0.3, bounce: 5 }}
        >
          <div>
            <p className="text-white/80 text-xs mb-5 text-balance mx-auto text-center max-w-[90%]">
              Focus Reel is a productivity timer designed to help you
              concentrate. Studies show that seeing your own reflection
              increases self-awareness and accountability, helping you stay
              focused and minimize distractions as you work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OnboardingStep
                number={1}
                description="Allow camera permissions to to see your reflection as you work"
                imageSrc="/onboarding/step-1-illustration.png"
                completed={hasCameraPermission}
              />
              <OnboardingStep
                number={2}
                description="Start your timer and allow screen sharing so Focus Reel can capture moments from your session"
                imageSrc="/onboarding/step-2-illustration.png"
              />
              <OnboardingStep
                number={3}
                description="Celebrate your progress with a personalized montage highlighting your productive moments"
                imageSrc="/onboarding/step-3-illustration.png"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

interface OnboardingStepProps {
  number: number;
  description: string;
  imageSrc: string;
  completed?: boolean;
}

const OnboardingStep = ({
  number,
  description,
  imageSrc,
  completed = false,
}: OnboardingStepProps) => {
  // Only apply opacity to the first step when completed
  const isFirstStepCompleted = number === 1 && completed;

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-2">
        {" "}
        {/* Container for circle and badge */}
        <div
          className={`w-7 h-7 bg-white/70 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm flex items-center justify-center relative ${isFirstStepCompleted ? "opacity-70" : ""}`}
        >
          <span className="text-black/75 text-xs font-semibold">{number}</span>
        </div>
        {completed && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white-30 before:to-black/20 before:rounded-full backdrop-blur-md bg-green-500/90 rounded-full flex items-center justify-center">
            <CheckIcon className="text-white w-2.5 h-2.5" />
          </div>
        )}
      </div>
      <div className="bg-neutral-800/50 rounded-xl border border-white/10 mb-2 w-full max-w-[164px] flex h-28 justify-center items-center">
        <img
          src={imageSrc}
          alt={`Step ${number}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="text-center text-white/80 text-xs text-balance">
        {description}
      </div>
    </div>
  );
};

export default OnboardingCard;

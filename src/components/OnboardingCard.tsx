import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { isMobileDevice } from "@/lib/deviceDetection";

interface OnboardingCardProps {
  className?: string;
}

const OnboardingCard = ({ className = "" }: OnboardingCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = isMobileDevice();

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("onboardingCollapsed");
    if (savedState) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

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
      className={`w-full lg:w-[65vw] min-w-[300px] max-w-[1800px] mx-auto mb-6 ${className}`}
    >
      <div
        className={`px-4 py-3 sm:py-4 bg-neutral-500/60
               before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-xl before:pointer-events-none
               backdrop-blur-md rounded-xl transition-all duration-300 ${isCollapsed ? "h-14.5" : ""}`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-white/90">
            Focus Reel
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleCollapsed}
            className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm px-[11px]  py-[6px]"
          >
            {isCollapsed ? "About" : "Hide"}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="mt-2">
            <p className="text-white/80 text-sm mb-4">
              Focus Reel is a timer designed to help you concentrate. Studies
              show that being in front of a mirror make people X% more
              accountable.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OnboardingStep
                number={1}
                title="Allow camera permissions"
                description="to work in front of a mirror"
                imageSrc="/onboarding/step-1-illustration.png"
              />
              <OnboardingStep
                number={2}
                title="Start your timer"
                description="and allow screen sharing"
                imageSrc="/onboarding/step-2-illustration.png"
              />
              <OnboardingStep
                number={3}
                title="Get a montage"
                description="of your working session when you're done"
                imageSrc="/onboarding/step-3-illustration.png"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface OnboardingStepProps {
  number: number;
  title: string;
  description: string;
  imageSrc: string;
}

const OnboardingStep = ({
  number,
  title,
  description,
  imageSrc,
}: OnboardingStepProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-7 h-7 bg-white/70 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm flex items-center justify-center mb-2 ">
        <span className="text-black/75 text-xs font-semibold">{number}</span>
      </div>
      <div className="bg-neutral-800/50 rounded-xl border border-white/10 mb-2 w-full max-w-[164px] flex h-28 py-[4] py-[4] p-2 justify-center items-center">
        <img
          src={imageSrc}
          alt={`Step ${number}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="text-center text-white/80 text-xs">
        <span className="font-medium">{title}</span>
        <br />
        {description}
      </div>
    </div>
  );
};

export default OnboardingCard;

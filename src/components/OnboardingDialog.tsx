import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const [step, setStep] = useState(1);

  const stepContent = [
    {
      title: "Welcome to Focus Reel",
      description:
        "Focus Reel helps you stay concentrated by showing your reflection as you work. Let's get you started!",
      image: "/images/tempo-image-20250605T012025359Z.png",
    },
    {
      title: "Camera Permission Required",
      description:
        "We need access to your camera to show your reflection during focus sessions. This helps increase accountability and concentration.",
      image: "/images/tempo-image-20250605T012058421Z.png",
    },
    {
      title: "Capture Your Progress",
      description:
        "Focus Reel automatically captures moments from your work sessions to create a visual summary of your productivity.",
      image: "/images/tempo-image-20250605T012116251Z.png",
    },
  ];

  const totalSteps = stepContent.length;

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep(1);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 border-none overflow-hidden max-w-[560px] w-full mx-4 bg-transparent">
        <motion.div
          className="p-2 bg-neutral-700/70
           before:absolute before:inset-0 before:bg-gradient-to-br before:from-neutral-400/40 before:to-transparent before:rounded-xl before:pointer-events-none
           backdrop-blur-md rounded-xl relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close button */}
          <div className="absolute right-3 top-3 z-10">
            <DialogClose asChild>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm p-2"
              >
                <Cross2Icon className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>

          {/* Image container */}
          <div className="w-full mx-auto aspect-video bg-neutral-800/50 rounded-xl border border-white/10 mb-4">
            <img
              src={stepContent[step - 1].image}
              alt={`Step ${step} illustration`}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Content */}
          <div className="space-y-4 px-2 pb-2">
            <DialogHeader className="text-center">
              <DialogTitle className="text-lg font-semibold text-white/85">
                {stepContent[step - 1].title}
              </DialogTitle>
              <DialogDescription className="text-white/75 text-sm text-balance">
                {stepContent[step - 1].description}
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicators and navigation */}
            <div className="flex flex-row justify-between gap-4">
              {/* Progress dots */}
              <div className="flex justify-center space-x-1.5">
                {[...Array(totalSteps)].map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all duration-200",
                      index + 1 === step
                        ? "bg-white/90 scale-125"
                        : "bg-white/30",
                    )}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <DialogFooter className="flex-row justify-between gap-2">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-white/70 hover:text-white/90 hover:bg-white/10"
                  >
                    Skip
                  </Button>
                </DialogClose>
                {step < totalSteps ? (
                  <Button
                    className="group bg-white/75 hover:bg-white/85 text-black/75 hover:text-black/85 backdrop-blur-md rounded-full inner-stroke-white-20-sm"
                    type="button"
                    onClick={handleContinue}
                  >
                    Next
                    <ArrowRight
                      className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </Button>
                ) : (
                  <DialogClose asChild>
                    <Button
                      type="button"
                      className="bg-white/75 hover:bg-white/85 text-black/75 hover:text-black/85 backdrop-blur-md rounded-full inner-stroke-white-20-sm"
                    >
                      Get Started
                    </Button>
                  </DialogClose>
                )}
              </DialogFooter>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;

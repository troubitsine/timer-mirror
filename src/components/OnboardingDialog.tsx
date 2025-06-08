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
        "Focus Reel is a productivity timer designed to help you concentrate. Studies show that seeing your own reflection increases self-awareness and accountability, helping you stay focused and minimize distractions as you work.",
      image: "/images/tempo-image-20250608T191642707Z.png",
    },
    {
      title: "Privacy First",
      description:
        "Focus Reel never stores your data. Your recordings are automatically deleted as soon as you close the browser window.",
      image: "/images/tempo-image-20250608T191505524Z.png",
    },
    {
      title: "How it works",
      description: (
        <ol className="list-decimal list-outside space-y-1 pl-5 sm:pl-4">
          <li>Allow camera permissions to see your reflection as you work.</li>
          <li>
            Start your timer and allow screen sharing so Focus Reel can capture
            moments from your session.
          </li>
          <li>
            Celebrate your progress with a personalized montage highlighting
            your productive moments.
          </li>
        </ol>
      ),
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
      <DialogContent className="fixed left-3 right-3 top-[24vh] translate-x-0 translate-y-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 p-0 border-none overflow-hidden w-auto max-w-full sm:max-w-[500px] sm:w-full mx-0 sm:mx-4 bg- transparent rounded-[18px] pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <motion.div
          className="p-1.5 bg-neutral-700/70
           before:absolute before:inset-0 before:bg-gradient-to-br before:from-neutral-400/40 before:to-transparent sm:before:rounded-[18px] before:pointer-events-none
           backdrop-blur-md rounded-t-[18px] relative flex flex-col"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Close button */}
          <div className="absolute right-[11px] top-[11px] z-10">
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

          {/* Image container with conservative height */}
          <div className="w-full mx-auto h-[210px] sm:h-[220px] bg-gradient-to-b from-neutral-700/60 via-neutral-700-70 to-neutral-800/80 rounded-[15px] inner-stroke-white-20-sm mb-2 sm:mb-3 flex-shrink-0">
            <img
              src={stepContent[step - 1].image}
              alt={`Step ${step} illustration`}
              className="w-full h-full object-contain sm:object-cover rounded-lg"
            />
          </div>

          {/* Content with flex layout to push navigation to bottom */}
          <div className="flex flex-col justify-between pl-2 pr-1.5 pb-1.5 flex-1">
            <DialogHeader className="flex flex-col mb-0 text-left">
              <DialogTitle className="text-lg font-semibold text-white/85 z-10 flex-shrink-0 text-left">
                {stepContent[step - 1].title}
              </DialogTitle>
              <div className="h-[160px] sm:h-[130px] overflow-y-auto">
                <DialogDescription className="text-white/75 text-sm text-pretty z-10 text-left">
                  {stepContent[step - 1].description}
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Progress indicators and navigation - always at bottom */}
            <div className="flex flex-row justify-between items-center gap-2 mt-2 flex-shrink-0">
              {/* Progress dots */}
              <div className="flex justify-center space-x-1.5 z-10">
                {[...Array(totalSteps)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setStep(index + 1)}
                    aria-label={`Go to step ${index + 1}`}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all duration-200 cursor-pointer hover:scale-110 focus:outline-none focus:ring-1 focus:ring-white/20 focus:ring-offset-1 focus:ring-offset-transparent",
                      index + 1 === step
                        ? "bg-white/90 scale-110"
                        : "bg-white/30 hover:bg-white/50",
                    )}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <DialogFooter className="flex-row justify-between gap-1 sm:gap-0 z-10">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-[13px] text-white/70 background-blur-md rounded-full hover:bg-white/20 hover:text-white/80 hover:inner-stroke-white-10-sm px-4 py-2"
                  >
                    Skip
                  </Button>
                </DialogClose>
                {step < totalSteps ? (
                  <Button
                    className="group bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-0 rounded-full inner-stroke-white-20-sm  py-1 pr-[14px] pl-[12px] py-[2px] text-[13px]"
                    type="button"
                    onClick={handleContinue}
                  >
                    Next
                    <ArrowRight
                      className="-me-1 ms-0.5 opacity-60 transition-transform duration-200 ease group-hover:translate-x-0.5"
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </Button>
                ) : (
                  <DialogClose asChild>
                    <Button
                      type="button"
                      className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center rounded-full inner-stroke-white-20-sm px-[12px] py-[2px] text-[13px]"
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

import { useLocation, useNavigate } from "react-router-dom";
import SessionMontage from "./SessionMontage";
import SessionGridView from "./SessionGridView";
import { useState, useEffect, useRef } from "react";
import { track } from "@vercel/analytics";
import { Button } from "./ui/button";
import AnimatedTabs from "./ui/animated-tabs";
import ShareSessionButton from "./ShareSessionButton";

const SessionCompletePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state;
  const [showGridView, setShowGridView] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  // Use sessionStorage to persist the selected background ID across page refreshes
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(() => {
    const savedId = sessionStorage.getItem("selectedBackgroundId");
    return savedId || "white";
  });

  useEffect(() => {
    if (!sessionData) {
      navigate("/");
      return;
    }

    // Scroll to top on mount
    window.scrollTo(0, 0);

    console.log(
      "[SessionCompletePage] screenshots length:",
      sessionData.screenshots?.length ?? 0,
      "webcamPhotos length:",
      sessionData.webcamPhotos?.length ?? 0,
    );

    track("session_complete", {
      duration: sessionData.duration,
      taskName: sessionData.taskName,
    });
  }, [sessionData, navigate]);

  if (!sessionData) return null;

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 bg-stone-50" />
      <div className="relative z-10 w-full min-h-screen p-2 sm:p-8 flex sm:items-start pt-4 pb-12 sm:pb-32">
        <div className="w-[calc(100%-20px)] lg:w-[65vw] min-w-[300px] max-w-[1800px] max-h-[1200px] mx-auto flex flex-col gap-4 sm:gap-6">
          <div className="w-full h-[70vh] sm:aspect-video relative">
            {/* Share button positioned at the top-right */}
            <div className="absolute top-4 right-4 z-30">
              <ShareSessionButton
                taskName={sessionData.taskName}
                duration={sessionData.duration}
                screenshots={sessionData.screenshots}
                webcamPhotos={sessionData.webcamPhotos}
                exportRef={exportRef}
                selectedBackgroundId={selectedBackgroundId}
                onBackgroundChange={setSelectedBackgroundId}
              />
            </div>

            {/* Animated tabs for view selection */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-30">
              <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[3px] inner-stroke-white-20-sm shadow-sm min-w-[120px] min-h-[32px]">
                <AnimatedTabs
                  defaultValue={showGridView ? "grid" : "animation"}
                  onValueChange={(value) => setShowGridView(value === "grid")}
                  className="rounded-full bg-gradient-to-b from-white/20 via-neutral-400/30 to-neutral-500/30 backdrop-blur-sm shadow-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)]"
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.3,
                  }}
                >
                  <button
                    data-id="animation"
                    type="button"
                    className="px-3 pt-[1px] pb-[4px] text-black/75 transition-colors duration-300 flex items-center gap-1.5 rounded-full min-h-[28px]"
                  >
                    <span className="text-xs font-medium">Animation</span>
                  </button>
                  <button
                    data-id="grid"
                    type="button"
                    className="px-3 pt-[1px] pb-[4px] text-black/75 transition-colors duration-300 flex items-center gap-1.5 rounded-full min-h-[28px]"
                  >
                    <span className="text-xs font-medium">Card</span>
                  </button>
                </AnimatedTabs>
              </div>
            </div>

            {/* Conditionally render either the montage or grid view */}
            {showGridView ? (
              <SessionGridView
                screenshots={sessionData.screenshots}
                webcamPhotos={sessionData.webcamPhotos}
                taskName={sessionData.taskName}
                duration={sessionData.duration}
                initialSelectedBackgroundId={selectedBackgroundId}
                onBackgroundSelect={setSelectedBackgroundId}
                exportRef={exportRef}
              />
            ) : (
              <SessionMontage
                screenshots={sessionData.screenshots}
                webcamPhotos={sessionData.webcamPhotos}
                taskName={sessionData.taskName}
                duration={sessionData.duration}
                initialSelectedBackgroundId={selectedBackgroundId}
                onBackgroundSelect={setSelectedBackgroundId}
                exportRef={exportRef}
              />
            )}
          </div>

          <div className="w-full flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="rounded-xl relative text-center sm:text-left space-y-1 max-w-md">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900/90">
                Session Complete
              </h1>
              <p className="text-sm sm:text-md text-balance text-neutral-800/80">
                Well done! Here are some moments from your session to remind you
                of all the great work you did.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="default"
                onClick={() => navigate("/")}
                className="w-fit bg-neutral-900/75 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:rounded-full text-white/85 backdrop-blur-md flex items-center justify-center gap-2 rounded-full inner-stroke-white-20-sm hover:bg-neutral-800/75"
              >
                Start New Timer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCompletePage;

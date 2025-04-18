import { useLocation, useNavigate } from "react-router-dom";
import SessionMontage from "./SessionMontage";
import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { Button } from "./ui/button";

const SessionCompletePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state;

  useEffect(() => {
    if (!sessionData) {
      navigate("/");
      return;
    }

    // Scroll to top on mount
    window.scrollTo(0, 0);

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
        <div className="w-[calc(100%-20px)] lg:w-[65vw] min-w-[300px] max-w-[1800px] mx-auto flex flex-col gap-4 sm:gap-6">
          <div className="w-full h-[60vh] sm:aspect-video">
            <SessionMontage
              screenshots={sessionData.screenshots}
              webcamPhotos={sessionData.webcamPhotos}
              taskName={sessionData.taskName}
              duration={sessionData.duration}
            />
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
  );
};

export default SessionCompletePage;

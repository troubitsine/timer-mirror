import { useLocation, useNavigate } from "react-router-dom";
import SessionMontage from "./SessionMontage";
import { useEffect } from "react";
import { track } from "@vercel/analytics";

const SessionCompletePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state;

  useEffect(() => {
    if (!sessionData) {
      navigate("/");
      return;
    }

    track("session_complete", {
      duration: sessionData.duration,
      taskName: sessionData.taskName,
    });
  }, [sessionData, navigate]);

  if (!sessionData) return null;

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 bg-stone-50" />
      <div className="relative z-10 w-full min-h-screen p-8 flex items-center pb-32">
        <div className="max-w-7xl w-full mx-auto space-y-8">
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-black/80">
              Session Complete
            </h1>
            <p className="text-black/60">
              Great work! Here's your session summary
            </p>
          </header>

          <SessionMontage
            screenshots={sessionData.screenshots}
            webcamPhotos={sessionData.webcamPhotos}
            taskName={sessionData.taskName}
            duration={sessionData.duration}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionCompletePage;

import React, { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Camera, CameraOff, Maximize2 } from "lucide-react";

interface CameraFeedProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  width?: number;
  height?: number;
  isRunning?: boolean;
  remainingTime?: number;
}

const CameraFeed = React.forwardRef<HTMLVideoElement, CameraFeedProps>(
  (
    {
      onPermissionGranted = () => {},
      onPermissionDenied = () => {},
      width = 800,
      height = 400,
      isRunning = false,
      remainingTime = 0,
    },
    ref,
  ) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const videoRef =
      (ref as React.RefObject<HTMLVideoElement>) || localVideoRef;
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showPermissionDialog, setShowPermissionDialog] = useState(true);
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          onPermissionGranted();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
        onPermissionDenied();
      }
    };

    const enterPiP = async () => {
      if (!("documentPictureInPicture" in window)) {
        console.error("Picture-in-Picture API not supported");
        return;
      }

      try {
        // Close existing PiP window if it exists
        if (pipWindow) {
          pipWindow.close();
        }

        // @ts-ignore - TypeScript doesn't know about Document Picture-in-Picture API yet
        const newPipWindow =
          await window.documentPictureInPicture.requestWindow({
            width: 400,
            height: 300,
          });

        setPipWindow(newPipWindow);

        // Create styles for the PiP window
        const style = document.createElement("style");
        style.textContent = `
          body { 
            margin: 0;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: system-ui;
          }
          .pip-container {
            width: 100%;
            height: 100%;
            position: relative;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            overflow: hidden;
          }
          .pip-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .pip-timer {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
          }
          .pip-timer-text {
            font-size: 2rem;
            font-weight: bold;
            color: white;
          }
        `;
        newPipWindow.document.head.appendChild(style);

        const container = document.createElement("div");
        container.className = "pip-container";

        const video = document.createElement("video");
        video.className = "pip-video";
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        if (videoRef.current?.srcObject) {
          video.srcObject = videoRef.current.srcObject;
        }
        container.appendChild(video);

        // Timer container
        const timerDiv = document.createElement("div");
        timerDiv.className = "pip-timer";
        const timerText = document.createElement("span");
        timerText.className = "pip-timer-text";
        timerDiv.appendChild(timerText);
        container.appendChild(timerDiv);

        newPipWindow.document.body.appendChild(container);

        // Handle window closing
        const handleUnload = () => {
          setPipWindow(null);
        };

        newPipWindow.addEventListener("unload", handleUnload);
        newPipWindow.addEventListener("beforeunload", handleUnload);

        // Handle page visibility changes
        const handleVisibilityChange = () => {
          if (document.hidden && newPipWindow) {
            video.srcObject = videoRef.current?.srcObject || null;
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Cleanup when component unmounts
        return () => {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          );
          if (newPipWindow) {
            newPipWindow.removeEventListener("unload", handleUnload);
            newPipWindow.removeEventListener("beforeunload", handleUnload);
            newPipWindow.close();
          }
        };
      } catch (err) {
        console.error("Error opening Picture-in-Picture window:", err);
        setPipWindow(null);
      }
    };

    // Effect to update the PiP window timer
    useEffect(() => {
      if (pipWindow) {
        const timerText = pipWindow.document.querySelector(".pip-timer-text");
        const timerDiv = pipWindow.document.querySelector(".pip-timer");
        if (timerText && timerDiv) {
          if (!isRunning) {
            (timerDiv as HTMLElement).style.display = "none";
          } else {
            (timerDiv as HTMLElement).style.display = "flex";
            const minutes = Math.floor(remainingTime / 60);
            const seconds = Math.floor(remainingTime % 60);
            timerText.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
          }
        }
      }
    }, [remainingTime, isRunning, pipWindow]);

    useEffect(() => {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasPermission(false);
        return;
      }

      // Request camera permissions
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => {
          setHasPermission(true);
          startCamera();
        })
        .catch(() => {
          setHasPermission(false);
        });

      // Cleanup function
      return () => {
        if (videoRef.current?.srcObject) {
          const tracks = (
            videoRef.current.srcObject as MediaStream
          ).getTracks();
          tracks.forEach((track) => track.stop());
        }
        if (pipWindow) {
          pipWindow.close();
        }
      };
    }, []);

    return (
      <Card className="w-full h-full bg-background p-4 relative overflow-hidden">
        {hasPermission ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ width, height }}
            />
            {isRunning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/80 backdrop-blur-sm rounded-full w-32 h-32 flex items-center justify-center">
                  <span className="text-4xl font-bold">
                    {Math.floor(remainingTime / 60)}:
                    {String(Math.floor(remainingTime % 60)).padStart(2, "0")}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="bg-background/80 backdrop-blur-sm"
                onClick={enterPiP}
                title="Open in floating window"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="bg-background/80 backdrop-blur-sm"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full space-y-4 bg-muted rounded-lg">
            <CameraOff className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Camera access is required</p>
            <Button onClick={startCamera}>Enable Camera</Button>
          </div>
        )}

        <AlertDialog open={!hasPermission && showPermissionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Camera Permission Required</AlertDialogTitle>
              <AlertDialogDescription>
                This app needs access to your camera to create your work session
                montage. Please enable camera access to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowPermissionDialog(false)}>
                Understood
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  },
);

export default CameraFeed;

import React, { useState } from "react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Grid, Play, Download, Image, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface SessionMontageProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  onSave?: () => void;
  taskName?: string;
  duration?: number;
}

interface AnimatedStackProps {
  photos: string[];
  taskName?: string;
  duration?: number;
}

const AnimatedStack = ({
  photos,
  taskName = "Focus Session",
  duration = 25,
}: AnimatedStackProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCollage, setShowCollage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStackExiting, setIsStackExiting] = useState(false);

  const startAnimation = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentIndex < photos.length) {
      timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    } else if (currentIndex >= photos.length) {
      timer = setTimeout(() => {
        setIsStackExiting(true);
        setTimeout(() => {
          setShowCollage(true);
        }, 500);
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, photos.length]);

  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      {!showCollage ? (
        <motion.div
          className="relative w-[250px] h-[180px]"
          animate={isStackExiting ? { scale: 0.8, y: 100, opacity: 0 } : {}}
          transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
        >
          {photos.slice(0, currentIndex).map((photo, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              style={{ rotate: `${Math.random() * 6 - 3}deg` }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-full h-full bg-white rounded-[14px] p-1 shadow-[rgba(21,_22,_31,_0.06)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.063)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.098)_0px_11px_24.2px_-1.75px]">
                <img
                  src={photo}
                  alt={`Stack photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-[12px] ring-[0.5px] ring-black/10"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            mass: 0.8,
            bounce: 0.25,
          }}
          key="collage"
        >
          <div className="bg-white rounded-[14px] overflow-hidden shadow-[rgba(21,_22,_31,_0.06)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.063)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.098)_0px_11px_24.2px_-1.75px]">
            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(photos.length))}, 1fr)`,
              }}
            >
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={photo}
                    alt={`Collage photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/75 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium">
                  {taskName} • {duration}{" "}
                  {duration === 1 ? "minute" : "minutes"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {!showCollage && (
        <Button
          variant="default"
          size="lg"
          className="absolute bottom-8"
          onClick={startAnimation}
          disabled={isPlaying}
        >
          <Play className="h-4 w-4 mr-2" />
          Play Animation
        </Button>
      )}
    </div>
  );
};

const SessionMontage = ({
  screenshots = [
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d72",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d73",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d74",
  ],
  webcamPhotos = [
    "https://images.unsplash.com/photo-1611224923853-80b023f02d75",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d76",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d77",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d78",
  ],
  onSave = () => {},
  taskName = "Focus Session",
  duration = 25,
}: SessionMontageProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "slideshow" | "animation">(
    "grid",
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const allPhotos = [...screenshots, ...webcamPhotos];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allPhotos.length);
  };

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  return (
    <Card className="w-full min-h-[400px] h-screen bg-background p-6">
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Session Montage</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("slideshow")}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("animation")}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button variant="default" onClick={onSave}>
              <Download className="h-4 w-4 mr-2" />
              Save Montage
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1">
          <TabsList>
            <TabsTrigger value="all">All Captures</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
            <TabsTrigger value="webcam">Webcam Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 overflow-y-auto p-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allPhotos.map((photo, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative aspect-video p-3"
                  >
                    <img
                      src={photo}
                      alt={`Capture ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg shadow-[rgba(21,_22,_31,_0.06)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.063)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.098)_0px_11px_24.2px_-1.75px]"
                    />
                  </motion.div>
                ))}
              </div>
            ) : viewMode === "slideshow" ? (
              <div className="relative h-full flex items-center justify-center p-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10"
                  onClick={previousSlide}
                >
                  <Image className="h-4 w-4 rotate-180" />
                </Button>
                <motion.img
                  key={currentSlide}
                  src={allPhotos[currentSlide]}
                  alt={`Slide ${currentSlide + 1}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="max-h-[250px] rounded-lg shadow-[rgba(21,_22,_31,_0.06)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.063)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.098)_0px_11px_24.2px_-1.75px]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10"
                  onClick={nextSlide}
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <AnimatedStack
                photos={allPhotos}
                taskName={taskName}
                duration={duration}
              />
            )}
          </TabsContent>

          <TabsContent
            value="screenshots"
            className="h-full overflow-y-auto p-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {screenshots.map((screenshot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative aspect-video p-3"
                >
                  <img
                    src={screenshot}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg shadow-[rgba(21,_22,_31,_0.06)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.063)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.098)_0px_11px_24.2px_-1.75px]"
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="webcam" className="h-full overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {webcamPhotos.map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative aspect-video p-3"
                >
                  <img
                    src={photo}
                    alt={`Webcam photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg shadow-[rgba(21,_22,_31,_0.06)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.063)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.098)_0px_11px_24.2px_-1.75px]"
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default SessionMontage;

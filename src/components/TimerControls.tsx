import React, { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Play, Pause, RefreshCw } from "lucide-react";

interface TimerControlsProps {
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onTaskNameChange?: (name: string) => void;
  onDurationChange?: (duration: number) => void;
  isRunning?: boolean;
}

const TimerControls = ({
  onStart = () => {},
  onPause = () => {},
  onReset = () => {},
  onTaskNameChange = () => {},
  onDurationChange = () => {},
  isRunning = false,
}: TimerControlsProps) => {
  const [taskName, setTaskName] = useState("My Focus Session");
  const [duration, setDuration] = useState(25); // Default 25 minutes

  const handleTaskNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
    onTaskNameChange(e.target.value);
  };

  const handleDurationChange = (value: number[]) => {
    setDuration(value[0]);
    onDurationChange(value[0]);
  };

  return (
    <Card className="w-full p-6 bg-white shadow-lg">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="task-name">Task Name</Label>
          <Input
            id="task-name"
            placeholder="What are you working on?"
            value={taskName}
            onChange={handleTaskNameChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <div className="pt-4">
            <Slider
              value={[duration]}
              onValueChange={handleDurationChange}
              max={120}
              min={0.33}
              step={1}
              className="w-full"
            />
          </div>
          <div className="text-center text-sm text-gray-600">
            {duration < 1
              ? `${Math.round(duration * 60)} seconds`
              : `${duration} minutes`}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <Button onClick={onStart} className="w-32" variant="default">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={onPause} className="w-32" variant="secondary">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={onReset} variant="outline" className="w-32">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TimerControls;

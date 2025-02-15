import React from "react";

const StrokeExamples = () => {
  return (
    <div className="grid grid-cols-2 gap-4 p-8">
      {/* Black strokes on light background */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Black Strokes</h2>

        {/* 0.5px variations */}
        <div className="inner-stroke-black-5-xs bg-white p-4 rounded">
          0.5px - 5% opacity
        </div>
        <div className="inner-stroke-black-10-xs bg-white p-4 rounded">
          0.5px - 10% opacity
        </div>
        <div className="inner-stroke-black-20-xs bg-white p-4 rounded">
          0.5px - 20% opacity
        </div>

        {/* 1px variations */}
        <div className="inner-stroke-black-5-sm bg-white p-4 rounded">
          1px - 5% opacity
        </div>
        <div className="inner-stroke-black-10-sm bg-white p-4 rounded">
          1px - 10% opacity
        </div>
        <div className="inner-stroke-black-20-sm bg-white p-4 rounded">
          1px - 20% opacity
        </div>

        {/* 2px variations */}
        <div className="inner-stroke-black-5-lg bg-white p-4 rounded">
          2px - 5% opacity
        </div>
        <div className="inner-stroke-black-10-lg bg-white p-4 rounded">
          2px - 10% opacity
        </div>
        <div className="inner-stroke-black-20-lg bg-white p-4 rounded">
          2px - 20% opacity
        </div>
      </div>

      {/* White strokes on dark background */}
      <div className="space-y-4 bg-gray-900 p-4 rounded">
        <h2 className="text-lg font-bold text-white">White Strokes</h2>

        {/* 0.5px variations */}
        <div className="inner-stroke-white-5-xs bg-gray-800 p-4 rounded text-white">
          0.5px - 5% opacity
        </div>
        <div className="inner-stroke-white-10-xs bg-gray-800 p-4 rounded text-white">
          0.5px - 10% opacity
        </div>
        <div className="inner-stroke-white-20-xs bg-gray-800 p-4 rounded text-white">
          0.5px - 20% opacity
        </div>

        {/* 1px variations */}
        <div className="inner-stroke-white-5-sm bg-gray-800 p-4 rounded text-white">
          1px - 5% opacity
        </div>
        <div className="inner-stroke-white-10-sm bg-gray-800 p-4 rounded text-white">
          1px - 10% opacity
        </div>
        <div className="inner-stroke-white-20-sm bg-gray-800 p-4 rounded text-white">
          1px - 20% opacity
        </div>

        {/* 2px variations */}
        <div className="inner-stroke-white-5-lg bg-gray-800 p-4 rounded text-white">
          2px - 5% opacity
        </div>
        <div className="inner-stroke-white-10-lg bg-gray-800 p-4 rounded text-white">
          2px - 10% opacity
        </div>
        <div className="inner-stroke-white-20-lg bg-gray-800 p-4 rounded text-white">
          2px - 20% opacity
        </div>
      </div>
    </div>
  );
};

export default StrokeExamples;

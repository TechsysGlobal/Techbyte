import React, { useRef, useEffect, useCallback } from 'react';

const DualRangeSlider = ({ min, max, value, onChange }) => {
  const minVal = value.min;
  const maxVal = value.max;
  const minValRef = useRef(minVal);
  const maxValRef = useRef(maxVal);
  const range = useRef(null);

  // Convert to percentage
  const getPercent = useCallback(
    (val) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  // Update refs when props change (for layout calculations only)
  useEffect(() => {
    minValRef.current = minVal;
    maxValRef.current = maxVal;
  }, [minVal, maxVal]);

  return (
    <div className="relative w-full h-8 flex items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={minVal}
        onChange={(event) => {
          const newVal = Math.min(Number(event.target.value), maxVal - 1);
          onChange({ ...value, min: newVal });
        }}
        className="thumb thumb--left"
        style={{ zIndex: minVal > max - 100 && "5" }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={maxVal}
        onChange={(event) => {
          const newVal = Math.max(Number(event.target.value), minVal + 1);
          onChange({ ...value, max: newVal });
        }}
        className="thumb thumb--right"
      />

      <div className="slider">
        <div className="slider__track" />
        <div ref={range} className="slider__range bg-primary" />
      </div>

      <style>{`
        .thumb {
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
        }
        .thumb--left {
          z-index: 3;
        }
        .thumb--right {
          z-index: 4;
        }
        /* Webkit */
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          background-color: white;
          border: 2px solid #36b084;
          border-radius: 50%;
          cursor: pointer;
          height: 18px;
          width: 18px;
          margin-top: 4px;
          pointer-events: all;
          position: relative;
        }
        /* Firefox */
        .thumb::-moz-range-thumb {
          background-color: white;
          border: 2px solid #36b084;
          border-radius: 50%;
          cursor: pointer;
          height: 18px;
          width: 18px;
          margin-top: 4px;
          pointer-events: all;
          position: relative;
        }
        
        .slider {
          position: relative;
          width: calc(100% - 18px);
          margin-left: 9px;
        }
        .slider__track,
        .slider__range {
          position: absolute;
          border-radius: 3px;
          height: 4px;
        }
        .slider__track {
          background-color: #dee2e6;
          width: 100%;
          z-index: 1;
        }
        .slider__range {
          z-index: 2;
        }
      `}</style>
    </div>
  );
};

export default DualRangeSlider;

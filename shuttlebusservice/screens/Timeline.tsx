
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SHUTTLE_STOPS } from '../constants';

interface TimelineProps {
  t0: number; 
  isLate?: boolean; 
  isAbsent?: boolean;
  hideCongestion?: boolean;
  studentCounts?: Record<number, number>; 
  absentEventStopId?: number | null; 
  onStopClick?: (stopName: string) => void;
  isDriverMode?: boolean; 
}

const CONGESTION_COLORS = ['#34C759', '#FF9500', '#FF3B30'];

const Timeline: React.FC<TimelineProps> = ({ 
  t0, 
  isLate = false, 
  isAbsent = false, 
  hideCongestion = false,
  studentCounts = {},
  absentEventStopId = null,
  onStopClick,
  isDriverMode = false
}) => {
  const [busY, setBusY] = useState(0);
  const [minsRemaining, setMinsRemaining] = useState(0);
  const [busColor, setBusColor] = useState('#FF3B30');
  const [isCongestionExpanded, setIsCongestionExpanded] = useState(false);
  const requestRef = useRef<any>(null);

  const congestionData = useMemo(() => {
    return Array.from({ length: 12 }, () => CONGESTION_COLORS[Math.floor(Math.random() * 3)]);
  }, []);

  const animate = () => {
    if (isDriverMode) return; 

    const now = Date.now();
    const elapsedMs = now - t0;
    
    const baseNodes = SHUTTLE_STOPS.map(s => s.timeOffset * 1000);
    const boardingTimeMs = baseNodes[1];
    const waitDurationMs = 20000; 
    
    let currentY = 0;
    let computedBusColor = '#FF3B30';

    if (isLate) {
      if (elapsedMs < boardingTimeMs) {
        const alpha = elapsedMs / boardingTimeMs;
        currentY = alpha * 25; 
        computedBusColor = '#FF3B30';
      } else if (elapsedMs >= boardingTimeMs && elapsedMs < boardingTimeMs + waitDurationMs) {
        currentY = 25; 
        computedBusColor = '#FF3B30';
      } else {
        const shiftedElapsed = elapsedMs - waitDurationMs;
        const totalDuration = baseNodes[baseNodes.length - 1];
        const clampedShifted = Math.min(Math.max(shiftedElapsed, boardingTimeMs), totalDuration);
        
        for (let i = 1; i < baseNodes.length - 1; i++) {
          if (clampedShifted >= baseNodes[i] && clampedShifted <= baseNodes[i+1]) {
            const segmentDuration = baseNodes[i+1] - baseNodes[i];
            const segmentAlpha = (clampedShifted - baseNodes[i]) / segmentDuration;
            currentY = (i * 25) + (segmentAlpha * 25);
            break;
          }
        }
        if (clampedShifted >= totalDuration) currentY = 93;
        computedBusColor = isAbsent ? '#FF3B30' : '#007AFF';
      }
    } else {
      const totalDuration = baseNodes[baseNodes.length - 1];
      const clampedElapsed = Math.min(Math.max(elapsedMs, 0), totalDuration);
      for (let i = 0; i < baseNodes.length - 1; i++) {
        if (clampedElapsed >= baseNodes[i] && clampedElapsed <= baseNodes[i+1]) {
          const segmentDuration = baseNodes[i+1] - baseNodes[i];
          const segmentAlpha = (clampedElapsed - baseNodes[i]) / segmentDuration;
          currentY = (i * 25) + (segmentAlpha * 25);
          break;
        }
      }
      if (clampedElapsed >= totalDuration) currentY = 93;
      computedBusColor = (elapsedMs >= boardingTimeMs && !isAbsent) ? '#007AFF' : '#FF3B30';
    }

    setBusY(currentY);
    setBusColor(computedBusColor);

    const finalArrivalMs = isLate ? (baseNodes[4] + waitDurationMs) : baseNodes[4];
    const remainingSeconds = Math.max((finalArrivalMs - elapsedMs) / 1000, 0);
    setMinsRemaining(Math.ceil(remainingSeconds / 30));

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!isDriverMode) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [t0, isLate, isAbsent, isDriverMode]);

  if (isDriverMode) {
    return (
      <div className="w-full py-2">
        <div className="flex items-start justify-between relative">
          <div className="absolute top-[5px] left-[10%] right-[10%] h-[1px] bg-[#D1D1D6] z-0"></div>
          
          {SHUTTLE_STOPS.map((stop) => {
            const isAbsentEvent = absentEventStopId === stop.id;
            const studentCount = studentCounts[stop.id] || 0;
            const isZero = studentCount === 0;
            const isDestination = stop.isDestination; 

            return (
              <div key={stop.id} className="flex flex-col items-center flex-1 min-w-0 z-10 transition-all">
                {/* 목적지는 클릭 상호작용 비활성화 (cursor-default) */}
                <button 
                  onClick={() => !isDestination && onStopClick?.(stop.name)}
                  className={`w-2.5 h-2.5 rounded-full border bg-white mb-2 transition-transform 
                    ${isDestination ? 'border-gray-400 cursor-default' : isZero ? 'border-gray-300 active:scale-95' : 'border-[#007AFF] active:scale-125'}
                    ${!isDestination ? 'shadow-sm active:opacity-70' : ''}`}
                ></button>
                <div className="text-center px-1">
                  <p className={`text-[10px] font-bold truncate w-full transition-all 
                    ${isDestination ? 'text-gray-500' : isZero ? 'text-gray-300 line-through' : 'text-black'}`}>
                    {stop.name}
                  </p>
                  
                  {/* 목적지는 인원 표시 제외 */}
                  {!isDestination && (
                    <p className={`text-[9px] font-medium mt-0.5 ${isZero ? 'text-gray-300' : 'text-[#007AFF]'}`}>
                      {studentCount}명
                    </p>
                  )}
                  
                  {isAbsentEvent && (
                    <p className="text-[8px] text-red-600 font-black animate-pulse mt-0.5 leading-none">미탑승</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      {!hideCongestion && (
        <div className="absolute top-0 right-0 z-50 flex flex-col items-end">
          <button 
            onClick={() => setIsCongestionExpanded(!isCongestionExpanded)}
            className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-sm active:scale-95 transition-all"
          >
            <span className="text-[10px] font-black text-[#007AFF]">혼잡도</span>
            <span className={`text-[8px] text-[#007AFF] transition-transform duration-200 ${isCongestionExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {isCongestionExpanded && (
            <div className="mt-1 flex flex-col gap-1.5 p-2 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200 shadow-xl animate-slide-down">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#34C759]"></div><span className="text-[9px] text-gray-700 font-black">여유</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF9500]"></div><span className="text-[9px] text-gray-700 font-black">보통</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div><span className="text-[9px] text-gray-700 font-black">혼잡</span></div>
            </div>
          )}
        </div>
      )}

      <div className={`grid grid-cols-[32px_1fr] gap-x-3 w-full min-h-[420px] flex-1 py-4 select-none`}>
        <div className="relative flex flex-col items-center">
          <div className="absolute top-0 bottom-0 w-[1px] flex flex-col bg-[#D1D1D6]">
            {!hideCongestion && (
               <div className="absolute inset-0 w-full flex flex-col">
                 {congestionData.map((color, i) => (
                    <div key={i} className="flex-1 w-full" style={{ backgroundColor: color }}></div>
                 ))}
               </div>
            )}
          </div>
          <div className="absolute inset-0 flex flex-col justify-between py-1.5 z-10 pointer-events-none">
            {SHUTTLE_STOPS.map((stop) => (
              <div key={stop.id} className="w-full flex justify-center relative">
                <div className={`w-2 h-2 rounded-full border bg-white z-10 ${!hideCongestion && stop.isBoarding ? 'border-[#34C759]' : !hideCongestion && stop.isDestination ? 'border-[#0A7A2F]' : 'border-[#C6C6C8]'}`}></div>
              </div>
            ))}
            {!hideCongestion && (
              <div className="absolute left-0 right-0 flex flex-col items-center z-20" style={{ top: `${busY}%`, transform: 'translateY(-12px)', transition: 'none' }}>
                <div className="font-black text-2xl leading-none drop-shadow-sm transition-colors duration-200" style={{ color: busColor }}>▼</div>
                <div className="bg-white text-black text-[10px] font-black px-3 py-1.5 mt-1 whitespace-nowrap rounded-lg shadow-md border border-gray-200 max-w-[100px] text-center">
                  {minsRemaining > 0 ? `${minsRemaining}분 후 도착` : '도착 완료'}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between py-1 overflow-visible">
          {SHUTTLE_STOPS.map((stop) => (
            <button key={stop.id} onClick={() => onStopClick?.(stop.name)} className="flex flex-col justify-center h-4 min-w-0 overflow-visible text-left transition-all active:opacity-50">
              <div className={`text-[12px] font-bold leading-tight whitespace-normal break-all text-gray-600 ${!hideCongestion && stop.isBoarding ? 'text-[#34C759]' : !hideCongestion && stop.isDestination ? 'text-[#0A7A2F] font-black' : ''}`}>
                {stop.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;


import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SHUTTLE_STOPS } from '../constants';

interface TimelineProps {
  t0: number; // 시작 타임스탬프 (ms)
  isLate?: boolean; // 지각 신청 여부
  isAbsent?: boolean; // 당일 미탑승 여부
}

const CONGESTION_COLORS = ['#34C759', '#FF9500', '#FF3B30'];

const Timeline: React.FC<TimelineProps> = ({ t0, isLate = false, isAbsent = false }) => {
  const [busY, setBusY] = useState(0);
  const [minsRemaining, setMinsRemaining] = useState(0);
  const [busColor, setBusColor] = useState('#FF3B30');
  const [isCongestionExpanded, setIsCongestionExpanded] = useState(false); // [수정] 혼잡도 접힘/펼침 상태
  const requestRef = useRef<number>(null);

  const congestionData = useMemo(() => {
    return Array.from({ length: 12 }, () => CONGESTION_COLORS[Math.floor(Math.random() * 3)]);
  }, []);

  const animate = () => {
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
        if (clampedShifted >= totalDuration) currentY = 100;
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
      if (clampedElapsed >= totalDuration) currentY = 100;
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
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [t0, isLate, isAbsent]);

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* 
          [수정] 실시간 혼잡도 안내 오버레이 (접힘/펼침 구조) 
          노선 시각화 UI 내의 우측 상단 영역에 레이어로 배치하여 노선 가동성을 확보했습니다.
      */}
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
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#34C759]"></div>
              <span className="text-[9px] text-gray-700 font-black">여유</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF9500]"></div>
              <span className="text-[9px] text-gray-700 font-black">보통</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div>
              <span className="text-[9px] text-gray-700 font-black">혼잡</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[32px_1fr] gap-x-3 w-full min-h-[420px] flex-1 py-4 select-none">
        <div className="relative flex flex-col items-center">
          {/* 혼잡도 데이터에 따른 배경 라인 (기존 로직 유지) */}
          <div className="absolute top-0 bottom-0 w-1 flex flex-col">
            {congestionData.map((color, i) => (
              <div key={i} className="flex-1 w-full" style={{ backgroundColor: color }}></div>
            ))}
          </div>
          
          <div className="absolute inset-0 flex flex-col justify-between py-1.5 z-10 pointer-events-none">
            {SHUTTLE_STOPS.map((stop) => (
              <div key={stop.id} className="w-full flex justify-center relative">
                <div className={`w-3 h-3 rounded-full border-2 bg-white z-10
                  ${stop.isBoarding ? 'border-[#34C759]' : stop.isDestination ? 'border-[#0A7A2F]' : 'border-[#C6C6C8]'}`}
                ></div>
              </div>
            ))}

            {/* 실시간 버스 아이콘 (삼각형) */}
            <div 
              className="absolute left-0 right-0 flex flex-col items-center z-20"
              style={{ 
                top: `${busY}%`, 
                transform: 'translateY(-12px)',
                transition: 'none'
              }}
            >
              <div className="font-black text-2xl leading-none drop-shadow-sm transition-colors duration-200" style={{ color: busColor }}>▼</div>
              <div className="bg-black/80 text-white text-[10px] font-black px-2 py-1 mt-1 whitespace-nowrap rounded-md shadow-lg border border-white/20">
                {minsRemaining > 0 ? `${minsRemaining}분 후 도착` : '도착 완료'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between py-1 overflow-visible">
          {SHUTTLE_STOPS.map((stop) => (
            <div key={stop.id} className="flex flex-col justify-center h-4 min-w-0 overflow-visible">
              <div className={`text-[12px] font-bold leading-tight whitespace-normal break-all
                ${stop.isBoarding ? 'text-[#34C759]' : stop.isDestination ? 'text-[#0A7A2F] font-black' : 'text-gray-400'}`}
              >
                {stop.name}
              </div>
              {stop.isBoarding && <div className="text-[9px] text-[#34C759] font-medium mt-0.5">(탑승지)</div>}
              {stop.isDestination && <div className="text-[9px] text-[#0A7A2F] font-black mt-0.5">(목적지)</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;

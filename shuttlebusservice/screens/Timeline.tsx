
import React, { useEffect, useState, useRef } from 'react';
import { SHUTTLE_STOPS } from '../constants';

interface TimelineProps {
  t0: number; // 시작 타임스탬프 (ms)
  delaySec: number; // 누적 지연 시간 (초)
}

const Timeline: React.FC<TimelineProps> = ({ t0, delaySec }) => {
  const [busY, setBusY] = useState(0);
  const [minsRemaining, setMinsRemaining] = useState(0);
  const requestRef = useRef<number>(null);

  const animate = () => {
    const now = Date.now();
    const elapsedMs = now - t0;
    const delayMs = delaySec * 1000;

    // 2-4. ms 단위 타임라인 노드 정의
    const timeNodesMs = SHUTTLE_STOPS.map((stop, i) => 
      (stop.timeOffset * 1000) + (i > 0 ? delayMs : 0)
    );

    const yNodes = [0, 25, 50, 75, 100];
    const totalDurationMs = timeNodesMs[timeNodesMs.length - 1];

    // 2-2. 하차 시간 클램프 로직 (totalDurationMs를 넘지 않도록 강제)
    const clampedElapsedMs = Math.min(Math.max(elapsedMs, 0), totalDurationMs);

    let currentY = 0;

    /**
     * 2-3. 구간별 경계 처리 (<=)
     * eMs === tDropoffMs 일 때 정확히 100%가 되도록 보장
     */
    if (clampedElapsedMs >= totalDurationMs) {
      currentY = 100;
    } else if (clampedElapsedMs <= timeNodesMs[1]) {
      const alpha = (clampedElapsedMs - timeNodesMs[0]) / (timeNodesMs[1] - timeNodesMs[0]);
      currentY = yNodes[0] + Math.max(0, Math.min(alpha, 1)) * (yNodes[1] - yNodes[0]);
    } else if (clampedElapsedMs <= timeNodesMs[2]) {
      const alpha = (clampedElapsedMs - timeNodesMs[1]) / (timeNodesMs[2] - timeNodesMs[1]);
      currentY = yNodes[1] + Math.max(0, Math.min(alpha, 1)) * (yNodes[2] - yNodes[1]);
    } else if (clampedElapsedMs <= timeNodesMs[3]) {
      const alpha = (clampedElapsedMs - timeNodesMs[2]) / (timeNodesMs[3] - timeNodesMs[2]);
      currentY = yNodes[2] + Math.max(0, Math.min(alpha, 1)) * (yNodes[3] - yNodes[2]);
    } else if (clampedElapsedMs <= timeNodesMs[4]) {
      const alpha = (clampedElapsedMs - timeNodesMs[3]) / (timeNodesMs[4] - timeNodesMs[3]);
      currentY = yNodes[3] + Math.max(0, Math.min(alpha, 1)) * (yNodes[4] - yNodes[3]);
    }

    setBusY(currentY);

    const remainingSeconds = Math.max((totalDurationMs - clampedElapsedMs) / 1000, 0);
    setMinsRemaining(Math.ceil(remainingSeconds / 30));

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [t0, delaySec]);

  return (
    <div className="grid grid-cols-[32px_1fr] gap-x-3 w-full min-h-[450px] h-full py-8 select-none">
      
      {/* 1열: Marker Column */}
      <div className="relative flex flex-col items-center">
        {/* 경로선 - 전체 영역 차지 */}
        <div className="absolute top-0 bottom-0 w-1 bg-[#E5E5EA] rounded-full"></div>
        
        {/* 
          마커 노드와 버스 아이콘의 좌표계를 일치시키기 위해 
          동일한 absolute inset-0 컨테이너 내부에서 작업 
        */}
        <div className="absolute inset-0 flex flex-col justify-between py-1.5 z-10 pointer-events-none">
          {SHUTTLE_STOPS.map((stop) => (
            <div key={stop.id} className="w-full flex justify-center relative">
              <div className={`w-3 h-3 rounded-full border-2 bg-white 
                ${stop.isBoarding ? 'border-[#34C759]' : stop.isDestination ? 'border-[#0A7A2F]' : 'border-[#C6C6C8]'}`}
              ></div>
            </div>
          ))}

          {/* 버스 아이콘 (▼) - 마커와 동일한 inset-0 내에서 absolute로 이동 */}
          <div 
            className="absolute left-0 right-0 flex flex-col items-center z-20"
            style={{ 
              top: `${busY}%`, 
              transform: 'translateY(-12px)', // 삼각형 꼭짓점이 노드 중심에 오도록 보정
              transition: 'none'
            }}
          >
            <div className="text-[#007AFF] font-black text-2xl leading-none drop-shadow-sm">▼</div>
            <div className="bg-[#007AFF] text-white text-[9px] font-bold px-1.5 py-0.5 mt-0.5 whitespace-nowrap rounded-md shadow-sm">
              {minsRemaining}분
            </div>
          </div>
        </div>
      </div>

      {/* 2열: Label Column */}
      <div className="flex flex-col justify-between py-1 overflow-visible">
        {SHUTTLE_STOPS.map((stop) => (
          <div key={stop.id} className="flex flex-col justify-center h-4 min-w-0 overflow-visible">
            <div className={`text-[12px] font-bold leading-tight whitespace-normal break-all
              ${stop.isBoarding ? 'text-[#34C759]' : stop.isDestination ? 'text-[#0A7A2F] font-black' : 'text-gray-400'}`}
            >
              {stop.name}
            </div>
            
            {stop.isBoarding && (
               <div className="text-[9px] text-[#34C759] font-medium mt-0.5 whitespace-nowrap leading-none">
                 (탑승지)
               </div>
            )}
            
            {stop.isDestination && (
               <div className="text-[9px] text-[#0A7A2F] font-black mt-0.5 whitespace-nowrap leading-none">
                 (목적지)
               </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Timeline;

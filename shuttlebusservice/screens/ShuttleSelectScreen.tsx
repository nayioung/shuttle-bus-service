
import React, { useState, useRef, useEffect } from 'react';
import Modal from '../components/Modal';
import { SHUTTLES, ROUTE_MAP_BASE64 } from '../constants';
import { SessionState, UserData } from '../types';

interface ShuttleSelectScreenProps {
  onApply: () => void;
  onBack: () => void;
}

/**
 * 지도 화면 (내장된 정적 Base64 리소스 사용)
 * 줌(Button) 및 드래그(Pan) 기능을 제공합니다.
 */
const MapView: React.FC<{ onClose: () => void; name: string }> = ({ onClose, name }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.2));
  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(1, prev - 0.2);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // 드래그 시작 (터치/마우스)
  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPos({ x: clientX - position.x, y: clientY - position.y });
  };

  // 드래그 이동
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || zoom <= 1) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - startPos.x,
      y: clientY - startPos.y
    });
  };

  // 드래그 종료
  const onEnd = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center animate-fade-in overflow-hidden touch-none">
      {/* iOS Nav Bar */}
      <div className="w-full flex justify-between items-center p-5 bg-black/80 backdrop-blur-md z-10 border-b border-white/10">
        <h2 className="text-white text-[17px] font-bold">{name} 노선도</h2>
        <button onClick={onClose} className="text-white text-[17px] font-medium bg-white/10 px-4 py-1.5 rounded-full active:bg-white/20">닫기</button>
      </div>

      {/* Map Content (내장된 Base64 리소스 렌더링) */}
      <div 
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      >
        <div 
          className="transition-transform duration-100 ease-out select-none pointer-events-none"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* 내장된 정적 리소스 ROUTE_MAP_BASE64 렌더링 */}
          <div style={{ width: "100%", overflow: "hidden", border: "1px solid #e5e5e5" }}>
            <img 
              src={ROUTE_MAP_BASE64} 
              alt="분당 1코스 노선 지도" 
              draggable={false}
              className="max-w-none w-screen h-auto block"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-12 flex items-center gap-6 bg-white/10 backdrop-blur-2xl p-4 rounded-[24px] border border-white/20 shadow-2xl">
        <button 
          onClick={handleZoomOut}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-3xl active:bg-white/30"
        >
          &minus;
        </button>
        <div className="text-white font-black text-[15px] min-w-[50px] text-center ios-system-font tracking-tight">
          {Math.round(zoom * 100)}%
        </div>
        <button 
          onClick={handleZoomIn}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl active:bg-white/30"
        >
          +
        </button>
      </div>
      
      <p className="absolute bottom-4 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] ios-system-font">
        Drag to explore • Pinch to zoom
      </p>
    </div>
  );
};

const ShuttleCard: React.FC<{ 
  shuttle: any; 
  onApply: () => void;
  isApplied: boolean; // 신청 여부 프롭
}> = ({ shuttle, onApply, isApplied }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // 1) 셔틀 신청 상태를 기준으로 텍스트 전환 (localStorage 기반 isApplied 값 사용)
  const shuttleStatusText = isApplied ? "탑승 중" : "탑승 전";

  return (
    <div className={`ios-card p-6 bg-white transition-all border-2 ${shuttle.id === 'shuttle_1' ? 'border-[#007AFF]' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* 상태 배지: 신청 완료(isApplied) 시 "탑승 중" 표시, 아니면 "탑승 전" */}
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md inline-block mb-3 ${isApplied ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
            {shuttleStatusText}
          </span>
          <h3 className="text-[24px] font-bold leading-tight tracking-tight">{shuttle.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Driver</p>
          <p className="font-bold text-[15px]">{shuttle.driverName}</p>
          <p className="text-[11px] text-gray-400 font-medium">{shuttle.driverPhone}</p>
        </div>
      </div>
      
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <p className="text-[14px] text-gray-700 font-bold leading-relaxed">{shuttle.routeSummary}</p>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={onApply} className="w-full py-4 bg-[#007AFF] text-white font-bold text-[16px] rounded-xl active:opacity-80 transition-opacity">신청하기</button>
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-3 bg-gray-100 text-[13px] font-semibold text-gray-600 rounded-xl active:bg-gray-200 transition-colors">{isExpanded ? '상세 정보 접기' : '상세 정보 보기'}</button>
      </div>

      {isExpanded && (
        <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 animate-slide-down">
          <div className="space-y-4 mb-5">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-gray-400">도착지</span>
              <span className="text-[14px] font-bold text-black">{shuttle.destination}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-gray-400">차량번호</span>
              <span className="text-[14px] font-bold text-black">{shuttle.carNumber}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowMap(true)} 
            className="w-full py-3 bg-white border-2 border-[#007AFF] text-[#007AFF] text-[13px] font-bold rounded-xl active:bg-[#007AFF]/5 transition-colors shadow-sm"
          >
            🗺️ 노선도 확인하기
          </button>
        </div>
      )}

      {showMap && <MapView name={shuttle.name} onClose={() => setShowMap(false)} />}
    </div>
  );
};

const ShuttleSelectScreen: React.FC<ShuttleSelectScreenProps> = ({ onApply, onBack }) => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplied, setIsApplied] = useState(false); // 신청 완료 여부 로컬 상태

  useEffect(() => {
    // 1) localStorage(shuttle_user_data)를 확인하여 신청 여부 상태 업데이트
    const stored = localStorage.getItem('shuttle_user_data');
    if (stored) {
      const data: UserData = JSON.parse(stored);
      setIsApplied(data.isApplied || false);
    }
  }, []);

  const handleApplyConfirm = () => {
    setIsApplyModalOpen(false);
    setIsLoading(true);
    // 기존 요구사항: 5초 후 신청 완료 처리
    setTimeout(() => {
      setIsLoading(false);
      onApply(); // 이 함수 내부에서 userData.isApplied를 true로 바꿈
    }, 5000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-[420px] mx-auto bg-white w-full">
        <div className="relative w-10 h-10 mb-6">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-[17px] font-bold mb-2 tracking-tight">신청 정보를 확인하고 있습니다</h2>
        <p className="text-[13px] text-gray-500 font-medium">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-[#F2F2F7] max-w-[420px] mx-auto w-full">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="text-[#007AFF] text-[17px] font-normal mr-4">{"<"} 뒤로</button>
        <h2 className="text-[22px] font-bold tracking-tight text-black text-left">노선 검색</h2>
      </div>

      <div className="flex-1 space-y-6">
        {SHUTTLES.map((shuttle) => (
          <ShuttleCard 
            key={shuttle.id} 
            shuttle={shuttle} 
            isApplied={isApplied} // 1) 신청 상태 전달
            onApply={() => setIsApplyModalOpen(true)}
          />
        ))}
      </div>

      <Modal
        isOpen={isApplyModalOpen}
        title="셔틀 신청"
        description={`분당 1코스를 신청하시겠습니까?`}
        onConfirm={handleApplyConfirm}
        onCancel={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
};

export default ShuttleSelectScreen;

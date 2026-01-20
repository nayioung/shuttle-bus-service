
import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { SHUTTLE_INFO, SHUTTLE_STOPS } from '../constants';
import { SessionState } from '../types';

interface ShuttleSelectScreenProps {
  onApply: () => void;
  onBack: () => void;
}

const ShuttleSelectScreen: React.FC<ShuttleSelectScreenProps> = ({ onApply, onBack }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isBoarded, setIsBoarded] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('shuttle_session_state');
    if (saved) {
      const session: SessionState = JSON.parse(saved);
      const totalDelay = (session.hasRandomDelay ? 20 : 0) + (session.isLateRequested ? 20 : 0);
      const elapsed = Math.floor((Date.now() - (session.t0 || 0)) / 1000);
      setIsBoarded(elapsed >= (30 + totalDelay));
    }
  }, []);

  const handleApplyConfirm = () => {
    setIsApplyModalOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onApply();
    }, 5000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-[420px] mx-auto bg-white w-full">
        {/* iOS Style Spinner */}
        <div className="relative w-10 h-10 mb-6">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-[17px] font-bold mb-2">신청 정보를 확인하고 있습니다</h2>
        <p className="text-[13px] text-gray-500 font-medium">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-[#F2F2F7] max-w-[420px] mx-auto w-full">
      <div className="flex items-center mb-10">
        <button onClick={onBack} className="text-[#007AFF] text-[17px] font-normal mr-4">{"<"} 뒤로</button>
        <h2 className="text-[20px] font-bold">노선 선택</h2>
      </div>

      <div className="flex-1 space-y-6">
        <div 
          onClick={() => setIsApplyModalOpen(true)}
          className={`ios-card p-6 cursor-pointer bg-white transition-all active:scale-[0.98] ${isBoarded ? 'border-[#007AFF]' : 'border-[#FF3B30]'}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md inline-block mb-3 ${isBoarded ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                {isBoarded ? '운행 중' : '운행 전'}
              </span>
              <h3 className="text-[24px] font-bold leading-tight">{SHUTTLE_INFO.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Driver</p>
              <p className="font-bold text-[15px]">{SHUTTLE_INFO.driverName}</p>
            </div>
          </div>
          
          <div className="mb-8 space-y-3">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-400 font-medium text-[13px]">도착 예정</span>
              <span className="font-bold text-[15px]">{SHUTTLE_INFO.destination}</span>
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDetail(!showDetail);
            }}
            className="w-full py-2 bg-gray-50 text-[13px] font-semibold text-gray-600 rounded-lg active:bg-gray-100 transition-colors"
          >
            {showDetail ? '경로 접기' : '전체 경로 보기'}
          </button>

          {showDetail && (
            <div className="mt-4 p-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
              <p className="text-[13px] font-medium leading-relaxed text-gray-600">
                {SHUTTLE_STOPS.map(s => s.name).join(' → ')}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isApplyModalOpen}
        title="셔틀 신청"
        description={`${SHUTTLE_INFO.name} 노선을 신청하시겠습니까?`}
        onConfirm={handleApplyConfirm}
        onCancel={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
};

export default ShuttleSelectScreen;


import React, { useState, useEffect, useRef } from 'react';
import Timeline from './Timeline';
import Modal from '../components/Modal';
import { SHUTTLE_STOPS } from '../constants';
import { getPersistedStudentCounts, updatePersistedStudentCounts, markEventDate } from '../helpers';

interface RouteDetailByDateProps {
  date: string;
  onBack: () => void;
}

const RouteDetailByDate: React.FC<RouteDetailByDateProps> = ({ date, onBack }) => {
  const [t0] = useState(Date.now());
  
  // [수정] 조회 전용: helpers.ts에서 통합 관리하는 Base Counts - Absence 기록 데이터 사용
  const [routeData] = useState(() => getPersistedStudentCounts(date));
  const [activeModal, setActiveModal] = useState<{ title: string; desc: string; onConfirm?: () => void; hideCancel?: boolean } | null>(null);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  };

  /**
   * 상세 페이지 진입 시 미탑승(hasAbsence) 상태면 비프음과 함께 안내 표시
   */
  useEffect(() => {
    if (routeData.hasAbsence) {
      const targetStop = SHUTTLE_STOPS.find(s => s.id === routeData.targetStopId);
      playBeep();
      setActiveModal({
        title: "미탑승 인원 안내",
        desc: `${targetStop?.name} 정류장에 미탑승 학생이 있어 실시간 인원이 조정되었습니다.`,
        hideCancel: true
      });
    }
  }, [date, routeData.hasAbsence, routeData.targetStopId]);

  // [수정] 지각 안내 문구 중립화 반영
  const handleStopClick = (name: string) => {
    if (name === "대치학원") return; 
    
    setActiveModal({
      title: "지각 안내 전송",
      desc: "지각할 수 있음을 학생들에게 안내하시겠습니까?",
      onConfirm: () => {
        markEventDate(date);
        setActiveModal(null);
      }
    });
  };

  const formattedDate = date ? `${parseInt(date.split('-')[1])}월 ${parseInt(date.split('-')[2])}일` : "";

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] max-w-[420px] mx-auto w-full overflow-x-hidden">
      <div className="flex items-center px-4 py-4 bg-[#F2F2F7]/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-200">
        <button onClick={onBack} className="text-[#007AFF] text-[17px] font-normal mr-4">{"<"} 뒤로</button>
        <h2 className="text-[17px] font-bold text-black">{formattedDate} Route</h2>
      </div>

      <div className="p-5 flex-1 space-y-4">
        <div className="ios-card p-6 bg-white border-none shadow-none">
           <div className="mb-8">
              <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest mb-1">Status Summary</h4>
              <p className="text-[16px] font-bold text-black tracking-tight leading-snug">
                {routeData.hasAbsence ? `주의: ${SHUTTLE_STOPS.find(s => s.id === routeData.targetStopId)?.name} 정류장에 미탑승 인원이 확인되었습니다.` : "현재까지 모든 인원이 정상 탑승 예정입니다."}
              </p>
           </div>

           <Timeline 
             t0={t0} 
             hideCongestion={true} 
             studentCounts={routeData.counts} 
             absentEventStopId={routeData.targetStopId}
             isDriverMode={true}
             onStopClick={handleStopClick}
           />
        </div>

        <div className="p-4 bg-[#F2F2F7] rounded-xl border border-gray-200">
          <p className="text-[12px] text-gray-400 font-medium leading-relaxed">
            * 탑승 학생 수는 모든 날짜에 대해 일관되게 적용됩니다. 특정 날짜에 미탑승 이벤트가 발생한 경우에만 해당 정류장의 인원이 1명 감소하여 표시됩니다.
          </p>
        </div>
      </div>

      <Modal 
        isOpen={!!activeModal} 
        title={activeModal?.title || ''} 
        description={activeModal?.desc || ''} 
        hideCancel={activeModal?.hideCancel} 
        onConfirm={() => setActiveModal(null)} 
        onCancel={() => setActiveModal(null)} 
      />
    </div>
  );
};

export default RouteDetailByDate;

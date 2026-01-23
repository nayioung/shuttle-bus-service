
import React, { useState, useEffect, useRef } from 'react';
import Timeline from './Timeline';
import MonthlyCalendar from './MonthlyCalendar';
import Modal from '../components/Modal';
import { SHUTTLE_STOPS } from '../constants';
import { getPersistedStudentCounts, markEventDate } from '../helpers';

interface DriverHomeProps {
  onLogout: () => void;
  onGoToNotices: () => void;
  onAddNotice: (title: string, content: string) => void;
  onSelectDate: (date: string) => void; 
}

const DriverHome: React.FC<DriverHomeProps> = ({ onLogout, onGoToNotices, onAddNotice, onSelectDate }) => {
  const [t0] = useState(Date.now());
  const todayStr = new Date().toISOString().split('T')[0];
  const delayTimerRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  
  const [data] = useState(() => getPersistedStudentCounts(todayStr));

  const [activeModal, setActiveModal] = useState<{ title: string; desc: string; onConfirm?: () => void; hideCancel?: boolean } | null>(null);
  const [showNoticeInput, setShowNoticeInput] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // [수정] 기사 전용 지각 안내 (정류장 기반 문구)
  useEffect(() => {
    const shownKey = `driver_delay_shown_${todayStr}`;
    const alreadyShown = localStorage.getItem(shownKey);

    if (!alreadyShown) {
      // 30% 확률로 학생 지각 안내 팝업 노출 (요청 사항)
      if (Math.random() < 0.3) {
        // [수정] 경유지 중 랜덤 선택 (대치학원 제외)
        const candidates = SHUTTLE_STOPS.filter(s => !s.isDestination);
        const randomStop = candidates[Math.floor(Math.random() * candidates.length)];

        const timer = setTimeout(() => {
          setActiveModal({
            title: "지각 안내",
            desc: `${randomStop.name} 정류장에서 학생이 지각할 수 있습니다.`,
            hideCancel: true,
            onConfirm: () => {
              if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
              setActiveModal(null);
            }
          });
          localStorage.setItem(shownKey, 'true');

          // 기사 화면 지각 알림 20초 후 자동 종료 유지
          autoCloseTimerRef.current = window.setTimeout(() => {
            setActiveModal(null);
          }, 20000);
        }, 8000);
        return () => clearTimeout(timer);
      } else {
        localStorage.setItem(shownKey, 'none');
      }
    }
  }, [todayStr]);

  const submitNotice = () => {
    if (!noticeTitle.trim()) return;
    onAddNotice(noticeTitle, noticeContent);
    setNoticeTitle('');
    setNoticeContent('');
    setShowNoticeInput(false);
    setActiveModal({ title: '공지 완료', desc: '공지사항이 정상적으로 등록되었습니다.', hideCancel: true });
  };

  const handleStopClick = (name: string) => {
    if (name === "대치학원") return;
    setActiveModal({
      title: "지각 안내 전송",
      desc: "지각할 수 있음을 학생들에게 안내하시겠습니까?",
      onConfirm: () => {
        markEventDate(todayStr);
        setActiveModal(null);
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] max-w-[420px] mx-auto w-full pb-10 overflow-x-hidden">
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#F2F2F7]/80 backdrop-blur-md z-[60]">
        <h2 className="text-[20px] font-bold text-black tracking-tight">기사 전용 모드</h2>
        <button onClick={onLogout} className="text-[#FF3B30] text-[15px] font-bold">로그아웃</button>
      </div>

      <div className="px-5 space-y-4">
        <div className="ios-card p-4 bg-white border-none shadow-none">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Today's Route</h3>
              <span className="text-[10px] text-gray-400 font-bold">실시간 인원</span>
           </div>
           <Timeline 
             t0={t0} 
             hideCongestion={true} 
             studentCounts={data.counts} 
             isDriverMode={true}
             onStopClick={handleStopClick}
           />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onGoToNotices} className="ios-card p-4 bg-white flex justify-between items-center border-none shadow-none active:bg-gray-50">
            <span className="text-[14px] font-bold text-black">공지 목록</span>
            <span className="text-gray-300">›</span>
          </button>
          <button onClick={() => setShowNoticeInput(true)} className="ios-card p-4 bg-[#007AFF] flex justify-between items-center border-none shadow-none active:opacity-80">
            <span className="text-[14px] font-bold text-white">공지 추가 +</span>
          </button>
        </div>

        <div className="ios-card p-5 bg-white border-none shadow-none">
          <MonthlyCalendar onDateSelect={onSelectDate} />
        </div>
      </div>

      {showNoticeInput && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-6 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-t-[20px] rounded-b-[14px] w-full max-w-[420px] p-6 animate-slide-up shadow-2xl">
            <h3 className="text-[17px] font-bold mb-4">새 공지사항 작성</h3>
            <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full p-4 bg-[#F2F2F7] rounded-xl text-[15px] mb-3 focus:outline-none" />
            <textarea value={noticeContent} onChange={e => setNoticeContent(e.target.value)} className="w-full h-32 p-4 bg-[#F2F2F7] rounded-xl text-[15px] focus:outline-none resize-none mb-4" placeholder="내용을 입력하세요..." />
            <div className="flex gap-3">
              <button onClick={() => setShowNoticeInput(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl">취소</button>
              <button onClick={submitNotice} className="flex-1 py-4 bg-[#007AFF] text-white font-bold rounded-xl">등록하기</button>
            </div>
          </div>
        </div>
      )}

      <Modal 
        isOpen={!!activeModal} 
        title={activeModal?.title || ''} 
        description={activeModal?.desc || ''} 
        hideCancel={activeModal?.hideCancel} 
        onConfirm={activeModal?.onConfirm || (() => setActiveModal(null))} 
        onCancel={() => setActiveModal(null)} 
      />
    </div>
  );
};

export default DriverHome;

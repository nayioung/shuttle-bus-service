
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, UserData, SessionState } from '../types';
import { SHUTTLE_STOPS, SHUTTLE_INFO, NOTICES } from '../constants';
import { formatHHMMSS } from '../helpers';
import Modal from '../components/Modal';
import Toggle from '../components/Toggle';
import Timeline from './Timeline';
import MiniCalendar from './MiniCalendar';

interface MainDashboardProps {
  userData: UserData;
  onGoToMyPage: () => void;
  onGoToChat: () => void;
  onGoToNotices: () => void;
  onSelectNotice: (id: number) => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ 
  userData, onGoToMyPage, onGoToChat, onGoToNotices, onSelectNotice 
}) => {
  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem('shuttle_session_state');
    if (saved) return JSON.parse(saved);
    return {
      t0: Date.now(),
      lateCount: 0,
      absentDates: [],
      isLateRequested: false,
      isAbsentRequested: false,
      hasRandomDelay: Math.random() < 0.3
    };
  });

  const [now, setNow] = useState(Date.now());
  const [isAlertOn, setIsAlertOn] = useState(!session.isAbsentRequested);
  const [activeModal, setActiveModal] = useState<{ title: string; desc: string; onConfirm?: () => void; hideCancel?: boolean } | null>(null);
  
  const shownAlerts = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('shuttle_session_state', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalDelay = (session.hasRandomDelay ? 20 : 0) + (session.isLateRequested ? 20 : 0);
  const t0 = session.t0 || Date.now();
  const elapsed = Math.floor((now - t0) / 1000);

  const boardingTime = new Date(t0 + (30 + totalDelay) * 1000);
  const arrivalTime = new Date(t0 + (150 + totalDelay) * 1000);
  
  const isAfterBoarding = now >= boardingTime.getTime();

  useEffect(() => {
    if (!isAlertOn || session.isAbsentRequested) return;

    if (userData.role === UserRole.STUDENT && elapsed === (150 + totalDelay - 30) && !shownAlerts.current.has('st_arrival')) {
      setActiveModal({ title: '알림', desc: '하차 1분 전입니다', hideCancel: true });
      shownAlerts.current.add('st_arrival');
    }

    if (userData.role === UserRole.PARENT) {
      if (elapsed === (30 + totalDelay) && !shownAlerts.current.has('pa_board')) {
        setActiveModal({ title: '승차 알림', desc: `${userData.studentName}이(가) 승차하였습니다.`, hideCancel: true });
        shownAlerts.current.add('pa_board');
      }
      if (elapsed === (150 + totalDelay) && !shownAlerts.current.has('pa_alight')) {
        setActiveModal({ title: '하차 알림', desc: `${userData.studentName}이(가) 하차하였습니다.`, hideCancel: true });
        shownAlerts.current.add('pa_alight');
      }
    }
  }, [elapsed, isAlertOn, session.isAbsentRequested, userData, totalDelay]);

  const toggleLate = () => {
    if (isAfterBoarding) {
      setActiveModal({ title: '안내', desc: '승차 시간이 지나 설정할 수 없습니다.', hideCancel: true });
      return;
    }
    if (session.isAbsentRequested) {
      setActiveModal({ title: '안내', desc: '이미 다른 항목이 설정되어 있습니다. 해제 후 이용해 주세요.', hideCancel: true });
      return;
    }
    if (session.isLateRequested) {
      setActiveModal({
        title: '지각 취소',
        desc: '지각 신청을 취소하시겠습니까?',
        onConfirm: () => {
          setSession(s => ({ ...s, isLateRequested: false }));
          setActiveModal(null);
        }
      });
    } else {
      setActiveModal({
        title: '지각 신청',
        desc: `2분 이내로 늦을 때만 월 2회 사용 가능합니다.\n사용하시겠습니까? (이번달 1/2회 사용)`,
        onConfirm: () => {
          setSession(s => ({ ...s, isLateRequested: true }));
          setActiveModal(null);
        }
      });
    }
  };

  const toggleAbsent = () => {
    if (isAfterBoarding) {
      setActiveModal({ title: '안내', desc: '승차 시간이 지나 설정할 수 없습니다.', hideCancel: true });
      return;
    }
    if (session.isLateRequested) {
      setActiveModal({ title: '안내', desc: '이미 다른 항목이 설정되어 있습니다. 해제 후 이용해 주세요.', hideCancel: true });
      return;
    }
    
    if (session.isAbsentRequested) {
      setActiveModal({
        title: '미탑승 취소',
        desc: '당일 미탑승을 취소하시겠습니까?',
        onConfirm: () => {
          setSession(s => ({ ...s, isAbsentRequested: false }));
          setIsAlertOn(true);
          setActiveModal(null);
        }
      });
    } else {
      setActiveModal({
        title: '미탑승 신청',
        desc: '당일 미탑승을 신청하시겠습니까?',
        onConfirm: () => {
          setSession(s => ({ ...s, isAbsentRequested: true }));
          setIsAlertOn(false);
          setActiveModal(null);
        }
      });
    }
  };

  const handleDateSelect = (date: string) => {
    if (session.absentDates.includes(date)) {
      setActiveModal({
        title: '취소 확인',
        desc: `${date} 미탑승을 취소하시겠습니까?`,
        onConfirm: () => {
          setSession(s => ({ ...s, absentDates: s.absentDates.filter(d => d !== date) }));
          setActiveModal(null);
        }
      });
    } else {
      setActiveModal({
        title: '미탑승 신청',
        desc: `${date}에 미탑승 하시겠습니까?`,
        onConfirm: () => {
          setSession(s => ({ ...s, absentDates: [...s.absentDates, date] }));
          setActiveModal(null);
        }
      });
    }
  };

  const isTimeHighlighted = (target: Date) => {
    const diff = (target.getTime() - now) / 1000;
    return diff > 0 && diff <= 10;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] max-w-[420px] mx-auto w-full overflow-x-hidden pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#F2F2F7]/80 backdrop-blur-md z-30">
        <h1 className="text-[17px] font-bold text-black">{SHUTTLE_INFO.name}</h1>
        <button onClick={onGoToMyPage} className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-lg active:opacity-60 transition-opacity">👤</button>
      </div>

      <div className="px-5 space-y-5">
        {/* 예상 시간 카드 */}
        <div className="ios-card flex p-4 divide-x divide-gray-100">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-tight mb-1">예상 승차</span>
            <span className={`text-[20px] font-bold tabular-nums transition-colors duration-300 ${isTimeHighlighted(boardingTime) ? 'text-[#FF3B30]' : 'text-black'}`}>
              {formatHHMMSS(boardingTime)}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-tight mb-1">예상 하차</span>
            <span className={`text-[20px] font-bold tabular-nums transition-colors duration-300 ${isTimeHighlighted(arrivalTime) ? 'text-[#FF3B30]' : 'text-black'}`}>
              {formatHHMMSS(arrivalTime)}
            </span>
          </div>
        </div>

        {/* 공지사항 미리보기 */}
        <div className="ios-card p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer" onClick={onGoToNotices}>
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-[12px] font-semibold text-gray-400">기사님 공지사항</h4>
            <span className="text-[12px] text-[#007AFF] font-medium">더보기</span>
          </div>
          <p className="text-[15px] font-semibold text-black truncate">
            {NOTICES[0].title}
          </p>
        </div>

        <div className="flex gap-4 items-stretch">
          <div className="ios-card p-3 w-[120px] flex flex-col items-center">
            <Timeline t0={t0} delaySec={totalDelay} />
          </div>
          
          <div className="flex-1 space-y-4">
            {/* 1) 알림 토글 라벨 변경 (도착 -> 하차) */}
            <div className="ios-card p-4">
              <Toggle 
                label={userData.role === UserRole.STUDENT ? "하차 알림" : "승하차 알림"} 
                isOn={isAlertOn} 
                onToggle={() => !session.isAbsentRequested && setIsAlertOn(!isAlertOn)} 
              />
            </div>

            {/* 탑승 관리 */}
            <div className="ios-card p-4 space-y-4">
              <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-tighter">탑승 관리</h4>
              <div className="space-y-2">
                <button 
                  onClick={toggleAbsent}
                  className={`w-full py-3 text-[15px] font-semibold rounded-xl border border-gray-200 transition-all 
                    ${isAfterBoarding ? 'opacity-50 grayscale-[0.2]' : 'active:bg-gray-50'}
                    ${session.isAbsentRequested ? 'bg-[#007AFF] text-white border-transparent' : 'bg-white text-black'}`}
                >
                  당일 미탑승 {session.isAbsentRequested && '✓'}
                </button>
                <button 
                  onClick={toggleLate}
                  className={`w-full py-3 text-[15px] font-semibold rounded-xl border border-gray-200 transition-all 
                    ${isAfterBoarding ? 'opacity-50 grayscale-[0.2]' : 'active:bg-gray-50'}
                    ${session.isLateRequested ? 'bg-[#007AFF] text-white border-transparent' : 'bg-white text-black'}`}
                >
                  지각 신청 {session.isLateRequested && '✓'}
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 font-medium">이번달 1/2회 사용</p>
            </div>

            {/* 기사 정보 */}
            <div className="ios-card p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <div className="text-[14px] flex-1">
                   <p className="font-bold text-[16px]">{SHUTTLE_INFO.driverName} 기사님</p>
                   <p className="text-[14px] text-gray-600 font-semibold mt-0.5">{SHUTTLE_INFO.driverPhone}</p>
                   <p className="text-[12px] text-gray-400 font-medium mt-1">{SHUTTLE_INFO.carNumber}</p>
                </div>
                <div className="w-9 h-9 bg-[#F2F2F7] rounded-full flex items-center justify-center text-xl ml-2 flex-shrink-0">📞</div>
              </div>
              <button onClick={onGoToChat} className="w-full py-3 bg-[#007AFF] text-white font-bold text-[14px] rounded-xl active:opacity-80 transition-opacity">기사님과 연락하기</button>
            </div>
          </div>
        </div>

        {/* 캘린더 */}
        <div className="ios-card p-5">
          <h4 className="text-[13px] font-bold text-black mb-4 tracking-tight">탑승 일정 관리</h4>
          <MiniCalendar 
            absentDates={session.absentDates} 
            onDateSelect={handleDateSelect} 
          />
        </div>
      </div>

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

export default MainDashboard;

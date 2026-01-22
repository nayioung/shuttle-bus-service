
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, UserData, SessionState } from '../types';
import { SHUTTLE_STOPS, SHUTTLES, NOTICES, NON_OPERATION_DATES } from '../constants';
import { formatHHMMSS } from '../helpers';
import Modal from '../components/Modal';
import Toggle from '../components/Toggle';
import Timeline from './Timeline';
import MiniCalendar from './MiniCalendar';

interface MainDashboardProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onGoToMyPage: () => void;
  onGoToChat: () => void;
  onGoToNotices: () => void;
  onAddRoute: () => void;
  onSelectNotice: (id: number) => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ 
  userData, setUserData, onGoToMyPage, onGoToChat, onGoToNotices, onAddRoute, onSelectNotice 
}) => {
  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem('shuttle_session_state');
    if (saved) return JSON.parse(saved);
    
    const initialMemos: Record<string, string> = {};
    NON_OPERATION_DATES.forEach(date => {
      initialMemos[date] = '기사님 휴무일';
    });

    return {
      t0: Date.now(),
      lateCount: 0,
      absentDates: [],
      isLateRequested: false,
      isAbsentRequested: false,
      hasRandomDelay: Math.random() < 0.3,
      calendarMemos: initialMemos,
      calendarViewMode: 'week'
    };
  });

  const [now, setNow] = useState(Date.now());
  const [isAlertOn, setIsAlertOn] = useState(() => !session.isAbsentRequested);
  const [activeModal, setActiveModal] = useState<{ title: string; desc: string; onConfirm?: () => void; hideCancel?: boolean } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const shownAlerts = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (session.isAbsentRequested) {
      setIsAlertOn(false);
    } else {
      setIsAlertOn(true);
    }
  }, [session.isAbsentRequested]);

  useEffect(() => {
    localStorage.setItem('shuttle_session_state', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const t0 = session.t0 || Date.now();
  const elapsed = Math.floor((now - t0) / 1000);
  const delaySec = session.isLateRequested ? 20 : 0;
  const boardingTime = new Date(t0 + (30) * 1000); 
  const arrivalTime = new Date(t0 + (150 + delaySec) * 1000); 
  const isAfterBoarding = now >= boardingTime.getTime();

  useEffect(() => {
    if (!isAlertOn || session.isAbsentRequested) return;
    if (userData.role === UserRole.STUDENT && elapsed === (150 + delaySec - 30) && !shownAlerts.current.has('st_arrival')) {
      setActiveModal({ title: '알림', desc: '하차 1분 전입니다', hideCancel: true });
      shownAlerts.current.add('st_arrival');
    }
    if (userData.role === UserRole.PARENT) {
      if (elapsed === 30 && !shownAlerts.current.has('pa_board')) {
        setActiveModal({ title: '승차 알림', desc: `${userData.studentName}이(가) 승차하였습니다.`, hideCancel: true });
        shownAlerts.current.add('pa_board');
      }
      if (elapsed === (150 + delaySec) && !shownAlerts.current.has('pa_alight')) {
        setActiveModal({ title: '하차 알림', desc: `${userData.studentName}이(가) 하차하였습니다.`, hideCancel: true });
        shownAlerts.current.add('pa_alight');
      }
    }
  }, [elapsed, isAlertOn, session.isAbsentRequested, userData, delaySec]);

  const handleAbsentClick = () => {
    if (isAfterBoarding) {
      setActiveModal({ title: '알림', desc: '승차 시간이 지나 신청/취소할 수 없습니다.', hideCancel: true });
      return;
    }
    if (session.isLateRequested) {
      setActiveModal({ title: '알림', desc: '이미 다른 항목이 선택되어 있어 신청할 수 없습니다.', hideCancel: true });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (session.isAbsentRequested) {
      setSession(s => ({ 
        ...s, 
        isAbsentRequested: false, 
        absentDates: s.absentDates.filter(d => d !== todayStr)
      }));
    } else {
      setActiveModal({ 
        title: "신청 확인", 
        desc: "당일 미탑승 하시겠습니까?", 
        onConfirm: () => {
          setSession(s => ({ 
            ...s, 
            isAbsentRequested: true, 
            absentDates: Array.from(new Set([...s.absentDates, todayStr])) 
          }));
          setActiveModal(null);
        }
      });
    }
  };

  const handleLateClick = () => {
    if (isAfterBoarding) {
      setActiveModal({ title: '알림', desc: '승차 시간이 지나 신청/취소할 수 없습니다.', hideCancel: true });
      return;
    }
    if (session.isAbsentRequested) {
      setActiveModal({ title: '알림', desc: '이미 다른 항목이 선택되어 있어 신청할 수 없습니다.', hideCancel: true });
      return;
    }

    if (session.isLateRequested) {
      setSession(s => ({ ...s, isLateRequested: false }));
    } else {
      setActiveModal({ 
        title: "신청 확인", 
        desc: "지각 신청은 2분 이내일 때, 월 2회만 가능합니다.\n지각 신청하시겠습니까?", 
        onConfirm: () => {
          setSession(s => ({ ...s, isLateRequested: true }));
          setActiveModal(null);
        }
      });
    }
  };

  const timeFontStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif'
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] max-w-[420px] mx-auto w-full overflow-x-hidden pb-10">
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#F2F2F7]/80 backdrop-blur-md z-[60]">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-[14px] font-bold text-[#007AFF] active:bg-gray-50 transition-colors"
          >
            <span>분당 1코스</span>
            <span className={`text-[10px] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute top-10 left-0 w-[160px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 overflow-hidden animate-slide-down">
                <button onClick={() => setIsDropdownOpen(false)} className="w-full px-5 py-4 text-left text-[15px] font-bold text-black active:bg-gray-100 flex justify-between items-center">
                  <span>분당 1코스</span>
                  <span className="text-[#34C759]">✓</span>
                </button>
                <div className="h-[0.5px] bg-gray-100 mx-2"></div>
                <button onClick={() => { setIsDropdownOpen(false); onAddRoute(); }} className="w-full px-5 py-4 text-left text-[14px] font-medium text-gray-500 active:bg-gray-100 flex items-center gap-2">
                  <span className="text-lg text-[#007AFF]">+</span>
                  <span>추가하기</span>
                </button>
              </div>
            </>
          )}
        </div>
        <button onClick={onGoToMyPage} className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-lg active:opacity-60 transition-opacity">👤</button>
      </div>

      <div className="px-5 space-y-4">
        {/* 예상 시간 카드 */}
        <div className="ios-card flex p-4 divide-x divide-gray-100 bg-white shadow-sm border-none">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">예상 승차</span>
            <span style={timeFontStyle} className={`text-[20px] font-black tabular-nums transition-colors duration-300 text-black`}>
              {formatHHMMSS(boardingTime)}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">예상 하차</span>
            <span style={timeFontStyle} className={`text-[20px] font-black tabular-nums transition-colors duration-300 text-black`}>
              {formatHHMMSS(arrivalTime)}
            </span>
          </div>
        </div>

        {/* 공지사항 카드 */}
        <div className="ios-card p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer border-none shadow-sm" onClick={onGoToNotices}>
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Driver Notice</h4>
            <span className="text-[12px] text-[#007AFF] font-bold">전체보기</span>
          </div>
          <p className="text-[16px] font-bold text-black truncate">{NOTICES[0].title}</p>
        </div>

        {/* 노선 및 설정 그리드 영역 */}
        <div className="flex gap-4 items-stretch">
          {/* 노선 시각화 UI (Timeline 내부에 혼잡도 안내 포함) */}
          <div className="ios-card p-3 w-[135px] flex flex-col items-center bg-white border-none shadow-sm relative overflow-hidden">
            <Timeline t0={t0} isLate={session.isLateRequested} isAbsent={session.isAbsentRequested} />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="ios-card p-4 bg-white border-none shadow-sm">
              <Toggle label={userData.role === UserRole.STUDENT ? "하차 알림" : "승하차 알림"} isOn={isAlertOn} onToggle={() => setIsAlertOn(!isAlertOn)} />
            </div>

            <div className="ios-card p-4 space-y-4 bg-white border-none shadow-sm">
              <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest text-center">Attendance</h4>
              <div className="space-y-2">
                {/* [수정] 승차 시간 이후 버튼 비활성화 시각화 강화 */}
                <button 
                  onClick={handleAbsentClick} 
                  disabled={isAfterBoarding}
                  className={`w-full py-3.5 text-[15px] font-bold rounded-xl border transition-all 
                    ${isAfterBoarding 
                      ? 'bg-[#E5E5EA] text-[#8E8E93] border-transparent cursor-not-allowed opacity-70' 
                      : session.isAbsentRequested 
                        ? 'bg-[#FF3B30] text-white border-transparent' 
                        : 'bg-white text-black border-gray-100 active:bg-gray-50'
                    }`}
                >
                  당일 미탑승 {session.isAbsentRequested && '✓'}
                </button>
                <button 
                  onClick={handleLateClick} 
                  disabled={isAfterBoarding}
                  className={`w-full py-3.5 text-[15px] font-bold rounded-xl border transition-all 
                    ${isAfterBoarding 
                      ? 'bg-[#E5E5EA] text-[#8E8E93] border-transparent cursor-not-allowed opacity-70' 
                      : session.isLateRequested 
                        ? 'bg-[#007AFF] text-white border-transparent' 
                        : 'bg-white text-black border-gray-100 active:bg-gray-50'
                    }`}
                >
                  지각 신청 {session.isLateRequested && '✓'}
                </button>
              </div>
            </div>

            <div className="ios-card p-4 bg-white border-none shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[14px]">
                   <p className="font-black text-[17px] text-black tracking-tight">김기사 기사님</p>
                   <p className="text-[13px] text-[#007AFF] font-bold mt-0.5">010-1234-5678</p>
                </div>
                <div className="w-10 h-10 bg-[#F2F2F7] rounded-full flex items-center justify-center text-xl">📞</div>
              </div>
              <button onClick={onGoToChat} className="w-full py-4 bg-black text-white font-bold text-[14px] rounded-xl active:opacity-80 transition-opacity">기사님과 연락하기</button>
            </div>
          </div>
        </div>

        {/* 달력 영역 */}
        <div className="ios-card p-5 bg-white border-none shadow-sm">
          <MiniCalendar 
            absentDates={session.absentDates} 
            calendarMemos={session.calendarMemos}
            viewMode={session.calendarViewMode}
            onDateSelect={(date) => {
              const alreadyAbsent = session.absentDates.includes(date);
              setSession(s => ({ 
                ...s, 
                absentDates: alreadyAbsent 
                  ? s.absentDates.filter(d => d !== date) 
                  : [...s.absentDates, date] 
              }));
            }}
            onUpdateMemo={(date, memo) => {
              setSession(s => ({ ...s, calendarMemos: { ...s.calendarMemos, [date]: memo } }));
            }}
            onToggleView={() => {
              setSession(s => ({ ...s, calendarViewMode: s.calendarViewMode === 'week' ? 'month' : 'week' }));
            }}
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

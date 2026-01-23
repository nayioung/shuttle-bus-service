
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, UserData, SessionState, Notice } from '../types';
import { SHUTTLE_STOPS, NON_OPERATION_DATES } from '../constants';
import { formatHHMMSS, markEventDate } from '../helpers';
import Modal from '../components/Modal';
import Toggle from '../components/Toggle';
import Timeline from './Timeline';
import MiniCalendar from './MiniCalendar';

interface MainDashboardProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  notices: Notice[];
  onGoToMyPage: () => void;
  onGoToChat: () => void;
  onGoToNotices: () => void;
  onAddRoute: () => void;
  onSelectNotice: (id: number) => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ 
  userData, setUserData, notices, onGoToMyPage, onGoToChat, onGoToNotices, onAddRoute, onSelectNotice 
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
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 팝업 중복 노출 방지 상태
  const [hasShownBoarding, setHasShownBoarding] = useState(false);
  const [hasShownAlighting, setHasShownAlighting] = useState(false);

  const [isAlertOn, setIsAlertOn] = useState(() => !session.isAbsentRequested);
  const [activeModal, setActiveModal] = useState<{ title: string; desc: string; onConfirm?: () => void; hideCancel?: boolean } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAttendanceInfo, setShowAttendanceInfo] = useState(false);

  // [유지] 사용자 전용 지각 알림 (기사님 기준 문구)
  useEffect(() => {
    const shownKey = `user_delay_shown_${todayStr}`;
    const alreadyShown = localStorage.getItem(shownKey);

    if (!alreadyShown && userData.role !== UserRole.DRIVER) {
      if (Math.random() < 0.3) {
        const timer = setTimeout(() => {
          setActiveModal({
            title: "지각 안내",
            desc: "기사님이 지각할 수 있습니다.",
            hideCancel: true,
            onConfirm: () => setActiveModal(null)
          });
          localStorage.setItem(shownKey, 'true');
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        localStorage.setItem(shownKey, 'none');
      }
    }
  }, [todayStr, userData.role]);

  // [유지] 학부모용 승하차 실시간 팝업 로직
  useEffect(() => {
    if (userData.role !== UserRole.PARENT || !isAlertOn) return;

    const t0 = session.t0 || Date.now();
    const delayMs = (session.isLateRequested || session.hasRandomDelay) ? 20000 : 0;
    
    const boardingTrigger = t0 + (30 * 1000) + delayMs;
    const alightingTrigger = t0 + (150 * 1000) + delayMs;

    if (!hasShownBoarding && now >= boardingTrigger) {
      setHasShownBoarding(true);
      setActiveModal({
        title: "승차 알림",
        desc: `${userData.studentName}이 승차하였습니다.`,
        hideCancel: true,
        onConfirm: () => setActiveModal(null)
      });
    }

    if (!hasShownAlighting && now >= alightingTrigger) {
      setHasShownAlighting(true);
      setActiveModal({
        title: "하차 알림",
        desc: `${userData.studentName}이 하차하였습니다.`,
        hideCancel: true,
        onConfirm: () => setActiveModal(null)
      });
    }
  }, [now, userData.role, userData.studentName, isAlertOn, session.t0, session.isLateRequested, session.hasRandomDelay]);

  useEffect(() => {
    setIsAlertOn(!session.isAbsentRequested);
  }, [session.isAbsentRequested]);

  useEffect(() => {
    localStorage.setItem('shuttle_session_state', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * [핵심 복구 로직] 실제 승차 시간 계산 (지연 반영)
   * T0 + 기본 30초 + (지각 신청 or 기사 지연 시 20초)
   */
  const t0 = session.t0 || Date.now();
  const delaySec = (session.isLateRequested || session.hasRandomDelay) ? 20 : 0;
  const boardingTime = new Date(t0 + (30 + delaySec) * 1000); 
  const isAfterBoarding = now >= boardingTime.getTime();

  /**
   * [수정] 미탑승 신청/취소 핸들러
   * 승차 시간이 지난 경우 신청 및 취소 행위를 모두 차단함
   */
  const handleAbsentClick = () => {
    if (isAfterBoarding) {
      setActiveModal({ 
        title: '알림', 
        desc: '승차 시간이 지나 신청/취소할 수 없습니다.', // 요청하신 정확한 문구 적용
        hideCancel: true 
      });
      return;
    }
    
    if (session.isLateRequested) {
      setActiveModal({ title: '알림', desc: '이미 다른 항목이 선택되어 있어 신청할 수 없습니다.', hideCancel: true });
      return;
    }

    if (session.isAbsentRequested) {
      setActiveModal({ 
        title: "취소 확인", 
        desc: "미탑승을 취소하시겠습니까?", 
        onConfirm: () => {
          setSession(s => ({ 
            ...s, 
            isAbsentRequested: false, 
            absentDates: s.absentDates.filter(d => d !== todayStr)
          }));
          setActiveModal(null);
        }
      });
    } else {
      setActiveModal({ 
        title: "신청 확인", 
        desc: "미탑승을 신청하시겠습니까?", 
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

  /**
   * [수정] 지각 신청/취소 핸들러
   * 승차 시간이 지난 경우 신청 및 취소 행위를 모두 차단함
   */
  const handleLateClick = () => {
    if (isAfterBoarding) {
      setActiveModal({ 
        title: '알림', 
        desc: '승차 시간이 지나 신청/취소할 수 없습니다.', // 요청하신 정확한 문구 적용
        hideCancel: true 
      });
      return;
    }

    if (session.isAbsentRequested) {
      setActiveModal({ title: '알림', desc: '이미 다른 항목이 선택되어 있어 신청할 수 없습니다.', hideCancel: true });
      return;
    }

    if (session.isLateRequested) {
       setActiveModal({ 
        title: "취소 확인", 
        desc: "지각 신청을 취소하시겠습니까?", 
        onConfirm: () => {
          setSession(s => ({ ...s, isLateRequested: false }));
          setActiveModal(null);
        }
      });
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

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] max-w-[420px] mx-auto w-full overflow-x-hidden pb-10">
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#F2F2F7]/80 backdrop-blur-md z-[60]">
        <div className="relative">
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-[14px] font-bold text-[#007AFF] active:bg-gray-50 transition-colors">
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
        <div className="ios-card flex p-4 divide-x divide-gray-100 bg-white shadow-none border-gray-200">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">예상 승차</span>
            <span className="text-[20px] font-black tabular-nums text-black">{formatHHMMSS(boardingTime)}</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">예상 하차</span>
            <span className="text-[20px] font-black tabular-nums text-black">{formatHHMMSS(new Date(t0 + (150 + delaySec) * 1000))}</span>
          </div>
        </div>

        <div className="ios-card p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer border-gray-200" onClick={onGoToNotices}>
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Driver Notice</h4>
            <span className="text-[12px] text-[#007AFF] font-bold">전체보기</span>
          </div>
          <p className="text-[16px] font-bold text-black truncate">{notices[0]?.title || '공지사항이 없습니다.'}</p>
        </div>

        <div className="flex gap-4 items-stretch">
          <div className="ios-card p-3 w-[135px] flex flex-col items-center bg-white border-gray-200 relative overflow-hidden">
            <Timeline t0={t0} isLate={session.isLateRequested} isAbsent={session.isAbsentRequested} />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="ios-card p-4 bg-white border-gray-200">
              <Toggle label={userData.role === UserRole.STUDENT ? "하차 알림" : "승하차 알림"} isOn={isAlertOn} onToggle={() => setIsAlertOn(!isAlertOn)} />
            </div>

            <div className="ios-card p-4 space-y-4 bg-white border-gray-200 relative">
              <div className="flex justify-center items-center relative">
                <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Attendance</h4>
                <button 
                  onClick={() => setShowAttendanceInfo(!showAttendanceInfo)}
                  className="absolute right-0 w-5 h-5 flex items-center justify-center text-[10px] font-black text-[#007AFF] bg-[#007AFF]/10 rounded-full active:scale-90 transition-all"
                >
                  ⓘ
                </button>
              </div>
              
              {showAttendanceInfo && (
                <div className="bg-[#F2F2F7] p-2 rounded-lg text-[8px] font-bold text-gray-600 animate-slide-down border border-gray-100 leading-tight">
                  승차 시간 이후에는 설정이 불가능합니다.
                </div>
              )}

              <div className="space-y-2">
                {/* 
                   isAfterBoarding 시 버튼 시각적 비활성화 및 클릭 로직 적용
                   disabled 속성을 부여하되 클릭 시 모달이 뜨도록 handle 함수 호출 유지
                */}
                <button 
                  onClick={handleAbsentClick} 
                  className={`w-full py-3.5 text-[15px] font-bold rounded-xl border transition-all ${isAfterBoarding ? 'bg-[#E5E5EA] text-[#8E8E93] border-transparent cursor-not-allowed opacity-70' : session.isAbsentRequested ? 'bg-[#FF3B30] text-white border-transparent' : 'bg-white text-black border-gray-200 active:bg-gray-50'}`}
                >
                  당일 미탑승 {session.isAbsentRequested && '✓'}
                </button>
                <button 
                  onClick={handleLateClick} 
                  className={`w-full py-3.5 text-[15px] font-bold rounded-xl border transition-all ${isAfterBoarding ? 'bg-[#E5E5EA] text-[#8E8E93] border-transparent cursor-not-allowed opacity-70' : session.isLateRequested ? 'bg-[#007AFF] text-white border-transparent' : 'bg-white text-black border-gray-200 active:bg-gray-50'}`}
                >
                  지각 신청 {session.isLateRequested && '✓'}
                </button>
              </div>
            </div>

            <div className="ios-card p-4 bg-white border-gray-200">
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

        <div className="ios-card p-5 bg-white border-gray-200">
          <MiniCalendar 
            absentDates={session.absentDates} 
            calendarMemos={session.calendarMemos}
            viewMode={session.calendarViewMode}
            onDateSelect={(date) => {
              const alreadyAbsent = session.absentDates.includes(date);
              setSession(s => ({ ...s, absentDates: alreadyAbsent ? s.absentDates.filter(d => d !== date) : [...s.absentDates, date] }));
            }}
            onUpdateMemo={(date, memo) => { setSession(s => ({ ...s, calendarMemos: { ...s.calendarMemos, [date]: memo } })); }}
            onToggleView={() => { setSession(s => ({ ...s, calendarViewMode: s.calendarViewMode === 'week' ? 'month' : 'week' })); }}
          />
        </div>
      </div>

      <Modal isOpen={!!activeModal} title={activeModal?.title || ''} description={activeModal?.desc || ''} hideCancel={activeModal?.hideCancel} onConfirm={activeModal?.onConfirm || (() => setActiveModal(null))} onCancel={() => setActiveModal(null)} />
    </div>
  );
};

export default MainDashboard;

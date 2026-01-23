
import React, { useState, useMemo, useEffect } from 'react';
import { NON_OPERATION_DATES, OPERATIONAL_DAYS } from '../constants';
import Modal from '../components/Modal';
import { getEventHistory, getPersistedStudentCounts } from '../helpers';

interface MiniCalendarProps {
  absentDates: string[];
  calendarMemos: Record<string, string>;
  viewMode: 'week' | 'month';
  onDateSelect: (date: string) => void;
  onUpdateMemo: (date: string, memo: string) => void;
  onToggleView: () => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ 
  absentDates, 
  calendarMemos, 
  viewMode, 
  onDateSelect, 
  onUpdateMemo,
  onToggleView
}) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split('T')[0];
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getWeeklyDays = () => {
    const todayIndex = days.findIndex(d => d === today.getDate());
    const startIdx = Math.max(0, todayIndex - (todayIndex % 7));
    return days.slice(startIdx, startIdx + 7);
  };

  const displayedDays = viewMode === 'month' ? days : getWeeklyDays();

  // [사전 렌더링 로직] 달력 마운트 시 표시된 날짜들에 대해 미탑승 데이터를 미리 로드함
  useEffect(() => {
    displayedDays.forEach(day => {
      if (day) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // 이 호출이 내부적으로 markEventDate를 실행시켜 히스토리에 점 데이터를 쌓음
        getPersistedStudentCounts(dateStr);
      }
    });
  }, [viewMode, year, month]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [memoInput, setMemoInput] = useState('');
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // 데이터 히스토리 로드 (useEffect에 의해 선행 로드된 데이터가 즉각 반영됨)
  const eventHistory = getEventHistory();

  const getDateInfo = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay();
    const isOperational = OPERATIONAL_DAYS.includes(dayOfWeek) && !NON_OPERATION_DATES.includes(dateStr);
    const dateObj = new Date(dateStr);
    dateObj.setHours(0,0,0,0);
    
    return {
      isPast: dateObj.getTime() < today.getTime(),
      isToday: dateStr === todayStr,
      isFuture: dateObj.getTime() > today.getTime(),
      isOperational
    };
  };

  const handleDateClick = (dateStr: string) => {
    const { isPast, isToday } = getDateInfo(dateStr);
    if (isPast || isToday) {
      setErrorModal("지난 날짜나 오늘 날짜는 달력에서 설정할 수 없습니다. (오늘 미탑승은 메인 화면의 버튼을 이용해 주세요)");
      return;
    }
    setSelectedDate(dateStr);
    setShowActionModal(true);
  };

  const handleSelectSkip = () => {
    if (!selectedDate) return;
    const { isOperational } = getDateInfo(selectedDate);
    if (!isOperational) {
      setErrorModal("미운행일에는 미탑승을 신청할 수 없습니다. (메모만 가능합니다)");
      return;
    }
    setShowActionModal(false);
    setShowConfirmModal(true);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[13px] font-bold text-black tracking-tight">탑승 일정 관리</h4>
        <button onClick={onToggleView} className="w-8 h-8 flex items-center justify-center bg-[#F2F2F7] rounded-full active:scale-90 transition-transform">
          <span className={`text-[#007AFF] text-lg transition-transform duration-300 ${viewMode === 'month' ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 transition-all duration-300">
        {displayedDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-10"></div>;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const { isPast, isToday, isOperational } = getDateInfo(dateStr);
          
          const isAbsent = absentDates.includes(dateStr);
          const hasMemo = !!calendarMemos[dateStr];
          const hasEvent = eventHistory.includes(dateStr);

          let bgColor = 'bg-white';
          let textColor = 'text-black';
          let borderColor = 'border-gray-100';

          if (isToday) {
            borderColor = 'border-[#007AFF] border-2';
          } else if (isPast) {
            textColor = 'text-gray-300';
          } else if (!isOperational) {
            bgColor = 'bg-gray-50';
            textColor = 'text-gray-400';
          } else {
            bgColor = 'bg-[#34C759]/5';
            textColor = 'text-[#34C759]';
            borderColor = 'border-[#34C759]/20';
          }

          if (isAbsent) {
            bgColor = 'bg-[#FF3B30]';
            textColor = 'text-white';
            borderColor = 'border-transparent';
          }

          return (
            <button 
              key={dateStr} 
              onClick={() => handleDateClick(dateStr)} 
              className={`h-10 text-[11px] font-bold border transition-all rounded-lg relative flex flex-col items-center justify-center ${bgColor} ${textColor} ${borderColor}`}
            >
              <span>{day}</span>
              {/* 
                [수정 요구사항 반영] 
                학생/학부모 달력에서는 랜덤 미탑승 이벤트(hasEvent)로 인한 빨간 점 표시를 제거함.
                오직 사용자가 직접 설정한 미탑승(isAbsent) 상태일 때만 점이 표시되도록 조건을 변경.
                오늘 날짜(!isToday) 조건은 유지.
              */}
              {!isToday && isAbsent && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm"></div>
              )}
              {hasMemo && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isAbsent ? 'bg-white' : 'bg-gray-300'}`}></div>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold text-gray-400">
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> 미탑승 발생</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#34C759] rounded-full"></div> 운행 예정</div>
      </div>

      {showActionModal && selectedDate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-[14px] w-full max-w-[280px] overflow-hidden flex flex-col items-stretch animate-slide-up shadow-2xl">
            <div className="p-4 text-center border-b border-[#C6C6C8]">
              <h3 className="text-[17px] font-semibold text-black leading-tight">선택하세요</h3>
              <p className="text-[13px] text-gray-500 mt-1">{selectedDate}</p>
            </div>
            
            <button onClick={handleSelectSkip} className={`py-3 text-[17px] font-medium border-b border-[#C6C6C8] active:bg-gray-100 ${!getDateInfo(selectedDate).isOperational ? 'text-gray-300' : 'text-[#007AFF]'}`}>미탑승 신청/취소</button>
            <button onClick={() => { setShowActionModal(false); setShowMemoInput(true); setMemoInput(calendarMemos[selectedDate!] || ''); }} className="py-3 text-[17px] text-[#007AFF] font-medium border-b border-[#C6C6C8] active:bg-gray-100">메모하기</button>
            <button onClick={() => { setShowActionModal(false); setSelectedDate(null); }} className="py-3 text-[17px] text-[#FF3B30] font-normal active:bg-gray-100">취소</button>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showConfirmModal}
        title={absentDates.includes(selectedDate!) ? "취소 확인" : "신청 확인"}
        description={absentDates.includes(selectedDate!) ? `${selectedDate}에 미탑승을 취소하시겠습니까?` : `${selectedDate}에 미탑승을 신청하시겠습니까?`}
        onConfirm={() => { onDateSelect(selectedDate!); setShowConfirmModal(false); setSelectedDate(null); }}
        onCancel={() => setShowConfirmModal(false)}
      />

      {showMemoInput && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-6 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-t-[20px] rounded-b-[14px] w-full max-w-[420px] p-6 animate-slide-up shadow-2xl">
            <h3 className="text-[17px] font-bold mb-4">{selectedDate} 메모</h3>
            <textarea autoFocus value={memoInput} onChange={(e) => setMemoInput(e.target.value)} className="w-full h-32 p-4 bg-[#F2F2F7] rounded-xl text-[15px] focus:outline-none resize-none mb-4" placeholder="메모를 입력하세요..." />
            <div className="flex gap-3">
              <button onClick={() => setShowMemoInput(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl">취소</button>
              <button onClick={() => { onUpdateMemo(selectedDate!, memoInput); setShowMemoInput(false); setSelectedDate(null); }} className="flex-1 py-4 bg-[#007AFF] text-white font-bold rounded-xl">저장</button>
            </div>
          </div>
        </div>
      )}
      <Modal isOpen={!!errorModal} title="안내" description={errorModal || ''} onConfirm={() => setErrorModal(null)} hideCancel />
    </div>
  );
};

export default MiniCalendar;

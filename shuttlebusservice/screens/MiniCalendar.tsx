
import React, { useState } from 'react';
import { NON_OPERATION_DATES } from '../constants';
import Modal from '../components/Modal';

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
  
  const boardingSchedule = [1, 3, 4]; // 월, 수, 목
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [memoInput, setMemoInput] = useState('');
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const getWeeklyDays = () => {
    const todayIndex = days.findIndex(d => d === today.getDate());
    if (todayIndex === -1) return days.slice(0, 7);
    const startIdx = Math.max(0, todayIndex - (todayIndex % 7));
    return days.slice(startIdx, startIdx + 7);
  };

  const displayedDays = viewMode === 'month' ? days : getWeeklyDays();

  // 3) 날짜 클릭 시 액션 선택 모달 먼저 표시
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowActionModal(true);
  };

  // 2) 오늘 날짜 달력 신청 제한 로직
  const handleSelectSkip = () => {
    if (selectedDate === todayStr) {
      setShowActionModal(false);
      setErrorModal("오늘 날짜는 달력에서 미탑승 신청/취소가 불가능합니다.");
      return;
    }
    setShowActionModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmSkip = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
    }
    setShowConfirmModal(false);
    setSelectedDate(null);
  };

  const handleSelectMemo = () => {
    setShowActionModal(false);
    if (selectedDate) {
      setMemoInput(calendarMemos[selectedDate] || '');
      setShowMemoInput(true);
    }
  };

  const saveMemo = () => {
    if (selectedDate) {
      onUpdateMemo(selectedDate, memoInput);
      setShowMemoInput(false);
      setSelectedDate(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[13px] font-bold text-black tracking-tight">탑승 일정 관리</h4>
        <button 
          onClick={onToggleView}
          className="w-8 h-8 flex items-center justify-center bg-[#F2F2F7] rounded-full active:scale-90 transition-transform"
        >
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
          const dateObj = new Date(year, month, day);
          const actualDayOfWeek = dateObj.getDay();
          
          // 4) 달력 상태 연동
          const isForcedHoliday = NON_OPERATION_DATES.includes(dateStr);
          const isScheduled = boardingSchedule.includes(actualDayOfWeek) && !isForcedHoliday;
          const isAbsent = absentDates.includes(dateStr);
          const isPast = dateObj < today;
          const isToday = dateStr === todayStr;
          const hasMemo = !!calendarMemos[dateStr];

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(dateStr)}
              className={`
                h-10 text-[11px] font-bold border transition-all rounded-lg relative flex flex-col items-center justify-center
                ${isAbsent ? 'bg-[#FF3B30] text-white border-transparent' : 
                  isForcedHoliday ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' :
                  isScheduled ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 
                  'bg-white text-gray-300 border-transparent'}
                ${isPast && isScheduled && !isAbsent ? 'opacity-40' : ''}
                ${isToday ? 'border-[#007AFF] border-2' : ''}
              `}
            >
              <span>{day}</span>
              {hasMemo && <div className="absolute top-1 right-1 w-1 h-1 bg-current rounded-full"></div>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#34C759]/20 border border-[#34C759]/40 rounded-sm"></div> 탑승일</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FF3B30] rounded-sm"></div> 미탑승</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-gray-100 rounded-sm"></div> 미운행</div>
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div> 메모</div>
      </div>

      {/* 3) 액션 선택 모달 */}
      {showActionModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-[14px] w-full max-w-[280px] overflow-hidden flex flex-col items-stretch animate-slide-up shadow-2xl">
            <div className="p-4 text-center border-b border-[#C6C6C8]">
              <h3 className="text-[17px] font-semibold text-black leading-tight">선택하세요</h3>
              <p className="text-[13px] text-gray-500 mt-1">{selectedDate}</p>
            </div>
            
            <button 
              onClick={handleSelectSkip}
              className="py-3 text-[17px] text-[#007AFF] font-medium border-b border-[#C6C6C8] active:bg-gray-100"
            >
              미탑승 신청/취소
            </button>
            <button 
              onClick={handleSelectMemo}
              className="py-3 text-[17px] text-[#007AFF] font-medium border-b border-[#C6C6C8] active:bg-gray-100"
            >
              메모하기
            </button>
            <button 
              onClick={() => { setShowActionModal(false); setSelectedDate(null); }}
              className="py-3 text-[17px] text-[#FF3B30] font-normal active:bg-gray-100"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 신청 확인 모달 */}
      <Modal 
        isOpen={showConfirmModal}
        title="신청 확인"
        description={`${selectedDate}에 미탑승 하시겠습니까?`}
        onConfirm={handleConfirmSkip}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* 메모 입력 UI */}
      {showMemoInput && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-6 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-t-[20px] rounded-b-[14px] w-full max-w-[420px] p-6 animate-slide-up shadow-2xl">
            <h3 className="text-[17px] font-bold mb-4">{selectedDate} 메모</h3>
            <textarea
              autoFocus
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              className="w-full h-32 p-4 bg-[#F2F2F7] rounded-xl text-[15px] focus:outline-none resize-none mb-4"
              placeholder="메모를 입력하세요..."
            />
            <div className="flex gap-3">
              <button onClick={() => setShowMemoInput(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl">취소</button>
              <button onClick={saveMemo} className="flex-1 py-4 bg-[#007AFF] text-white font-bold rounded-xl">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 2) 에러 안내 모달 */}
      <Modal 
        isOpen={!!errorModal} 
        title="안내" 
        description={errorModal || ''} 
        onConfirm={() => setErrorModal(null)} 
        hideCancel 
      />
    </div>
  );
};

export default MiniCalendar;

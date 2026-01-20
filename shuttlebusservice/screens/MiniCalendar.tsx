
import React from 'react';
import { NON_OPERATION_DATES } from '../constants';
import Modal from '../components/Modal';

interface MiniCalendarProps {
  absentDates: string[];
  onDateSelect: (date: string) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ absentDates, onDateSelect }) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const boardingSchedule = [1, 3, 4]; // 월, 수, 목
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const [errorModal, setErrorModal] = React.useState<string | null>(null);

  const handleDateClick = (dateStr: string, isPast: boolean, isForcedHoliday: boolean) => {
    if (isPast) {
      setErrorModal('이전 날짜에는 설정할 수 없습니다.');
      return;
    }
    if (isForcedHoliday) {
      setErrorModal('해당 날짜는 셔틀 미운행일입니다.');
      return;
    }
    onDateSelect(dateStr);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-8"></div>;
          
          const date = new Date(year, month, day);
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayOfWeek = idx % 7;
          
          // 1️⃣ 강제 미운행 날짜 체크: 하드코딩된 예외 배열 확인
          const isForcedHoliday = NON_OPERATION_DATES.includes(dateStr);
          
          // 1️⃣ 미운행일인 경우 탑승일 로직(월수목)에서 제외
          const isScheduled = boardingSchedule.includes(dayOfWeek) && !isForcedHoliday;
          
          const isAbsent = absentDates.includes(dateStr);
          const isPast = date < today;

          return (
            <button
              key={dateStr}
              onClick={() => isScheduled && handleDateClick(dateStr, isPast, isForcedHoliday)}
              className={`
                h-8 text-[11px] font-bold border transition-all rounded-lg
                ${isAbsent ? 'bg-[#FF3B30] text-white border-transparent' : 
                  isForcedHoliday ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' :
                  isScheduled ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 
                  'bg-white text-gray-300 border-transparent cursor-default'}
                ${isPast && isScheduled ? 'opacity-40' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#34C759]/20 border border-[#34C759]/40 rounded-sm"></div> 탑승일</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FF3B30] rounded-sm"></div> 미탑승</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-gray-100 rounded-sm"></div> 미운행</div>
      </div>

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

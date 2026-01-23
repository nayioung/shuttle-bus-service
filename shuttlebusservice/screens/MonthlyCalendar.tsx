
import React, { useMemo, useEffect } from 'react';
import { NON_OPERATION_DATES } from '../constants';
import { getEventHistory, getPersistedStudentCounts } from '../helpers';

interface MonthlyCalendarProps {
  onDateSelect: (date: string) => void;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ onDateSelect }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // [사전 렌더링 로직] 기사 화면 달력 진입 시 해당 월의 모든 날짜 데이터를 선행 로드함
  useEffect(() => {
    days.forEach(day => {
      if (day) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // 데이터가 없으면 생성하고 있으면 로드만 함 (내부에서 markEventDate 실행으로 점 데이터 확정)
        getPersistedStudentCounts(dateStr);
      }
    });
  }, [year, month]);

  // 히스토리 기반 이벤트 목록 로드
  const eventHistory = getEventHistory();

  return (
    <div className="w-full">
      <div className="mb-4">
        <h4 className="text-[13px] font-bold text-black tracking-tight">운행 일정 관리 ({month + 1}월)</h4>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400">{d}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-10"></div>;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isNonOp = NON_OPERATION_DATES.includes(dateStr);
          const isToday = day === today.getDate();
          const hasEvent = eventHistory.includes(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`
                h-10 text-[11px] font-bold border transition-all rounded-lg flex items-center justify-center relative
                ${isNonOp ? 'bg-gray-50 text-gray-300 border-transparent' : 'bg-[#F2F2F7] text-black border-transparent active:bg-gray-200'}
                ${isToday ? 'border-[#007AFF] border-2 bg-white' : ''}
              `}
            >
              {day}
              {/* [빨간 점 렌더링 조건] 오늘이 아니고(!isToday), 히스토리에 미탑승 이벤트 기록이 있는 경우 */}
              {!isToday && hasEvent && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#F2F2F7] rounded-sm"></div> 운행일</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-gray-50 rounded-sm"></div> 미운행</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-[#007AFF] bg-white rounded-sm"></div> 오늘</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div> 미탑승</div>
      </div>
    </div>
  );
};

export default MonthlyCalendar;

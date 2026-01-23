
export const formatHHMMSS = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const parseDigits = (val: string) => val.replace(/[^0-9]/g, '');

export const formatPhone = (digits: string) => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

export const getDayOfWeek = (date: Date) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
};

import { SHUTTLE_STOPS } from './constants';

/**
 * 전역 기본 인원수(Base Counts) 로드/생성
 * 모든 날짜의 인원수 일관성을 위해 한 번 생성된 후 고정됨.
 */
const getBaseStudentCounts = (): Record<number, number> => {
  const key = 'shuttle_base_counts_v3';
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);

  const newBase: Record<number, number> = {};
  SHUTTLE_STOPS.forEach(stop => {
    // 목적지(대치학원) 외 모든 정류장에 1~3명 랜덤 배정
    newBase[stop.id] = stop.isDestination ? 0 : Math.floor(Math.random() * 3) + 1;
  });
  localStorage.setItem(key, JSON.stringify(newBase));
  return newBase;
};

/**
 * 날짜별 데이터 로드/생성 (v3)
 * [수정 사항] 오늘 날짜(Today)에는 랜덤 미탑승 이벤트를 절대 생성하지 않음 (분기 처리 위치)
 */
export const getPersistedStudentCounts = (date: string): { 
  counts: Record<number, number>, 
  hasAbsence: boolean,
  targetStopId: number | null 
} => {
  const todayStr = new Date().toISOString().split('T')[0];
  const key = `shuttle_date_data_v3_${date}`;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);

  const baseCounts = getBaseStudentCounts();
  let hasAbsence = false;
  let targetStopId = null;

  // [핵심 분기 처리] 오늘(today)이 아닌 날짜에만 40% 확률로 랜덤 미탑승 이벤트 생성
  if (date !== todayStr) {
    hasAbsence = Math.random() < 0.4;
    // 미탑승 정류장 후보: 아름(2), 탑(3), 봇들(4)
    const stopOptions = [2, 3, 4]; 
    targetStopId = hasAbsence ? stopOptions[Math.floor(Math.random() * stopOptions.length)] : null;
  } else {
    // 오늘 날짜인 경우 무조건 false (랜덤 미탑승 발생 금지)
    hasAbsence = false;
    targetStopId = null;
  }

  // 최종 인원수 계산: 기본 인원 - (미탑승 시 1명 차감)
  const finalCounts = { ...baseCounts };
  if (hasAbsence && targetStopId) {
    finalCounts[targetStopId] = Math.max(0, finalCounts[targetStopId] - 1);
  }

  const data = { counts: finalCounts, hasAbsence, targetStopId };
  localStorage.setItem(key, JSON.stringify(data));
  
  // 달력 점 표시를 위한 히스토리 기록 (사전 렌더링 시 이 함수가 미리 호출되어 점이 찍힘)
  if (hasAbsence) {
    markEventDate(date);
  }

  return data;
};

export const updatePersistedStudentCounts = (date: string, counts: Record<number, number>) => {
  const key = `shuttle_date_data_v3_${date}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    const data = JSON.parse(saved);
    data.counts = counts;
    localStorage.setItem(key, JSON.stringify(data));
  }
};

/**
 * 이벤트 발생 날짜 히스토리 관리
 */
export const markEventDate = (date: string) => {
  const saved = localStorage.getItem('shuttle_event_history');
  const history: string[] = saved ? JSON.parse(saved) : [];
  if (!history.includes(date)) {
    history.push(date);
    localStorage.setItem('shuttle_event_history', JSON.stringify(history));
  }
};

export const getEventHistory = (): string[] => {
  const saved = localStorage.getItem('shuttle_event_history');
  return saved ? JSON.parse(saved) : [];
};

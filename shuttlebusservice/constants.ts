
import { ShuttleStop, Notice } from './types';

export const SHUTTLE_STOPS: ShuttleStop[] = [
  { id: 1, name: '이매촌', timeOffset: 0 },
  { id: 2, name: '아름마을', timeOffset: 30, isBoarding: true },
  { id: 3, name: '탑마을', timeOffset: 60 },
  { id: 4, name: '봇들마을', timeOffset: 90 },
  { id: 5, name: '대치학원', timeOffset: 150, isDestination: true },
];

export const SHUTTLE_INFO = {
  name: '분당 1코스',
  driverName: '김기사',
  driverPhone: '010-1234-5678',
  carNumber: '000가 0000',
  destination: '대치학원'
};

export const NOTICES: Notice[] = [
  {
    id: 1,
    title: '<셔틀버스 휴무 안내>',
    content: '기사님 개인사정으로 1월 28일 미운행합니다. 이용에 착오 없으시길 바랍니다.',
    date: '2025-01-20'
  }
];

// 1️⃣ 강제 미운행 날짜 예외 처리 상수
// 요구사항에 따라 2024-01-28 또는 2025-01-28 등 특정 날짜를 하드코딩 처리
export const NON_OPERATION_DATES = ['2024-01-28', '2025-01-28'];

// 달력 연동용 (기존 유지)
export const HOLIDAYS = [...NON_OPERATION_DATES];

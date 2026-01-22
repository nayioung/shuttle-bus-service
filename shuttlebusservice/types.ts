
export enum UserRole {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  DRIVER = 'DRIVER'
}

export enum Screen {
  START = 'START',
  INFO_INPUT = 'INFO_INPUT',
  SHUTTLE_SELECT = 'SHUTTLE_SELECT',
  MAIN_DASHBOARD = 'MAIN_DASHBOARD',
  CHAT = 'CHAT',
  MY_PAGE = 'MY_PAGE',
  DRIVER_PREPARE = 'DRIVER_PREPARE',
  NOTICE_LIST = 'NOTICE_LIST',
  NOTICE_DETAIL = 'NOTICE_DETAIL'
}

export interface UserData {
  role: UserRole | null;
  studentName: string;
  studentPhone: string;
  parentPhone: string;
  isApplied: boolean;
  selectedShuttleId?: string; // 2) 선택된 셔틀 ID 저장
}

export interface SessionState {
  t0: number | null;
  lateCount: number;
  absentDates: string[];
  isLateRequested: boolean;
  isAbsentRequested: boolean;
  hasRandomDelay: boolean;
  calendarMemos: Record<string, string>; // 6) 날짜별 메모 저장 (YYYY-MM-DD: string)
  calendarViewMode: 'week' | 'month'; // 9) 달력 보기 모드
}

export interface ShuttleStop {
  id: number;
  name: string;
  timeOffset: number;
  isBoarding?: boolean;
  isDestination?: boolean;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
}

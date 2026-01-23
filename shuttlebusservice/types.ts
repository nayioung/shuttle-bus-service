
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
  DRIVER_HOME = 'DRIVER_HOME',
  DRIVER_ROUTE_DETAIL = 'DRIVER_ROUTE_DETAIL',
  NOTICE_LIST = 'NOTICE_LIST',
  NOTICE_DETAIL = 'NOTICE_DETAIL'
}

export interface UserData {
  role: UserRole | null;
  studentName: string;
  studentPhone: string;
  parentPhone: string;
  isApplied: boolean;
  selectedShuttleId?: string;
}

export interface SessionState {
  t0: number | null;
  lateCount: number;
  absentDates: string[];
  isLateRequested: boolean;
  isAbsentRequested: boolean;
  hasRandomDelay: boolean;
  calendarMemos: Record<string, string>;
  calendarViewMode: 'week' | 'month';
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


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
}

export interface SessionState {
  t0: number | null;
  lateCount: number; // monthly count
  absentDates: string[]; // YYYY-MM-DD
  isLateRequested: boolean;
  isAbsentRequested: boolean;
  hasRandomDelay: boolean;
}

export interface ShuttleStop {
  id: number;
  name: string;
  timeOffset: number; // seconds from T0
  isBoarding?: boolean;
  isDestination?: boolean;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
}

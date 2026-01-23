
import React, { useState, useEffect } from 'react';
import { UserRole, Screen, UserData, Notice } from './types';
import StartScreen from './screens/StartScreen';
import InfoScreen from './screens/InfoScreen';
import ShuttleSelectScreen from './screens/ShuttleSelectScreen';
import MainDashboard from './screens/MainDashboard';
import ChatScreen from './screens/ChatScreen';
import MyPage from './screens/MyPage';
import DriverHome from './screens/DriverHome';
import RouteDetailByDate from './screens/RouteDetailByDate';
import { NoticeList, NoticeDetail } from './screens/NoticeScreens';
import { NOTICES as INITIAL_NOTICES } from './constants';

const performV1Backup = () => {
  if (!localStorage.getItem("shuttle_app_backup_v1")) {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) backupData[key] = localStorage.getItem(key) || "";
    }
    localStorage.setItem("shuttle_app_backup_v1", JSON.stringify(backupData));
  }
};

(window as any).restoreFromBackup = () => {
  const snap = JSON.parse(localStorage.getItem("shuttle_app_backup_v1") || "{}");
  if (Object.keys(snap).length === 0) {
    alert("백업 데이터가 없습니다.");
    return;
  }
  localStorage.clear();
  Object.entries(snap).forEach(([k, v]) => localStorage.setItem(k, v as string));
  window.location.reload();
};

const INITIAL_USER_DATA: UserData = { 
  role: null, 
  studentName: '', 
  studentPhone: '', 
  parentPhone: '', 
  isApplied: false, 
  selectedShuttleId: 'shuttle_1' 
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.START);
  const [searchEntrySource, setSearchEntrySource] = useState<'DROPDOWN' | 'MYPAGE'>('MYPAGE');
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [driverSelectedDate, setDriverSelectedDate] = useState<string | null>(null);
  
  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('shuttle_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('shuttle_user_data');
    return saved ? JSON.parse(saved) : INITIAL_USER_DATA;
  });

  useEffect(() => {
    performV1Backup();
  }, []);

  useEffect(() => {
    localStorage.setItem('shuttle_user_data', JSON.stringify(userData));
    localStorage.setItem('shuttle_notices', JSON.stringify(notices));
    
    // 신분 정보가 있고 신청까지 완료된 경우에만 자동 화면 전환
    if (userData.isApplied && screen === Screen.START) {
      if (userData.role === UserRole.DRIVER) {
        setScreen(Screen.DRIVER_HOME);
      } else {
        setScreen(Screen.MAIN_DASHBOARD);
      }
    }
  }, [userData, screen, notices]);

  const handleRoleSelect = (role: UserRole) => {
    setUserData(prev => ({ ...prev, role }));
    if (role === UserRole.DRIVER) {
      setUserData(prev => ({ ...prev, role, isApplied: true }));
      setScreen(Screen.DRIVER_HOME);
    } else {
      setScreen(Screen.INFO_INPUT);
    }
  };

  const handleInfoSubmit = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
    setScreen(Screen.SHUTTLE_SELECT);
    setSearchEntrySource('MYPAGE');
  };

  const handleAddNotice = (title: string, content: string) => {
    const newNotice: Notice = {
      id: Date.now(),
      title,
      content,
      date: new Date().toISOString().split('T')[0]
    };
    setNotices(prev => [newNotice, ...prev]);
  };

  // 로그아웃 로직: 상태 초기화 및 저장 데이터 삭제
  const handleLogout = () => {
    localStorage.removeItem('shuttle_user_data');
    localStorage.removeItem('shuttle_session_state');
    setUserData(INITIAL_USER_DATA);
    setScreen(Screen.START);
  };

  const renderScreen = () => {
    const commonNoticeProps = {
      onBack: () => setScreen(userData.role === UserRole.DRIVER ? Screen.DRIVER_HOME : Screen.MAIN_DASHBOARD),
      onSelectNotice: (id: number) => {
        setSelectedNoticeId(id);
        setScreen(Screen.NOTICE_DETAIL);
      }
    };

    switch (screen) {
      case Screen.START: return <StartScreen onSelect={handleRoleSelect} />;
      case Screen.INFO_INPUT: return <InfoScreen onNext={handleInfoSubmit} />;
      case Screen.SHUTTLE_SELECT: return (
        <ShuttleSelectScreen 
          onApply={() => {
            setUserData(prev => ({ ...prev, isApplied: true, selectedShuttleId: 'shuttle_1' }));
            localStorage.removeItem('shuttle_session_state'); // 세션 초기화하여 당일 상태 리셋
            setScreen(Screen.MAIN_DASHBOARD);
          }} 
          onBack={() => setScreen(searchEntrySource === 'DROPDOWN' ? Screen.MAIN_DASHBOARD : Screen.MY_PAGE)}
        />
      );
      case Screen.MAIN_DASHBOARD: 
        return <MainDashboard 
          userData={userData} 
          setUserData={setUserData}
          notices={notices}
          onGoToMyPage={() => setScreen(Screen.MY_PAGE)} 
          onGoToChat={() => setScreen(Screen.CHAT)}
          onGoToNotices={() => setScreen(Screen.NOTICE_LIST)}
          onAddRoute={() => { setSearchEntrySource('DROPDOWN'); setScreen(Screen.SHUTTLE_SELECT); }}
          onSelectNotice={(id) => { setSelectedNoticeId(id); setScreen(Screen.NOTICE_DETAIL); }}
        />;
      case Screen.DRIVER_HOME:
        return <DriverHome 
          onLogout={handleLogout} 
          onGoToNotices={() => setScreen(Screen.NOTICE_LIST)} 
          onAddNotice={handleAddNotice}
          onSelectDate={(date) => {
            setDriverSelectedDate(date);
            setScreen(Screen.DRIVER_ROUTE_DETAIL);
          }}
        />;
      case Screen.DRIVER_ROUTE_DETAIL:
        return <RouteDetailByDate 
          date={driverSelectedDate || ""} 
          onBack={() => setScreen(Screen.DRIVER_HOME)} 
        />;
      case Screen.CHAT: return <ChatScreen onBack={() => setScreen(Screen.MAIN_DASHBOARD)} />;
      case Screen.MY_PAGE: return <MyPage userData={userData} setUserData={setUserData} onLogout={handleLogout} onBack={() => setScreen(Screen.MAIN_DASHBOARD)} onSearchShuttle={() => { setSearchEntrySource('MYPAGE'); setScreen(Screen.SHUTTLE_SELECT); }} />;
      case Screen.NOTICE_LIST: return <NoticeList {...commonNoticeProps} notices={notices} />;
      case Screen.NOTICE_DETAIL: 
        const notice = notices.find(n => n.id === selectedNoticeId);
        return <NoticeDetail onBack={() => setScreen(Screen.NOTICE_LIST)} notice={notice || notices[0]} />;
      default: return null;
    }
  };

  return <div className="min-h-screen bg-[#F2F2F7] flex justify-center">{renderScreen()}</div>;
};

export default App;

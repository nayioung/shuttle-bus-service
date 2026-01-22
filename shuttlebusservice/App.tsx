
import React, { useState, useEffect } from 'react';
import { UserRole, Screen, UserData, Notice } from './types';
import StartScreen from './screens/StartScreen';
import InfoScreen from './screens/InfoScreen';
import ShuttleSelectScreen from './screens/ShuttleSelectScreen';
import MainDashboard from './screens/MainDashboard';
import ChatScreen from './screens/ChatScreen';
import MyPage from './screens/MyPage';
import { NoticeList, NoticeDetail } from './screens/NoticeScreens';
import { NOTICES } from './constants';

/**
 * 0) 백업 및 복구 로직
 * 수정 전 상태를 스냅샷으로 저장하여 문제 발생 시 복구할 수 있도록 합니다.
 */
const performBackup = () => {
  if (!localStorage.getItem("APP_BACKUP_SNAPSHOT")) {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) backupData[key] = localStorage.getItem(key) || "";
    }
    localStorage.setItem("APP_BACKUP_SNAPSHOT", JSON.stringify(backupData));
    localStorage.setItem("APP_BACKUP_VERSION", "v_embedded_base64_from_txt_oneline");
    console.log("Backup created: v_embedded_base64_from_txt_oneline");
  }
};

// 🔁 수동 복구 필요 시 브라우저 콘솔에서 실행:
/*
  const snap = JSON.parse(localStorage.getItem("APP_BACKUP_SNAPSHOT") || "{}");
  localStorage.clear();
  Object.entries(snap).forEach(([k, v]) => localStorage.setItem(k, v as string));
  window.location.reload();
*/

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.START);
  const [searchEntrySource, setSearchEntrySource] = useState<'DROPDOWN' | 'MYPAGE'>('MYPAGE');
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('shuttle_user_data');
    return saved ? JSON.parse(saved) : { role: null, studentName: '', studentPhone: '', parentPhone: '', isApplied: false, selectedShuttleId: 'shuttle_1' };
  });

  useEffect(() => {
    performBackup();
  }, []);

  useEffect(() => {
    localStorage.setItem('shuttle_user_data', JSON.stringify(userData));
    if (userData.isApplied && screen === Screen.START) {
      setScreen(Screen.MAIN_DASHBOARD);
    }
  }, [userData, screen]);

  const handleRoleSelect = (role: UserRole) => {
    setUserData(prev => ({ ...prev, role }));
    setScreen(Screen.INFO_INPUT);
  };

  const handleInfoSubmit = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
    setScreen(Screen.SHUTTLE_SELECT);
    setSearchEntrySource('MYPAGE');
  };

  const handleApplySuccess = () => {
    setUserData(prev => ({ ...prev, isApplied: true, selectedShuttleId: 'shuttle_1' }));
    localStorage.removeItem('shuttle_session_state');
    setScreen(Screen.MAIN_DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('shuttle_user_data');
    localStorage.removeItem('shuttle_session_state');
    setUserData({ role: null, studentName: '', studentPhone: '', parentPhone: '', isApplied: false, selectedShuttleId: 'shuttle_1' });
    setScreen(Screen.START);
  };

  const renderScreen = () => {
    const commonNoticeProps = {
      onBack: () => setScreen(Screen.MAIN_DASHBOARD),
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
          onApply={handleApplySuccess} 
          onBack={() => setScreen(searchEntrySource === 'DROPDOWN' ? Screen.MAIN_DASHBOARD : Screen.MY_PAGE)}
        />
      );
      case Screen.MAIN_DASHBOARD: 
        return <MainDashboard 
          userData={userData} 
          setUserData={setUserData}
          onGoToMyPage={() => setScreen(Screen.MY_PAGE)} 
          onGoToChat={() => setScreen(Screen.CHAT)}
          onGoToNotices={() => setScreen(Screen.NOTICE_LIST)}
          onAddRoute={() => {
            setSearchEntrySource('DROPDOWN');
            setScreen(Screen.SHUTTLE_SELECT);
          }}
          onSelectNotice={(id) => {
            setSelectedNoticeId(id);
            setScreen(Screen.NOTICE_DETAIL);
          }}
        />;
      case Screen.CHAT: return <ChatScreen onBack={() => setScreen(Screen.MAIN_DASHBOARD)} />;
      case Screen.MY_PAGE: return <MyPage userData={userData} setUserData={setUserData} onLogout={handleLogout} onBack={() => setScreen(Screen.MAIN_DASHBOARD)} onSearchShuttle={() => {
        setSearchEntrySource('MYPAGE');
        setScreen(Screen.SHUTTLE_SELECT);
      }} />;
      case Screen.NOTICE_LIST: return <NoticeList {...commonNoticeProps} notices={NOTICES} />;
      case Screen.NOTICE_DETAIL: 
        const notice = NOTICES.find(n => n.id === selectedNoticeId);
        return <NoticeDetail onBack={() => setScreen(Screen.NOTICE_LIST)} notice={notice || NOTICES[0]} />;
      default: return null;
    }
  };

  return <div className="min-h-screen bg-[#F2F2F7] flex justify-center">{renderScreen()}</div>;
};

export default App;

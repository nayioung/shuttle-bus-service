
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
 * [BACKUP_VERSION: v_before_dropoff_label_and_alignment_fix_20250523_1800]
 * 
 * ROLLBACK (manual):
 * 사용자가 "되돌려줘"라고 요청할 경우 브라우저 콘솔에서 아래 코드를 실행하십시오.
 * 
 * const snap = JSON.parse(localStorage.getItem("APP_BACKUP_SNAPSHOT") || "{}");
 * localStorage.clear();
 * Object.entries(snap).forEach(([k, v]) => localStorage.setItem(k, v));
 * window.location.reload();
 */

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.START);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('shuttle_user_data');
    return saved ? JSON.parse(saved) : { role: null, studentName: '', studentPhone: '', parentPhone: '', isApplied: false };
  });

  useEffect(() => {
    // 0-1. localStorage 스냅샷 백업 (최초 1회)
    if (!localStorage.getItem("APP_BACKUP_SNAPSHOT")) {
      const currentData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith("APP_BACKUP")) {
          currentData[key] = localStorage.getItem(key) || "";
        }
      }
      localStorage.setItem("APP_BACKUP_SNAPSHOT", JSON.stringify(currentData));
      localStorage.setItem("APP_BACKUP_VERSION", "v_before_dropoff_label_and_alignment_fix");
      console.log("BACKUP: 스냅샷이 생성되었습니다 (v_before_dropoff_label_and_alignment_fix).");
    }
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
  };

  const handleApplySuccess = () => {
    setUserData(prev => ({ ...prev, isApplied: true }));
    localStorage.removeItem('shuttle_session_state');
    setScreen(Screen.MAIN_DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('shuttle_user_data');
    localStorage.removeItem('shuttle_session_state');
    setUserData({ role: null, studentName: '', studentPhone: '', parentPhone: '', isApplied: false });
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
      case Screen.SHUTTLE_SELECT: return <ShuttleSelectScreen onApply={handleApplySuccess} onBack={() => setScreen(userData.isApplied ? Screen.MAIN_DASHBOARD : Screen.INFO_INPUT)} />;
      case Screen.MAIN_DASHBOARD: 
        return <MainDashboard 
          userData={userData} 
          onGoToMyPage={() => setScreen(Screen.MY_PAGE)} 
          onGoToChat={() => setScreen(Screen.CHAT)}
          onGoToNotices={() => setScreen(Screen.NOTICE_LIST)}
          onSelectNotice={(id) => {
            setSelectedNoticeId(id);
            setScreen(Screen.NOTICE_DETAIL);
          }}
        />;
      case Screen.CHAT: return <ChatScreen onBack={() => setScreen(Screen.MAIN_DASHBOARD)} />;
      case Screen.MY_PAGE: return <MyPage userData={userData} setUserData={setUserData} onLogout={handleLogout} onBack={() => setScreen(Screen.MAIN_DASHBOARD)} onSearchShuttle={() => setScreen(Screen.SHUTTLE_SELECT)} />;
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

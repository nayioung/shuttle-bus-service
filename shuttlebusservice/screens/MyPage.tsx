
import React, { useState } from 'react';
import { UserData, UserRole, SessionState } from '../types';
import { SHUTTLE_INFO } from '../constants';
import { formatHHMMSS } from '../helpers';
import InputPhone from '../components/InputPhone';

interface MyPageProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onLogout: () => void;
  onBack: () => void;
  onSearchShuttle: () => void;
}

const MyPage: React.FC<MyPageProps> = ({ userData, setUserData, onLogout, onBack, onSearchShuttle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userData.studentName);
  const [editSPhone, setEditSPhone] = useState({ value: userData.studentPhone, valid: true });
  const [editPPhone, setEditPPhone] = useState({ value: userData.parentPhone, valid: true });

  const session: SessionState = JSON.parse(localStorage.getItem('shuttle_session_state') || '{}');
  const t0 = session.t0 || Date.now();
  const totalDelay = (session.hasRandomDelay ? 20 : 0) + (session.isLateRequested ? 20 : 0);
  const boardingTime = new Date(t0 + (30 + totalDelay) * 1000);

  const handleSave = () => {
    if (!editName.trim() || !editSPhone.valid || !editPPhone.valid) return;
    setUserData(prev => ({
      ...prev,
      studentName: editName,
      studentPhone: editSPhone.value,
      parentPhone: editPPhone.value
    }));
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] max-w-[420px] mx-auto w-full">
      {/* iOS Nav Bar */}
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#F2F2F7]/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="text-[#007AFF] text-[17px] font-normal">{"<"} 뒤로</button>
        <h2 className="text-[17px] font-bold">내 정보</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-[#007AFF] text-[17px] font-normal">편집</button>
        ) : (
          <button onClick={handleSave} className="text-[#007AFF] text-[17px] font-semibold">저장</button>
        )}
      </div>

      <div className="p-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center text-4xl mb-3 shadow-sm">👤</div>
        {!isEditing ? (
          <>
            <h3 className="text-2xl font-bold tracking-tight">{userData.studentName}</h3>
            <span className="text-[12px] text-gray-500 font-medium uppercase mt-1">
              {userData.role === UserRole.STUDENT ? '학생 회원' : '학부모 회원'}
            </span>
          </>
        ) : (
          <div className="w-full max-w-[200px] mt-4">
             <input 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-center p-2 border border-gray-300 rounded-lg font-bold bg-white"
              placeholder="이름 입력"
             />
          </div>
        )}
      </div>

      <div className="px-5 space-y-6 flex-1 overflow-y-auto pb-10">
        <div className="ios-card divide-y divide-gray-100 overflow-hidden">
          {!isEditing ? (
            <>
              <InfoRow label="학생 전화번호" value={userData.studentPhone} />
              <InfoRow label="학부모 전화번호" value={userData.parentPhone} />
              <InfoRow label="기사님 연락처" value={SHUTTLE_INFO.driverPhone} />
              <InfoRow label="차량 번호" value={SHUTTLE_INFO.carNumber} />
              <InfoRow label="탑승 위치" value="아름마을" />
              <InfoRow label="예상 승차 시간" value={formatHHMMSS(boardingTime)} />
            </>
          ) : (
            <div className="p-4 space-y-4">
              <InputPhone 
                label="학생 전화번호" 
                value={editSPhone.value} 
                onChange={(v, valid) => setEditSPhone({ value: v, valid })} 
              />
              <InputPhone 
                label="학부모 전화번호" 
                value={editPPhone.value} 
                onChange={(v, valid) => setEditPPhone({ value: v, valid })} 
              />
              <button onClick={() => setIsEditing(false)} className="w-full text-center text-[#FF3B30] text-[15px] font-medium pt-2">수정 취소</button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={onSearchShuttle}
            className="w-full py-4 bg-white text-black font-semibold text-[17px] ios-card active:bg-gray-50 transition-colors"
          >
            셔틀버스 노선 검색
          </button>
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-white text-[#FF3B30] font-semibold text-[17px] ios-card active:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center px-4 py-3.5 bg-white">
    <span className="text-[15px] text-gray-400 font-medium">{label}</span>
    <span className="text-[15px] font-semibold text-black">{value}</span>
  </div>
);

export default MyPage;

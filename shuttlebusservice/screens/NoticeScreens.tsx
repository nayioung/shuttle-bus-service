
import React from 'react';
import { Notice } from '../types';

/**
 * iOS 스타일 공통 내비게이션 바
 */
const IOSNavBar: React.FC<{ 
  title: string; 
  backLabel?: string; 
  onBack: () => void;
}> = ({ title, backLabel = "뒤로", onBack }) => (
  <div className="sticky top-0 bg-[#F2F2F7]/90 backdrop-blur-md border-b border-[#C6C6C8] z-50 h-[44px] flex items-center justify-between px-2">
    <button 
      onClick={onBack} 
      className="text-[#007AFF] text-[17px] flex items-center active:opacity-40 transition-opacity"
    >
      <span className="text-2xl mr-1 mb-0.5">‹</span>
      <span>{backLabel}</span>
    </button>
    <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-bold text-black truncate max-w-[50%]">
      {title}
    </h2>
    <div className="w-[60px]"></div> {/* 밸런스용 여백 */}
  </div>
);

/**
 * 공지사항 목록 화면 (iOS 설정 앱 스타일)
 */
interface NoticeListProps {
  onBack: () => void;
  notices: Notice[];
  onSelectNotice: (id: number) => void;
}

export const NoticeList: React.FC<NoticeListProps> = ({ onBack, notices, onSelectNotice }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] max-w-[420px] mx-auto w-full">
      <IOSNavBar title="공지사항" onBack={onBack} />

      <div className="p-4 space-y-8">
        {/* iOS Grouped Section */}
        <div className="bg-white rounded-[10px] overflow-hidden border border-[#D1D1D6]">
          {notices.map((notice, idx) => (
            <button 
              key={notice.id} 
              onClick={() => onSelectNotice(notice.id)}
              className="w-full flex items-center justify-between px-4 py-4 bg-white active:bg-[#D1D1D6] transition-colors text-left relative"
            >
              <div className="flex-1 min-w-0 pr-4">
                {/* 6) 제목 글씨 크기 조정 (18px) */}
                <h3 className="text-[18px] font-bold text-black leading-tight truncate tracking-tight">
                  {notice.title}
                </h3>
                <p className="text-[12px] text-gray-400 mt-1.5 font-bold uppercase tracking-wider">{notice.date}</p>
              </div>
              <div className="text-[#C6C6C8] text-[20px] font-light">›</div>
              
              {/* 셀 사이의 구분선 (마지막 항목 제외) */}
              {idx !== notices.length - 1 && (
                <div className="absolute bottom-0 left-4 right-0 h-[0.5px] bg-[#C6C6C8]"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 공지사항 상세 화면 (iOS 메모/설정 상세 스타일)
 */
interface NoticeDetailProps {
  onBack: () => void;
  notice: Notice;
}

export const NoticeDetail: React.FC<NoticeDetailProps> = ({ onBack, notice }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-[420px] mx-auto w-full">
      {/* 상세 화면에서는 이전 화면 이름(공지사항)을 백버튼 라벨로 사용 */}
      <IOSNavBar title="공지사항" backLabel="공지사항" onBack={onBack} />

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-[24px] font-black text-black leading-tight tracking-tight mb-2">
            {notice.title}
          </h1>
          <span className="text-[13px] font-bold text-[#007AFF] uppercase tracking-widest">
            {notice.date}
          </span>
        </div>
        
        {/* iOS Divider */}
        <div className="h-[0.5px] bg-[#C6C6C8] w-full mb-8"></div>

        <div className="text-[17px] text-black leading-[1.6] whitespace-pre-wrap font-medium">
          {notice.content}
        </div>
      </div>
    </div>
  );
};

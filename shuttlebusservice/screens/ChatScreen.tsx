
import React, { useState } from 'react';
import { SHUTTLE_INFO } from '../constants';

interface ChatScreenProps {
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ onBack }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'system', text: '기사님과 대화가 시작되었습니다.' },
    { id: 2, sender: 'driver', text: '안녕하세요, 곧 도착합니다!' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'user', text: input }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-white max-w-[420px] mx-auto w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="text-[#007AFF] text-[17px] font-normal">{"<"} 뒤로</button>
        <h2 className="text-[17px] font-bold">{SHUTTLE_INFO.driverName} 기사님</h2>
        <div className="w-[40px]"></div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F2F2F7]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'system' ? (
              <div className="mx-auto bg-gray-200/50 px-3 py-1 rounded-full text-[11px] text-gray-500 font-medium">
                {msg.text}
              </div>
            ) : (
              <div className={`
                max-w-[75%] px-4 py-2 rounded-[18px] text-[15px] font-medium leading-tight shadow-sm
                ${msg.sender === 'user' ? 'bg-[#007AFF] text-white rounded-tr-none' : 'bg-white text-black rounded-tl-none'}
              `}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="메시지 입력"
          className="flex-1 h-9 px-4 bg-[#F2F2F7] border-none rounded-full text-[15px] focus:outline-none placeholder-gray-400"
        />
        <button 
          onClick={sendMessage} 
          disabled={!input.trim()}
          className="w-9 h-9 bg-[#007AFF] text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;

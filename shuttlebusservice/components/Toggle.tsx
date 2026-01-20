
import React from 'react';

interface ToggleProps {
  label: string;
  isOn: boolean;
  onToggle: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, isOn, onToggle }) => {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[15px] font-medium text-black">{label}</span>
      {/* 
          1-3. 토글 노브 이동 로직 수정: 
          - relative 컨테이너에 absolute 노브 배치
          - isOn 상태에 따라 translate-x-5 (오른쪽 이동) 또는 translate-x-0 (왼쪽 위치) 적용
      */}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          isOn ? 'bg-[#34C759]' : 'bg-[#E9E9EA]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
            isOn ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default Toggle;

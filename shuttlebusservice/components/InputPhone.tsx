
import React, { useState, useEffect } from 'react';
import { parseDigits, formatPhone } from '../helpers';

interface InputPhoneProps {
  label: string;
  value: string;
  onChange: (formatted: string, isValid: boolean) => void;
}

const InputPhone: React.FC<InputPhoneProps> = ({ label, value, onChange }) => {
  const [innerValue, setInnerValue] = useState(value || '010-');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Always keep "010-"
    if (!input.startsWith('010-')) {
      input = '010-' + parseDigits(input);
    }

    const digits = parseDigits(input);
    const truncatedDigits = digits.slice(0, 11);
    const formatted = formatPhone(truncatedDigits);
    
    setInnerValue(formatted);

    const isValid = truncatedDigits.length === 11;
    if (isValid) {
      setError('');
    } else if (truncatedDigits.length > 3) {
      setError('양식에 맞게 작성해주세요');
    }
    
    onChange(formatted, isValid);
  };

  return (
    <div className="w-full mb-4">
      <label className="block font-bold mb-1 text-sm text-gray-700">{label}</label>
      <input
        type="tel"
        value={innerValue}
        onChange={handleChange}
        className={`w-full p-3 border-2 border-black focus:outline-none font-bold text-lg ${error ? 'border-red-500' : 'border-black'}`}
        placeholder="010-XXXX-XXXX"
      />
      {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}
    </div>
  );
};

export default InputPhone;

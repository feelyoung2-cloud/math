import React, { useState } from 'react';
import { X, Eraser, Calculator, Sparkles } from 'lucide-react';

interface Props {
  num1: string;
  num2: string;
  operator: '+' | '-';
  onClose: () => void;
}

export const VerticalScratchpad: React.FC<Props> = ({ num1, num2, operator, onClose }) => {
  // Pad strings for vertical alignment visualization
  // e.g. 3.5 + 0.28 => 3.50 + 0.28
  const [padWithZero, setPadWithZero] = useState(true);

  const getPaddedNumbers = () => {
    const parts1 = num1.split('.');
    const parts2 = num2.split('.');
    const dec1 = parts1[1] || '';
    const dec2 = parts2[1] || '';
    const maxDec = Math.max(dec1.length, dec2.length);

    if (!padWithZero || maxDec === 0) {
      return { n1: num1, n2: num2, maxDec };
    }

    const padded1 = (parts1[0] || '0') + '.' + dec1.padEnd(maxDec, '0');
    const padded2 = (parts2[0] || '0') + '.' + dec2.padEnd(maxDec, '0');
    return { n1: padded1, n2: padded2, maxDec };
  };

  const { n1, n2 } = getPaddedNumbers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border-2 border-amber-600/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative text-slate-100 overflow-hidden">
        {/* Top header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-game text-xl text-amber-300">소수 세로셈 모눈 연습장</h3>
              <p className="text-xs text-slate-400">소수점의 자리를 줄 세워 차근차근 풀어보세요!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Padding toggle */}
        <div className="mb-4 flex items-center justify-between bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-sm">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            자릿수가 다를 때 끝자리 0 채우기
          </span>
          <button
            onClick={() => setPadWithZero(!padWithZero)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              padWithZero
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {padWithZero ? '0 채우기 켜짐 (추천)' : '원래대로'}
          </button>
        </div>

        {/* Calculation Visual Grid */}
        <div className="bg-[#0b1120] p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center font-mono select-none">
          <div className="text-xs text-amber-400/90 mb-3 bg-amber-950/40 px-3 py-1 rounded-md border border-amber-900/60 font-sans">
            💡 핵심 규칙: <strong>소수점(.)</strong>을 일직선으로 맞추는 것이 탐정의 기본 원칙!
          </div>

          <div className="inline-block text-2xl md:text-3xl tracking-widest text-right font-bold space-y-2">
            {/* Number 1 */}
            <div className="pr-4 text-sky-300">
              {n1}
            </div>

            {/* Operator + Number 2 */}
            <div className="relative pr-4 text-emerald-300">
              <span className="absolute left-[-2rem] text-amber-400 font-bold">{operator}</span>
              {n2}
            </div>

            {/* Calculation separator line */}
            <div className="w-full border-b-4 border-amber-500/80 my-2"></div>

            {/* Hint Guide */}
            <div className="pr-4 text-slate-500 text-lg tracking-normal font-sans text-center">
              아래 자물쇠에 정답을 입력하세요
            </div>
          </div>
        </div>

        {/* Step-by-step guidance */}
        <div className="mt-4 p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/80 text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-amber-300">📝 계산 탐정 팁:</p>
          <p>1. 소수점의 위치를 기준으로 소수 둘째 자리부터 오른쪽에서 왼쪽으로 계산해요.</p>
          <p>2. 더해서 10이 넘어가면 앞자리로 1을 <strong>받아올림</strong>합니다.</p>
          <p>3. 뺄 때 위 숫자가 더 작으면 앞자리에서 1을 <strong>받아내림(10 빌려오기)</strong>합니다.</p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-5 w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-game text-lg rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
        >
          확인하고 자물쇠 풀러 가기
        </button>
      </div>
    </div>
  );
};

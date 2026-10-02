import React from 'react';
import { Clock, Lightbulb, Calculator, Shield, User, Sparkles } from 'lucide-react';

interface Props {
  studentName: string | null;
  currentStage: number;
  totalStages: number;
  remainingSeconds: number;
  hintsRemaining: number;
  maxHints: number;
  onOpenHint: () => void;
  onOpenScratchpad: () => void;
  onOpenTeacherModal: () => void;
}

export const Header: React.FC<Props> = ({
  studentName,
  currentStage,
  totalStages,
  remainingSeconds,
  hintsRemaining,
  maxHints,
  onOpenHint,
  onOpenScratchpad,
  onOpenTeacherModal,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(Math.max(0, secs) / 60);
    const s = Math.max(0, secs) % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLowTime = remainingSeconds <= 300; // 5 min warning

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-amber-900/40 px-3 sm:px-6 py-2.5 shadow-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 p-0.5 shadow-md shadow-amber-900/40 flex items-center justify-center text-xl shrink-0">
            🔍
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-game text-amber-400 text-lg md:text-xl tracking-wide">
                소수 탐정 방탈출
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                초등 4학년
              </span>
            </div>
            {studentName ? (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-400" />
                <span className="text-slate-200 font-semibold">{studentName}</span> 탐정 수사 중
              </p>
            ) : (
              <p className="text-xs text-slate-400">소수의 덧셈과 뺄셈 추리 대작전</p>
            )}
          </div>
        </div>

        {/* Center: Stage & Timer Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {studentName && (
            <>
              {/* Stage Progress */}
              <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">진행도:</span>
                <span className="font-game text-amber-300 text-sm">
                  {currentStage} / {totalStages} 방
                </span>
              </div>

              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                  isLowTime
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-slate-900 border-amber-500/40 text-amber-300'
                }`}
                title="남은 제한 시간"
              >
                <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className="text-sm">{formatTime(remainingSeconds)}</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Interactive Tools & Teacher Portal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {studentName && (
            <>
              {/* Scratchpad Button */}
              <button
                onClick={onOpenScratchpad}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition-all active:scale-95"
                title="세로셈 모눈 연습장 열기"
              >
                <Calculator className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">세로셈 연습장</span>
              </button>

              {/* AI Hint Button */}
              <button
                onClick={onOpenHint}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl border border-amber-400/40 text-xs transition-all shadow-md shadow-amber-600/20 active:scale-95"
                title="AI 힌트 요정 부르기"
              >
                <Lightbulb className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                <span className="font-game text-xs sm:text-sm text-slate-950">힌트 요정</span>
                <span className="bg-slate-950/40 text-amber-200 px-1.5 py-0.2 rounded-full text-[10px]">
                  {hintsRemaining}/{maxHints}
                </span>
              </button>
            </>
          )}

          {/* Teacher Admin Modal Button */}
          <button
            onClick={onOpenTeacherModal}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-xl border border-slate-800 transition-colors"
            title="교사용 관리 대시보드"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

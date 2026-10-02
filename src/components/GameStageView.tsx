import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  RotateCcw,
  Compass,
  ArrowRight,
  Calculator
} from 'lucide-react';
import { StageData, STAGES } from '../data/stages.ts';

interface Props {
  currentStageNumber: number;
  onCorrectAnswer: () => void;
  onOpenHint: () => void;
  onOpenScratchpad: () => void;
  hintsRemaining: number;
  maxHints: number;
  studentAttempt: string;
  setStudentAttempt: (val: string) => void;
}

export const GameStageView: React.FC<Props> = ({
  currentStageNumber,
  onCorrectAnswer,
  onOpenHint,
  onOpenScratchpad,
  hintsRemaining,
  maxHints,
  studentAttempt,
  setStudentAttempt,
}) => {
  const stage: StageData = STAGES[currentStageNumber - 1] || STAGES[0];

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [shake, setShake] = useState(false);

  // Clear feedback when stage changes
  useEffect(() => {
    setFeedback({ type: null, message: '' });
    setStudentAttempt('');
    setIsUnlocking(false);
  }, [currentStageNumber]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isUnlocking) return;

    const trimmedInput = studentAttempt.trim();
    if (!trimmedInput) {
      setFeedback({
        type: 'error',
        message: '자물쇠에 숫자를 입력해 주세요!'
      });
      return;
    }

    // Normalize number strings (e.g. 0.79 vs .79 or 0.790)
    const parsedInput = parseFloat(trimmedInput);
    const parsedAnswer = parseFloat(stage.answer);

    const isMatch = !isNaN(parsedInput) && Math.abs(parsedInput - parsedAnswer) < 0.0001;

    if (isMatch) {
      setIsUnlocking(true);
      setFeedback({
        type: 'success',
        message: '철컥! 열쇠가 딱 맞았습니다! 다음 방의 문이 열립니다!'
      });

      // Brief unlock animation delay
      setTimeout(() => {
        onCorrectAnswer();
      }, 1200);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // Child-friendly polite encouraging feedback
      const errorReplies = [
        '열쇠가 맞지 않아요. 소수점 자리를 다시 한번 확인해 볼까요?',
        '자물쇠가 아직 돌아가지 않네요! 세로셈 도우미로 소수점을 맞춰볼까요?',
        '조금 아쉬워요! 받아올림이나 받아내림이 있었는지 탐정 수첩을 확인해 보세요.',
        '열쇠의 톱니가 걸리지 않아요. 조수 탐정 밍구에게 힌트를 물어보세요!'
      ];
      const randomReply = errorReplies[Math.floor(Math.random() * errorReplies.length)];

      setFeedback({
        type: 'error',
        message: randomReply
      });
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setStudentAttempt('');
    } else if (val === 'BACK') {
      setStudentAttempt(studentAttempt.slice(0, -1));
    } else if (val === '.') {
      if (!studentAttempt.includes('.')) {
        setStudentAttempt(studentAttempt === '' ? '0.' : studentAttempt + '.');
      }
    } else {
      if (studentAttempt.length < 8) {
        setStudentAttempt(studentAttempt + val);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-6">
      {/* Stage Trail Indicator */}
      <div className="mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg backdrop-blur-xs">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {STAGES.map((s, idx) => {
            const isCompleted = idx + 1 < currentStageNumber;
            const isCurrent = idx + 1 === currentStageNumber;

            return (
              <div
                key={s.id}
                className={`flex-1 min-w-[50px] sm:min-w-[80px] p-2 rounded-xl text-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : isCompleted
                    ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-950/40 border border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="text-base sm:text-lg mb-0.5">
                  {isCompleted ? '🔑' : isCurrent ? '🔒' : '🚪'}
                </div>
                <div className="font-game text-[11px] sm:text-xs truncate">
                  {s.stageNumber}단계
                </div>
                <div className="text-[9px] text-slate-400 hidden sm:block truncate">
                  {s.roomName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Escape Room Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Room Story & Clue Notebook (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Detective Clue Parchment Note */}
          <div className="bg-gradient-to-br from-[#1c1813] via-[#1a1c24] to-[#12151e] border-2 border-amber-700/60 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            {/* Vintage stamp */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-game">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>{stage.roomName}</span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🕵️</span>
              <h2 className="font-game text-xl sm:text-2xl text-amber-300">
                {stage.stageNumber}관문: {stage.title}
              </h2>
            </div>

            {/* Room Story */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-amber-900/30 text-slate-200 text-sm leading-relaxed mb-4">
              <p className="italic text-amber-100/90 font-serif">
                "{stage.story}"
              </p>
            </div>

            {/* Problem Parchment Box */}
            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-amber-950/30 p-5 rounded-2xl border-2 border-dashed border-amber-500/60 text-center relative">
              <span className="absolute -top-3 left-4 bg-amber-600 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-game uppercase tracking-wider">
                단서 수첩의 수학 암호
              </span>

              <p className="text-sm sm:text-base text-slate-200 font-semibold mb-3 mt-1">
                {stage.question}
              </p>

              {/* Big Math Expression */}
              <div className="inline-flex items-center justify-center gap-3 bg-slate-950/90 px-6 py-4 rounded-2xl border-2 border-amber-500/80 shadow-inner">
                <span className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold tracking-widest text-amber-300">
                  {stage.expression}
                </span>
                <span className="text-2xl sm:text-3xl text-slate-400 font-mono">= ?</span>
              </div>

              {stage.unit && (
                <p className="text-xs text-amber-400/80 mt-2">
                  * 단위: {stage.unit} (입력창에는 숫자만 입력)
                </p>
              )}
            </div>

            {/* Pedagogical Helpers Action Bar */}
            <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                onClick={onOpenScratchpad}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-semibold transition-all"
              >
                <Calculator className="w-4 h-4 text-sky-400" />
                <span>📝 소수점 세로셈 도우미 열기</span>
              </button>

              <button
                onClick={onOpenHint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>💡 AI 힌트 요정 (남은 횟수: {hintsRemaining}/{maxHints})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detective Lock Dial & Keypad (5 cols) */}
        <div className="lg:col-span-5">
          <div
            className={`bg-gradient-to-b from-[#161c2b] to-[#0f1422] border-2 border-amber-600/70 rounded-3xl p-5 sm:p-6 shadow-2xl relative ${
              shake ? 'animate-shake' : ''
            }`}
          >
            {/* Lock Status Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isUnlocking
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isUnlocking ? <Unlock className="w-5 h-5 animate-bounce" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-game text-lg text-amber-300">
                    {isUnlocking ? '잠금 해제 중...' : '비밀 자물쇠 다이얼'}
                  </h3>
                  <p className="text-[11px] text-slate-400">숫자를 맞추고 열쇠를 돌리세요</p>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                STAGE {stage.stageNumber}
              </span>
            </div>

            {/* Answer Display Screen */}
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={studentAttempt}
                  onChange={(e) => setStudentAttempt(e.target.value)}
                  placeholder="0.00"
                  readOnly
                  className="w-full bg-[#0a0f1d] border-2 border-amber-500/80 rounded-2xl py-3.5 px-4 text-center text-3xl sm:text-4xl font-mono font-bold text-amber-300 tracking-wider shadow-inner focus:outline-none"
                />
                {studentAttempt && (
                  <button
                    type="button"
                    onClick={() => setStudentAttempt('')}
                    className="absolute right-3 top-4 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-md"
                  >
                    지우기
                  </button>
                )}
              </div>
            </form>

            {/* Feedback Message */}
            {feedback.message && (
              <div
                className={`mb-4 p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-500 text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-lg shrink-0">🤔</span>
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Big Friendly Kid Keypad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACK'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  disabled={isUnlocking}
                  className={`py-3 sm:py-3.5 rounded-xl font-mono text-xl sm:text-2xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                    key === 'BACK'
                      ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 text-sm font-sans flex items-center justify-center'
                      : key === '.'
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 hover:text-amber-300'
                  }`}
                >
                  {key === 'BACK' ? '◀ 지움' : key}
                </button>
              ))}
            </div>

            {/* Big Unlock Button */}
            <button
              onClick={() => handleSubmit()}
              disabled={isUnlocking || !studentAttempt}
              className={`w-full py-4 rounded-2xl font-game text-xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 ${
                isUnlocking
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25'
              }`}
            >
              {isUnlocking ? (
                <>
                  <Unlock className="w-6 h-6 animate-spin" />
                  <span>자물쇠 열리는 중...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-6 h-6 fill-slate-950" />
                  <span>열쇠 돌리기 (정답 확인)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

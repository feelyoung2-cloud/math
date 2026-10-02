import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Clock, Lightbulb, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  studentName: string;
  totalTimeSpentSeconds: number;
  hintsUsed: number;
  maxHints: number;
  onRestart: () => void;
}

export const EscapeSuccessModal: React.FC<Props> = ({
  studentName,
  totalTimeSpentSeconds,
  hintsUsed,
  maxHints,
  onRestart,
}) => {
  useEffect(() => {
    // Confetti celebration
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24']
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const formatMinutesSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-gradient-to-b from-slate-900 via-[#131b2e] to-slate-950 border-3 border-amber-500 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.3)] p-6 md:p-8 text-slate-100 text-center relative overflow-hidden">
        {/* Decorative badge */}
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40 ring-4 ring-amber-300/30">
          <Award className="w-10 h-10 text-slate-950" />
        </div>

        <span className="inline-block px-3.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/40 mb-2">
          탈출 대성공! ESCAPE COMPLETE
        </span>

        <h2 className="font-game text-3xl md:text-4xl text-amber-300 mb-2">
          명탐정 방탈출 성공!
        </h2>
        <p className="text-slate-300 text-sm mb-6">
          축하합니다! <strong className="text-amber-400 text-base">{studentName}</strong> 탐정님은 소수의 덧셈과 뺄셈 6개 방의 모든 자물쇠를 완벽하게 해독했습니다.
        </p>

        {/* Certificate Card */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-amber-500/40 text-left mb-6 relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
            <span className="font-game text-sm text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              1급 소수 수사관 공인 수료증
            </span>
            <span className="text-xs text-slate-400">초등 4학년 수학 과정</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-sky-400" />
              <div>
                <p className="text-slate-400">총 탈출 소요 시간</p>
                <p className="font-bold text-slate-100 text-sm">{formatMinutesSeconds(totalTimeSpentSeconds)}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-slate-400">AI 힌트 사용</p>
                <p className="font-bold text-slate-100 text-sm">{hintsUsed}회 / {maxHints}회</p>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>해결한 자물쇠: <strong>6 / 6개</strong></span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              자릿수 맞추기 마스터!
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-game text-lg rounded-xl font-bold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <RotateCcw className="w-5 h-5" />
          새로운 모험 다시 도전하기
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Sparkles, HelpCircle, Loader2, AlertCircle, Compass, Lightbulb } from 'lucide-react';
import { StageData } from '../data/stages.ts';

interface Props {
  stage: StageData;
  studentAttempt: string;
  hintsRemaining: number;
  maxHints: number;
  onConsumeHint: () => void;
  onClose: () => void;
}

export const AiHintModal: React.FC<Props> = ({
  stage,
  studentAttempt,
  hintsRemaining,
  maxHints,
  onConsumeHint,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [hintResult, setHintResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  const requestHint = async (userQuestion?: string) => {
    if (hintsRemaining <= 0) {
      setErrorMsg('사용 가능한 힌트를 모두 소진했습니다. 차근차근 세로셈 모눈 연습장을 활용해보세요!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageNumber: stage.stageNumber,
          stageTitle: stage.title,
          problemExpression: stage.expression,
          questionText: stage.question,
          studentAttempt: studentAttempt || undefined,
          customQuestion: userQuestion || customQuery || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`힌트 요정 서버 응답 오류 (${response.status})`);
      }

      const data = await response.json();
      if (data.hint) {
        setHintResult(data.hint);
        onConsumeHint(); // decrement hint count in parent
      } else {
        throw new Error(data.error || '힌트를 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Hint fetch error:', err);
      // Fallback to offline educational pedagogical tip if network is down
      setHintResult(stage.conceptTip);
      onConsumeHint();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-[#10172a] border-2 border-amber-500/70 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-game text-xl text-amber-300">조수 탐정 밍구의 AI 힌트 요정</h3>
              <p className="text-xs text-slate-400">정답을 대신 알려주지 않고, 수학적 풀이 원리를 짚어줍니다!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Remaining Hints Badge */}
        <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>남은 힌트 횟수:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxHints }).map((_, idx) => {
              const isAvailable = idx < hintsRemaining;
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isAvailable
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40'
                      : 'bg-slate-700 text-slate-500 line-through'
                  }`}
                >
                  💡
                </div>
              );
            })}
            <span className="ml-1 text-sm font-bold text-amber-400">
              ({hintsRemaining}/{maxHints})
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Area */}
        {!hintResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-sm text-slate-300">
              <p className="font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                현재 단계: {stage.stageNumber}단계 - {stage.title}
              </p>
              <p className="text-xs text-slate-400">
                문제 수식: <span className="font-mono font-bold text-amber-300">{stage.expression}</span>
              </p>
              {studentAttempt && (
                <p className="text-xs text-slate-400 mt-1">
                  입력해본 답: <span className="font-mono text-rose-300">{studentAttempt}</span>
                </p>
              )}
            </div>

            {/* Quick buttons */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">어떤 도움이 필요한가요?</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  disabled={loading || hintsRemaining <= 0}
                  onClick={() => requestHint('소수점 자릿수를 어떻게 맞춰야 하는지 알려줘')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-600/80 text-xs text-slate-200 flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span>🎯 소수점 자릿수 맞추는 방법 힌트</span>
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                </button>
                <button
                  disabled={loading || hintsRemaining <= 0}
                  onClick={() => requestHint('받아올림 또는 받아내림하는 요령을 알려줘')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-600/80 text-xs text-slate-200 flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span>🔄 받아올림/받아내림 계산 요령 힌트</span>
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Custom Question Input */}
            <div className="pt-2">
              <label className="block text-xs text-slate-400 mb-1.5">
                직접 질문하고 싶다면 적어보세요 (선택 사항):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="예: 3.5 뒤에 0을 붙여도 되나요?"
                  disabled={loading || hintsRemaining <= 0}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <button
                  disabled={loading || hintsRemaining <= 0}
                  onClick={() => requestHint()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-game text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '힌트 받기'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Hint Result View */
          <div className="space-y-4">
            <div className="p-4 bg-amber-950/40 rounded-xl border border-amber-600/60 relative">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-sm">
                <span className="text-xl">🕵️‍♂️</span>
                <span>조수 탐정 밍구의 조언:</span>
              </div>
              <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line pl-1 font-medium">
                "{hintResult}"
              </p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-400">
              💡 힌트를 읽고 문제를 스스로 다시 풀어보세요. 정답을 맞추면 다음 방으로 탈출할 수 있습니다!
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-game text-base rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
            >
              알겠어요! 문제 풀러 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

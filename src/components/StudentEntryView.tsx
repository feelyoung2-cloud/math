import React, { useState } from 'react';
import { Search, KeyRound, Play, RotateCcw, Sparkles, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { getStudent, StudentProgress } from '../lib/firestoreService.ts';

interface Props {
  onStartGame: (student: StudentProgress) => void;
  defaultTimeLimitMinutes: number;
  maxHints: number;
}

export const StudentEntryView: React.FC<Props> = ({
  onStartGame,
  defaultTimeLimitMinutes,
  maxHints,
}) => {
  const [nickname, setNickname] = useState('');
  const [checking, setChecking] = useState(false);
  const [existingRecord, setExistingRecord] = useState<StudentProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate safe sanitized key from nickname
  const generateStudentKey = (name: string) => {
    // encode to safe ascii id while keeping Korean readable in firestore
    const sanitized = name.trim().replace(/\s+/g, '_');
    return `stu_${encodeURIComponent(sanitized)}`;
  };

  const handleCheckAndSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = nickname.trim();
    if (!cleanName) {
      setErrorMsg('탐정 닉네임(또는 이름)을 입력해 주세요!');
      return;
    }
    if (cleanName.length < 2) {
      setErrorMsg('2글자 이상 입력해 주세요.');
      return;
    }

    setChecking(true);
    setErrorMsg(null);

    try {
      const studentKey = generateStudentKey(cleanName);
      const existing = await getStudent(studentKey);

      if (existing) {
        // Found prior record! Show resume option
        setExistingRecord(existing);
      } else {
        // Brand new session
        const newSession: StudentProgress = {
          studentKey,
          studentName: cleanName,
          currentStage: 1,
          completed: false,
          hintsUsed: 0,
          remainingSeconds: defaultTimeLimitMinutes * 60,
          totalTimeSpentSeconds: 0,
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          stageHistory: JSON.stringify([])
        };
        onStartGame(newSession);
      }
    } catch (err: any) {
      console.warn('Firestore lookup fallback:', err);
      // Fallback local session if connection issues
      const studentKey = generateStudentKey(cleanName);
      const fallbackSession: StudentProgress = {
        studentKey,
        studentName: cleanName,
        currentStage: 1,
        completed: false,
        hintsUsed: 0,
        remainingSeconds: defaultTimeLimitMinutes * 60,
        totalTimeSpentSeconds: 0,
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        stageHistory: JSON.stringify([])
      };
      onStartGame(fallbackSession);
    } finally {
      setChecking(false);
    }
  };

  const handleResume = () => {
    if (existingRecord) {
      onStartGame(existingRecord);
    }
  };

  const handleStartFresh = () => {
    if (!existingRecord) return;
    const freshSession: StudentProgress = {
      studentKey: existingRecord.studentKey,
      studentName: existingRecord.studentName,
      currentStage: 1,
      completed: false,
      hintsUsed: 0,
      remainingSeconds: defaultTimeLimitMinutes * 60,
      totalTimeSpentSeconds: 0,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      stageHistory: JSON.stringify([])
    };
    onStartGame(freshSession);
  };

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#101728] border-2 border-amber-600/70 rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(217,119,6,0.15)] relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl shadow-amber-900/50 mb-3 text-4xl ring-4 ring-amber-400/20 animate-bounce-subtle">
            🕵️‍♂️
          </div>
          <span className="block text-xs font-bold text-amber-400 tracking-wider uppercase mb-1">
            Elementary 4th Grade Math Escape Room
          </span>
          <h1 className="font-game text-3xl sm:text-4xl text-amber-300 drop-shadow-md">
            소수 탐정 방탈출
          </h1>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            홈즈의 비밀 연구실에 갇혔습니다! 소수의 덧셈과 뺄셈 암호를 풀어 탈출하세요.
          </p>
        </div>

        {/* Existing Record Dialog */}
        {existingRecord ? (
          <div className="bg-slate-800/90 border-2 border-amber-500/80 rounded-2xl p-5 mb-6 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-game text-lg">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>이전 탐정 기록 발견!</span>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl text-xs sm:text-sm text-slate-300 space-y-1.5 text-left border border-slate-700">
              <p>• 탐정 이름: <strong className="text-amber-300">{existingRecord.studentName}</strong></p>
              <p>• 이전 진행 위치: <strong className="text-sky-300">{existingRecord.currentStage}단계 방</strong> ({existingRecord.completed ? '🎉 탈출 완료' : '수사 진행 중'})</p>
              <p>• 사용한 힌트: {existingRecord.hintsUsed}회 / {maxHints}회</p>
              <p>• 남은 시간: {Math.floor(existingRecord.remainingSeconds / 60)}분 {existingRecord.remainingSeconds % 60}초</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleResume}
                className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-game text-base rounded-xl font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                이어서 하기
              </button>
              <button
                onClick={handleStartFresh}
                className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-game text-base rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                처음부터 시작
              </button>
            </div>
          </div>
        ) : (
          /* Normal Nickname Input Form */
          <form onSubmit={handleCheckAndSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5 pl-1">
                탐정 닉네임 (또는 이름과 번호):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 4학년 1반 이민준, 꼬마명탐정"
                  maxLength={25}
                  disabled={checking}
                  className="w-full bg-slate-950/90 border-2 border-slate-700 focus:border-amber-500 rounded-2xl px-4 py-3.5 pl-11 text-base text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner font-medium"
                />
                <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-4" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={checking}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-game text-xl rounded-2xl font-bold transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {checking ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                  <span>탐정 기록 조회 중...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-6 h-6 text-slate-950" />
                  <span>방탈출 수사 시작하기</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Educational Game Rules summary */}
        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs text-slate-400">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="block text-base mb-1">🔐</span>
            <span className="font-semibold text-slate-200">총 6개 관문</span>
            <p className="text-[10px] text-slate-500 mt-0.5">순차적 스테이지</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="block text-base mb-1">💡</span>
            <span className="font-semibold text-slate-200">AI 힌트 요정</span>
            <p className="text-[10px] text-slate-500 mt-0.5">최대 {maxHints}회 지원</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="block text-base mb-1">⏱️</span>
            <span className="font-semibold text-slate-200">실시간 타이머</span>
            <p className="text-[10px] text-slate-500 mt-0.5">기기 간 이어하기</p>
          </div>
        </div>
      </div>
    </div>
  );
};

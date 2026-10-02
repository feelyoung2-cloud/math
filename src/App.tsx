import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { StudentEntryView } from './components/StudentEntryView.tsx';
import { GameStageView } from './components/GameStageView.tsx';
import { VerticalScratchpad } from './components/VerticalScratchpad.tsx';
import { AiHintModal } from './components/AiHintModal.tsx';
import { EscapeSuccessModal } from './components/EscapeSuccessModal.tsx';
import { TeacherDashboard } from './components/TeacherDashboard.tsx';
import { STAGES } from './data/stages.ts';
import { StudentProgress, AppSettings, getSettings, saveStudent } from './lib/firestoreService.ts';
import { testInitialConnection } from './lib/firebase.ts';
import { playUnlockSound, playCelebrationFanfare, playErrorSound } from './lib/soundEffects.ts';

export default function App() {
  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    timeLimitMinutes: 40,
    maxHints: 3,
    adminPasswordHash: ''
  });

  // Student Session
  const [student, setStudent] = useState<StudentProgress | null>(null);
  const [studentAttempt, setStudentAttempt] = useState('');

  // Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Time remaining & elapsed
  const [remainingSeconds, setRemainingSeconds] = useState<number>(40 * 60);
  const [totalTimeSpentSeconds, setTotalTimeSpentSeconds] = useState<number>(0);

  // Sync ref to avoid stale closures
  const studentRef = useRef<StudentProgress | null>(null);
  studentRef.current = student;

  // Initialize connection and load teacher settings on startup
  useEffect(() => {
    testInitialConnection();

    const fetchConfig = async () => {
      try {
        const config = await getSettings();
        if (config) {
          setSettings(config);
          if (!student) {
            setRemainingSeconds(config.timeLimitMinutes * 60);
          }
        }
      } catch (err) {
        console.error('Failed to load initial settings:', err);
      }
    };
    fetchConfig();
  }, []);

  // Main countdown timer interval
  useEffect(() => {
    if (!student || student.completed) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });

      setTotalTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [student?.studentKey, student?.completed]);

  // Periodic auto-save to Firestore (every 10 seconds)
  useEffect(() => {
    if (!student) return;

    const saveInterval = setInterval(() => {
      if (studentRef.current && !studentRef.current.completed) {
        const updated: StudentProgress = {
          ...studentRef.current,
          remainingSeconds,
          totalTimeSpentSeconds,
          lastActiveAt: new Date().toISOString()
        };
        saveStudent(updated).catch((e) => console.warn('Periodic sync failed:', e));
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [remainingSeconds, totalTimeSpentSeconds]);

  // Handle starting / resuming game
  const handleStartGame = (session: StudentProgress) => {
    setStudent(session);
    setRemainingSeconds(session.remainingSeconds);
    setTotalTimeSpentSeconds(session.totalTimeSpentSeconds);
    setStudentAttempt('');

    if (session.completed) {
      setShowSuccessModal(true);
    }

    // Save initial session state to Firestore
    saveStudent(session).catch((e) => console.error('Save initial session failed:', e));
  };

  // Handle correct answer
  const handleCorrectAnswer = async () => {
    if (!student) return;

    playUnlockSound();

    const nextStage = student.currentStage + 1;
    const isEscaped = nextStage > STAGES.length;

    // Parse stage history
    let history: any[] = [];
    try {
      history = JSON.parse(student.stageHistory || '[]');
    } catch {
      history = [];
    }
    history.push({
      stage: student.currentStage,
      clearedAt: new Date().toISOString(),
      timeSpent: totalTimeSpentSeconds
    });

    const updatedStudent: StudentProgress = {
      ...student,
      currentStage: isEscaped ? STAGES.length : nextStage,
      completed: isEscaped,
      remainingSeconds,
      totalTimeSpentSeconds,
      stageHistory: JSON.stringify(history),
      lastActiveAt: new Date().toISOString()
    };

    setStudent(updatedStudent);
    await saveStudent(updatedStudent);

    if (isEscaped) {
      playCelebrationFanfare();
      setShowSuccessModal(true);
    }
  };

  // Consume a hint
  const handleConsumeHint = async () => {
    if (!student) return;
    const updated: StudentProgress = {
      ...student,
      hintsUsed: student.hintsUsed + 1,
      lastActiveAt: new Date().toISOString()
    };
    setStudent(updated);
    await saveStudent(updated);
  };

  // Restart game
  const handleRestart = () => {
    setShowSuccessModal(false);
    setStudent(null);
    setStudentAttempt('');
  };

  const currentStageData = STAGES[(student?.currentStage || 1) - 1] || STAGES[0];
  const hintsRemaining = Math.max(0, settings.maxHints - (student?.hintsUsed || 0));

  return (
    <div className="min-h-screen bg-[#0e131f] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        studentName={student?.studentName || null}
        currentStage={student?.currentStage || 1}
        totalStages={STAGES.length}
        remainingSeconds={remainingSeconds}
        hintsRemaining={hintsRemaining}
        maxHints={settings.maxHints}
        onOpenHint={() => setShowHintModal(true)}
        onOpenScratchpad={() => setShowScratchpad(true)}
        onOpenTeacherModal={() => setShowTeacherModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col justify-center">
        {!student ? (
          <StudentEntryView
            onStartGame={handleStartGame}
            defaultTimeLimitMinutes={settings.timeLimitMinutes}
            maxHints={settings.maxHints}
          />
        ) : (
          <GameStageView
            currentStageNumber={student.currentStage}
            onCorrectAnswer={handleCorrectAnswer}
            onOpenHint={() => setShowHintModal(true)}
            onOpenScratchpad={() => setShowScratchpad(true)}
            hintsRemaining={hintsRemaining}
            maxHints={settings.maxHints}
            studentAttempt={studentAttempt}
            setStudentAttempt={setStudentAttempt}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="py-3 px-4 text-center text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950/60">
        초등학교 4학년 수학 소수의 덧셈과 뺄셈 방탈출 · Gemini AI 및 Firebase Cloud Firestore 기반
      </footer>

      {/* Vertical Scratchpad Modal */}
      {showScratchpad && (
        <VerticalScratchpad
          num1={currentStageData.num1}
          num2={currentStageData.num2}
          operator={currentStageData.operator}
          onClose={() => setShowScratchpad(false)}
        />
      )}

      {/* AI Hint Modal */}
      {showHintModal && (
        <AiHintModal
          stage={currentStageData}
          studentAttempt={studentAttempt}
          hintsRemaining={hintsRemaining}
          maxHints={settings.maxHints}
          onConsumeHint={handleConsumeHint}
          onClose={() => setShowHintModal(false)}
        />
      )}

      {/* Escape Success Modal */}
      {showSuccessModal && student && (
        <EscapeSuccessModal
          studentName={student.studentName}
          totalTimeSpentSeconds={totalTimeSpentSeconds}
          hintsUsed={student.hintsUsed}
          maxHints={settings.maxHints}
          onRestart={handleRestart}
        />
      )}

      {/* Teacher Dashboard Modal */}
      {showTeacherModal && (
        <TeacherDashboard
          onClose={() => setShowTeacherModal(false)}
          onSettingsUpdated={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}

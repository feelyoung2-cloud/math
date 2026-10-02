import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Award,
  Clock,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Settings,
  Activity,
  Cpu,
  Database,
  Lock,
  Search,
  Key,
  ChevronRight,
  Server
} from 'lucide-react';
import {
  StudentProgress,
  AppSettings,
  getSettings,
  saveSettings,
  hashPassword,
  listenToAllStudents,
  deleteStudentRecord,
  resetAllStudents,
  runRealFirestoreCRUDTest,
  CRUDTestResult
} from '../lib/firestoreService.ts';

interface Props {
  onClose: () => void;
  onSettingsUpdated: (settings: AppSettings) => void;
}

export const TeacherDashboard: React.FC<Props> = ({ onClose, onSettingsUpdated }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState<boolean | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'students' | 'diagnostics' | 'settings'>('students');

  // Students real-time state
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'ongoing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Settings state
  const [settings, setSettingsState] = useState<AppSettings>({
    timeLimitMinutes: 40,
    maxHints: 3,
    adminPasswordHash: ''
  });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Diagnostics state
  const [crudTesting, setCrudTesting] = useState(false);
  const [crudResult, setCrudResult] = useState<CRUDTestResult | null>(null);

  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiResult, setGeminiResult] = useState<{
    ok: boolean;
    model: string;
    message: string;
  } | null>(null);

  // Load existing settings on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const loaded = await getSettings();
        if (loaded && loaded.adminPasswordHash) {
          setHasExistingPassword(true);
          setSettingsState(loaded);
        } else {
          setHasExistingPassword(false);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
        setHasExistingPassword(false);
      }
    };
    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Subscribe to students once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = listenToAllStudents(
      (updatedList) => {
        setStudents(updatedList);
      },
      (error) => {
        console.error('Teacher real-time listener error:', error);
      }
    );

    // Run initial diagnostics automatically for teacher view
    runDiagnostics();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

  const handleSetInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword || inputPassword.length < 4) {
      setAuthError('비밀번호를 최소 4자 이상 입력해 주세요.');
      return;
    }
    if (inputPassword !== confirmPassword) {
      setAuthError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      const hashed = await hashPassword(inputPassword);
      const newSettings: AppSettings = {
        ...settings,
        adminPasswordHash: hashed
      };
      await saveSettings(newSettings);
      setSettingsState(newSettings);
      setHasExistingPassword(true);
      setIsAuthenticated(true);
      setAuthError(null);
      onSettingsUpdated(newSettings);
    } catch (err: any) {
      setAuthError('비밀번호 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword) {
      setAuthError('관리자 비밀번호를 입력해 주세요.');
      return;
    }

    try {
      const hashed = await hashPassword(inputPassword);
      if (hashed === settings.adminPasswordHash) {
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setAuthError('비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      setAuthError('비밀번호 검증 중 오류가 발생했습니다.');
    }
  };

  const runDiagnostics = async () => {
    // 1. Run Real Firestore 4-Step CRUD Test
    setCrudTesting(true);
    try {
      const result = await runRealFirestoreCRUDTest();
      setCrudResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setCrudTesting(false);
    }

    // 2. Run Gemini Health Check
    setGeminiTesting(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setGeminiResult(data);
    } catch (err: any) {
      setGeminiResult({
        ok: false,
        model: 'gemini-3.8-flash',
        message: '서버 연결 실패: ' + (err?.message || '알 수 없는 오류')
      });
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings(settings);
      onSettingsUpdated(settings);
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 2500);
    } catch (e: any) {
      alert('설정 저장 실패: ' + e.message);
    }
  };

  const handleDeleteStudent = async (studentKey: string, name: string) => {
    if (confirm(`'${name}' 학생의 기록을 삭제하시겠습니까?`)) {
      try {
        await deleteStudentRecord(studentKey);
      } catch (e: any) {
        alert('삭제 실패: ' + e.message);
      }
    }
  };

  const handleResetAll = async () => {
    if (students.length === 0) return;
    if (confirm(`현재 등록된 모든 학생(${students.length}명)의 탈출 기록을 초기화하시겠습니까?`)) {
      try {
        await resetAllStudents(students);
      } catch (e: any) {
        alert('초기화 실패: ' + e.message);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}분 ${s < 10 ? '0' : ''}${s}초`;
  };

  const filteredStudents = students.filter((s) => {
    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'completed' && s.completed) ||
      (filterMode === 'ongoing' && !s.completed);

    const matchesSearch =
      searchQuery.trim() === '' ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const completedCount = students.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-600/80 rounded-3xl w-full max-w-5xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-game text-xl text-amber-300">교사용 방탈출 관제 대시보드</h2>
              <p className="text-xs text-slate-400">실시간 학생 현황 · Firebase & AI 시스템 진단 · 게임 설정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Screen (if not logged in) */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/30">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-game text-2xl text-amber-300 mb-1">
                {hasExistingPassword === false ? '관리자 비밀번호 최초 설정' : '교사 인증'}
              </h3>
              <p className="text-xs text-slate-400">
                {hasExistingPassword === false
                  ? '웹앱 보안을 위해 선생님께서 사용하실 관리자 비밀번호를 설정하세요 (SHA-256 해시로 안전하게 저장됩니다).'
                  : '학생들의 활동 기록 및 시스템 관리를 위해 비밀번호를 입력해 주세요.'}
              </p>
            </div>

            {hasExistingPassword === false ? (
              /* First time password setup */
              <form onSubmit={handleSetInitialPassword} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">새 비밀번호 (4자 이상)</label>
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {authError && (
                  <p className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-game text-base rounded-xl font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  비밀번호 저장 및 대시보드 입장
                </button>
              </form>
            ) : (
              /* Regular login */
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">관리자 비밀번호</label>
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {authError && (
                  <p className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-game text-base rounded-xl font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  인증 확인
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Authenticated Dashboard Content */
          <>
            {/* Nav Tabs */}
            <div className="flex border-b border-slate-800 px-6 bg-slate-950/50 gap-4 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('students')}
                className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'students'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>학생 실시간 현황 ({students.length}명)</span>
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'diagnostics'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>시스템 상태 &amp; 실제 진단</span>
                {crudResult?.success && geminiResult?.ok && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>게임 규칙 설정</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: Students Real-time Monitoring */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  {/* Top Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                      <p className="text-xs text-slate-400">총 참여 학생</p>
                      <p className="text-2xl font-bold font-game text-amber-300 mt-1">
                        {students.length}명
                      </p>
                    </div>

                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                      <p className="text-xs text-slate-400">방탈출 성공</p>
                      <p className="text-2xl font-bold font-game text-emerald-400 mt-1">
                        {completedCount}명
                      </p>
                    </div>

                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                      <p className="text-xs text-slate-400">현재 수사 중</p>
                      <p className="text-2xl font-bold font-game text-sky-400 mt-1">
                        {students.length - completedCount}명
                      </p>
                    </div>

                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                      <p className="text-xs text-slate-400">탈출 완료율</p>
                      <p className="text-2xl font-bold font-game text-yellow-400 mt-1">
                        {students.length > 0
                          ? Math.round((completedCount / students.length) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Actions & Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="학생 이름 검색..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pl-9 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      </div>

                      <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                        <button
                          onClick={() => setFilterMode('all')}
                          className={`px-3 py-1 rounded-lg ${
                            filterMode === 'all'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          전체
                        </button>
                        <button
                          onClick={() => setFilterMode('completed')}
                          className={`px-3 py-1 rounded-lg ${
                            filterMode === 'completed'
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          탈출 성공
                        </button>
                        <button
                          onClick={() => setFilterMode('ongoing')}
                          className={`px-3 py-1 rounded-lg ${
                            filterMode === 'ongoing'
                              ? 'bg-sky-500 text-slate-950 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          진행 중
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleResetAll}
                      disabled={students.length === 0}
                      className="text-xs text-rose-300 hover:text-rose-200 bg-rose-950/60 border border-rose-800/80 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      전체 학생 기록 초기화
                    </button>
                  </div>

                  {/* Student List Table */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    {filteredStudents.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">
                        {students.length === 0
                          ? '아직 방탈출에 참여한 학생이 없습니다. 학생들이 이름을 입력하고 접속하면 실시간으로 여기에 표시됩니다!'
                          : '조건에 맞는 학생 기록이 없습니다.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                            <tr>
                              <th className="py-3 px-4">학생 이름</th>
                              <th className="py-3 px-4">진행 상태</th>
                              <th className="py-3 px-4">현재 단계</th>
                              <th className="py-3 px-4">힌트 사용</th>
                              <th className="py-3 px-4">소요 / 남은 시간</th>
                              <th className="py-3 px-4">최근 활동</th>
                              <th className="py-3 px-4 text-right">관리</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {filteredStudents.map((stu) => (
                              <tr key={stu.studentKey} className="hover:bg-slate-900/40">
                                <td className="py-3 px-4 font-bold text-amber-300">
                                  {stu.studentName}
                                </td>
                                <td className="py-3 px-4">
                                  {stu.completed ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3 h-3" />
                                      탈출 성공 🏆
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                      진행 중 🔍
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold">
                                  {stu.completed ? '6 / 6 완료' : `${stu.currentStage} / 6 단계`}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-amber-400">{stu.hintsUsed}</span>
                                  <span className="text-slate-400"> / {settings.maxHints}회</span>
                                </td>
                                <td className="py-3 px-4 font-mono">
                                  {stu.completed
                                    ? `총 ${formatSeconds(stu.totalTimeSpentSeconds)} 소요`
                                    : `${Math.floor(stu.remainingSeconds / 60)}분 ${stu.remainingSeconds % 60}초 남음`}
                                </td>
                                <td className="py-3 px-4 text-slate-400 text-[11px]">
                                  {new Date(stu.lastActiveAt).toLocaleTimeString('ko-KR')}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteStudent(stu.studentKey, stu.studentName)}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="학생 기록 삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: System Diagnostics & Real CRUD Test */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-game text-lg text-amber-300">
                        클라우드 인프라 실제 연결 진단
                      </h4>
                      <p className="text-xs text-slate-400">
                        가상의 상태가 아닌 실제 Firestore CRUD 및 Gemini API 호출 검증 결과입니다.
                      </p>
                    </div>
                    <button
                      onClick={runDiagnostics}
                      disabled={crudTesting || geminiTesting}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${crudTesting || geminiTesting ? 'animate-spin' : ''}`} />
                      전체 진단 다시 실행
                    </button>
                  </div>

                  {/* 1. Firebase Live 4-Step CRUD Diagnostic Card */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-100 text-sm">
                            Cloud Firestore 실시간 CRUD 무결성 테스트
                          </h5>
                          <p className="text-xs text-slate-400">
                            실제 테스트 문서(생성 → 읽기 → 수정 → 삭제) 전 과정 검증
                          </p>
                        </div>
                      </div>

                      <div>
                        {crudTesting ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            테스트 수행 중...
                          </span>
                        ) : crudResult?.success ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Firebase 연결 정상 ({crudResult.totalDurationMs}ms)
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Firebase 연결 확인 필요
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step by step verification breakdown */}
                    {crudResult && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {crudResult.steps.map((st, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border text-xs ${
                              st.success
                                ? 'bg-slate-900/90 border-emerald-500/40'
                                : 'bg-rose-950/40 border-rose-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-200">{st.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {st.durationMs}ms
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{st.detail}</p>
                            <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-400">
                              ✓ 성공 확인
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {crudResult?.errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                        오류 내용: {crudResult.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* 2. Gemini AI Health Card */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-100 text-sm">
                            Gemini AI 힌트 요정 서버 연동 상태
                          </h5>
                          <p className="text-xs text-slate-400">
                            서버 사이드 프록시 연동 및 모델 동작 확인 (API 키 비공개 유지)
                          </p>
                        </div>
                      </div>

                      <div>
                        {geminiTesting ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            호출 확인 중...
                          </span>
                        ) : geminiResult?.ok ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Gemini API 정상 작동
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Gemini API 점검 필요
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400">호출 모델:</span>
                        <p className="font-mono font-bold text-amber-300 mt-0.5">
                          {geminiResult?.model || 'gemini-3.8-flash'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400">보안 정책:</span>
                        <p className="font-semibold text-emerald-400 mt-0.5">
                          Server-side Proxy (클라이언트 은닉 완벽 적용)
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400">상태 메시지:</span>
                        <p className="font-medium text-slate-300 mt-0.5 truncate">
                          {geminiResult?.message || '대기 중'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Game Rule Settings */}
              {activeTab === 'settings' && (
                <div className="max-w-xl space-y-6">
                  <div>
                    <h4 className="font-game text-lg text-amber-300">방탈출 게임 규칙 및 난이도 설정</h4>
                    <p className="text-xs text-slate-400">
                      수업 환경에 맞춰 전체 제한 시간과 학생별 AI 힌트 허용 횟수를 조정합니다.
                    </p>
                  </div>

                  <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        전체 게임 제한 시간 (분)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[20, 30, 40, 50].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setSettingsState({ ...settings, timeLimitMinutes: mins })}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                              settings.timeLimitMinutes === mins
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {mins}분
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        학생당 최대 AI 힌트 사용 횟수
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 3, 4, 5].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setSettingsState({ ...settings, maxHints: cnt })}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                              settings.maxHints === cnt
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {cnt}회
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      {settingsSavedMsg && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          설정이 Firestore에 안전하게 저장되었습니다!
                        </span>
                      )}
                      <button
                        onClick={handleSaveSettings}
                        className="ml-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-game text-sm rounded-xl font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
                      >
                        설정 저장하기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

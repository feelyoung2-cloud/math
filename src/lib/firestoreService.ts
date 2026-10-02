import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';

export interface StudentProgress {
  studentKey: string;
  studentName: string;
  currentStage: number;
  completed: boolean;
  hintsUsed: number;
  remainingSeconds: number;
  totalTimeSpentSeconds: number;
  startedAt: string;
  lastActiveAt: string;
  stageHistory: string; // JSON string of [{ stage: 1, solvedAt: "...", attempts: 2 }]
}

export interface AppSettings {
  timeLimitMinutes: number;
  maxHints: number;
  adminPasswordHash: string;
  updatedAt?: string;
}

const STUDENTS_COLLECTION = 'students';
const SETTINGS_COLLECTION = 'settings';
const DEFAULT_SETTINGS_DOC = 'app_config';

/**
 * SHA-256 one-way hash for secure admin password storage
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = 'detective_math_room_salt_2026';
  const data = encoder.encode(salt + plainPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Fetch student session record by studentKey
 */
export async function getStudent(studentKey: string): Promise<StudentProgress | null> {
  const path = `${STUDENTS_COLLECTION}/${studentKey}`;
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, studentKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StudentProgress;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Create or update student session
 */
export async function saveStudent(student: StudentProgress): Promise<void> {
  const path = `${STUDENTS_COLLECTION}/${student.studentKey}`;
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, student.studentKey);
    await setDoc(docRef, {
      ...student,
      lastActiveAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time listener for all students (Teacher Dashboard)
 */
export function listenToAllStudents(
  onUpdate: (students: StudentProgress[]) => void,
  onError: (error: any) => void
) {
  const path = STUDENTS_COLLECTION;
  try {
    const q = query(collection(db, STUDENTS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const students: StudentProgress[] = [];
        snapshot.forEach((d) => {
          students.push(d.data() as StudentProgress);
        });
        // Sort: completed first (by time), then by stage descending
        students.sort((a, b) => {
          if (a.completed && !b.completed) return -1;
          if (!a.completed && b.completed) return 1;
          if (a.completed && b.completed) return a.totalTimeSpentSeconds - b.totalTimeSpentSeconds;
          return b.currentStage - a.currentStage;
        });
        onUpdate(students);
      },
      (error) => {
        onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Get application settings (time limit, max hints, teacher password hash)
 */
export async function getSettings(): Promise<AppSettings | null> {
  const path = `${SETTINGS_COLLECTION}/${DEFAULT_SETTINGS_DOC}`;
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC));
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save settings
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${DEFAULT_SETTINGS_DOC}`;
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOC), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a student record (teacher action)
 */
export async function deleteStudentRecord(studentKey: string): Promise<void> {
  const path = `${STUDENTS_COLLECTION}/${studentKey}`;
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Reset all student records (teacher action)
 */
export async function resetAllStudents(students: StudentProgress[]): Promise<void> {
  for (const s of students) {
    await deleteStudentRecord(s.studentKey);
  }
}

export interface CRUDStepResult {
  step: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  name: string;
  success: boolean;
  durationMs: number;
  detail?: string;
}

export interface CRUDTestResult {
  success: boolean;
  totalDurationMs: number;
  steps: CRUDStepResult[];
  errorMessage?: string;
  testedAt: string;
}

/**
 * STRICT 4-Step Verification:
 * Real Firestore test: CREATE -> READ -> UPDATE -> DELETE on /test/conn_test_{timestamp}
 * Only returns success=true if ALL 4 steps actually pass against the live Firestore instance!
 */
export async function runRealFirestoreCRUDTest(): Promise<CRUDTestResult> {
  const testId = `conn_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const testDocRef = doc(db, 'test', testId);
  const steps: CRUDStepResult[] = [];
  const startOverall = performance.now();

  try {
    // 1. CREATE Step
    const t0 = performance.now();
    await setDoc(testDocRef, {
      testId,
      status: 'pending_creation',
      timestamp: Date.now(),
      clientInfo: 'Admin Diagnostic Test'
    });
    const t1 = performance.now();
    steps.push({
      step: 'CREATE',
      name: '1단계: 테스트 문서 생성 (Create)',
      success: true,
      durationMs: Math.round(t1 - t0),
      detail: `문서 ID: ${testId}`
    });

    // 2. READ Step
    const t2 = performance.now();
    const readSnap = await getDoc(testDocRef);
    const t3 = performance.now();
    if (!readSnap.exists() || readSnap.data()?.testId !== testId) {
      throw new Error('생성된 테스트 문서를 읽을 수 없거나 데이터가 일치하지 않습니다.');
    }
    steps.push({
      step: 'READ',
      name: '2단계: 테스트 문서 읽기 (Read)',
      success: true,
      durationMs: Math.round(t3 - t2),
      detail: `데이터 검증 완료 (status=${readSnap.data()?.status})`
    });

    // 3. UPDATE Step
    const t4 = performance.now();
    await updateDoc(testDocRef, {
      status: 'verified_updated',
      updatedAtTimestamp: Date.now()
    });
    const t5 = performance.now();
    steps.push({
      step: 'UPDATE',
      name: '3단계: 테스트 문서 수정 (Update)',
      success: true,
      durationMs: Math.round(t5 - t4),
      detail: '상태값 업데이트(verified_updated) 성공'
    });

    // 4. DELETE Step
    const t6 = performance.now();
    await deleteDoc(testDocRef);
    const t7 = performance.now();
    // Double check it was removed
    const verifyDeleteSnap = await getDoc(testDocRef);
    if (verifyDeleteSnap.exists()) {
      throw new Error('테스트 문서가 삭제되지 않고 남아있습니다.');
    }
    steps.push({
      step: 'DELETE',
      name: '4단계: 테스트 문서 삭제 및 정리 (Delete)',
      success: true,
      durationMs: Math.round(t7 - t6),
      detail: '임시 테스트 데이터 완전 삭제 확인'
    });

    const totalDurationMs = Math.round(performance.now() - startOverall);

    return {
      success: true,
      totalDurationMs,
      steps,
      testedAt: new Date().toLocaleTimeString('ko-KR')
    };
  } catch (err: any) {
    const totalDurationMs = Math.round(performance.now() - startOverall);
    console.error('Firestore 4-step CRUD test failed:', err);

    // Try cleanup if failed midway
    try {
      await deleteDoc(testDocRef);
    } catch {
      // ignore cleanup error
    }

    return {
      success: false,
      totalDurationMs,
      steps,
      errorMessage: err?.message || String(err),
      testedAt: new Date().toLocaleTimeString('ko-KR')
    };
  }
}

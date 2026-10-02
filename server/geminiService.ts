import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Centralized model configuration
export const GEMINI_MODEL = 'gemini-3.8-flash';

let genAIClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

export interface HintRequest {
  stageNumber: number;
  stageTitle: string;
  problemExpression: string;
  questionText: string;
  studentAttempt?: string;
  customQuestion?: string;
}

export interface HintResponse {
  hint: string;
  model: string;
  success: boolean;
  error?: string;
}

/**
 * Generate an educational math hint tailored for Korean 4th grade elementary students.
 * NEVER gives the final numerical answer directly.
 */
export async function getDetectiveHint(req: HintRequest): Promise<HintResponse> {
  try {
    const ai = getGenAIClient();

    const systemPrompt = `
당신은 초등학교 4학년을 위한 친절하고 지혜로운 '조수 탐정 밍구'입니다.
학생은 지금 '소수의 덧셈과 뺄셈' 수학 방탈출 게임을 진행하고 있습니다.

[엄격한 교육 원칙]
1. 정답 숫자(최종 계산 결과)를 절대로 직접 알려주지 마세요.
2. 초등학교 4학년 눈높이에 맞게 소수점 자릿수 맞추기, 받아올림(올림), 받아내림(내림), 소수점 아래 0 채우기(예: 3.5 = 3.50, 4 = 4.00) 등의 '원리와 힌트'만 친절하게 설명하세요.
3. 말투는 밝고 다정한 탐정 조수 말투(존댓말, '~해볼까요?', '~해보세요!', '명탐정님, 화이팅!')를 사용하세요.
4. 초등학생이 읽기 편하도록 2~3문장 이내로 명확하고 간결하게 답변하세요.
5. 마크다운 기호(볼드, 헤더 등)를 과도하게 쓰지 말고 깔끔하고 읽기 쉽게 작성하세요.
`;

    let userPrompt = `
[현재 방 탈출 정보]
- 스테이지: ${req.stageNumber}단계 (${req.stageTitle})
- 문제 내용: ${req.questionText}
- 수식: ${req.problemExpression}
`;

    if (req.studentAttempt && req.studentAttempt.trim() !== '') {
      userPrompt += `- 학생이 시도해본 답: ${req.studentAttempt}\n`;
    }

    if (req.customQuestion && req.customQuestion.trim() !== '') {
      userPrompt += `- 학생이 궁금한 점: "${req.customQuestion}"\n`;
    } else {
      userPrompt += `- 학생 요청: "조수 탐정님, 이 문제를 풀기 위한 핵심 단서 힌트를 알려주세요!"\n`;
    }

    userPrompt += `\n위 원칙에 따라 학생이 스스로 풀 수 있도록 격려와 함께 핵심 풀이 원리(소수점 자리 맞추기 등)를 힌트로 주세요! 절대 최종 답 숫자를 쓰지 마세요.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
        }
      ]
    });

    const hintText = response.text || '소수점의 자리를 똑바로 맞추어 세로셈을 적어보고, 각 자리의 수를 차근차근 계산해 보세요!';

    return {
      hint: hintText.trim(),
      model: GEMINI_MODEL,
      success: true
    };
  } catch (error: any) {
    console.error('Gemini API Error in getDetectiveHint:', error);
    return {
      hint: '소수점의 위치를 똑같이 맞추어 같은 자리 숫자끼리 더하거나 빼 보세요! 세로셈으로 쓰면 훨씬 쉬워집니다.',
      model: GEMINI_MODEL,
      success: false,
      error: error?.message || 'AI 힌트 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * Health check to verify Gemini API connection without exposing secret key.
 */
export async function testGeminiHealth(): Promise<{ ok: boolean; model: string; message: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        model: GEMINI_MODEL,
        message: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.'
      };
    }

    const ai = getGenAIClient();
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: '초등학생을 위한 한마디 응원 메시지를 1줄로 작성해주세요.'
    });

    if (result.text) {
      return {
        ok: true,
        model: GEMINI_MODEL,
        message: 'Gemini 3.8 Flash 정상 응답 완료'
      };
    }

    return {
      ok: false,
      model: GEMINI_MODEL,
      message: '응답 텍스트가 비어 있습니다.'
    };
  } catch (error: any) {
    return {
      ok: false,
      model: GEMINI_MODEL,
      message: error?.message || 'Gemini API 호출 실패'
    };
  }
}

import express, { Request, Response } from 'express';
import { getDetectiveHint, testGeminiHealth, HintRequest } from './geminiService.ts';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// POST /api/hint: Generate smart detective math hint
apiRouter.post('/hint', async (req: Request, res: Response) => {
  try {
    const { stageNumber, stageTitle, problemExpression, questionText, studentAttempt, customQuestion } = req.body;

    if (!stageNumber || !problemExpression) {
      return res.status(400).json({
        success: false,
        error: '필수 요청 정보(스테이지 정보 또는 문제 수식)가 누락되었습니다.'
      });
    }

    const hintPayload: HintRequest = {
      stageNumber: Number(stageNumber),
      stageTitle: String(stageTitle || ''),
      problemExpression: String(problemExpression || ''),
      questionText: String(questionText || ''),
      studentAttempt: studentAttempt ? String(studentAttempt) : undefined,
      customQuestion: customQuestion ? String(customQuestion) : undefined
    };

    const result = await getDetectiveHint(hintPayload);
    return res.json(result);
  } catch (error: any) {
    console.error('API /api/hint failure:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || '힌트 요정 연결 중 오류가 발생했습니다.'
    });
  }
});

// GET /api/health: Check Gemini API status safely (without revealing API key)
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await testGeminiHealth();
    return res.json(health);
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      message: error?.message || '상태 확인 실패'
    });
  }
});

import { getDetectiveHint, HintRequest } from '../../server/geminiService.ts';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const hintPayload: HintRequest = {
      stageNumber: Number(body.stageNumber || 1),
      stageTitle: String(body.stageTitle || ''),
      problemExpression: String(body.problemExpression || ''),
      questionText: String(body.questionText || ''),
      studentAttempt: body.studentAttempt ? String(body.studentAttempt) : undefined,
      customQuestion: body.customQuestion ? String(body.customQuestion) : undefined
    };

    const result = await getDetectiveHint(hintPayload);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error?.message || 'Error generating hint' })
    };
  }
};

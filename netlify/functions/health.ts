import { testGeminiHealth } from '../../server/geminiService.ts';

export const handler = async () => {
  try {
    const health = await testGeminiHealth();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(health)
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: error?.message || 'Gemini health test failed' })
    };
  }
};

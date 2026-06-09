// services/aiJudgeService.js

export async function judgeAnswerWithAI({ question, referenceAnswer, userAnswer }) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // ← ご自身のGemini APIキーを入力してください
  const prompt = `
次の「ユーザー解答」が「模範解答」と意味的に等しいかを判定してください。
厳密な一致は不要ですが、意味が近ければ「はい」、意味が異なれば「いいえ」と答えてください。
その判断の簡単な理由も述べてください。

【問題文】
${question}

【模範解答】
${referenceAnswer}

【ユーザー解答】
${userAnswer}

回答形式の例：
はい - 意味は等しいから。
または
いいえ - 意味が異なるから。
`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AI判定APIエラー: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const isCorrect = outputText.trim().startsWith('はい');
  const reason = outputText.trim();

  return { isCorrect, reason };
}

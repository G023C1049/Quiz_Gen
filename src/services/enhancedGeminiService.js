// services/batchEnhancedGeminiService.js

import React from 'react';

const genreList = ['雑学', 'アニメ', '映画', '歌詞', '歴史', '観光地'];

// モデルの優先順位（上位から下位へ）
const MODEL_HIERARCHY = [
  { name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
  { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' }
];

// レート制限エラーのパターン
const RATE_LIMIT_PATTERNS = [
  /quota.*exceeded/i,
  /rate.*limit/i,
  /too.*many.*requests/i,
  /429/
];

// レート制限チェック関数
function isRateLimitError(error) {
  const errorMessage = error.message || error.toString();
  return RATE_LIMIT_PATTERNS.some(pattern => pattern.test(errorMessage));
}

// 待機時間計算（指数バックオフ）
function calculateWaitTime(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 30000); // 最大30秒
}

// RPM制限メッセージを表示する関数（UIコンポーネントで使用）
export function showRateLimitMessage(modelName, waitTime) {
  return {
    type: 'warning',
    title: 'API制限に達しました',
    message: `${modelName}のリクエスト制限に達しました。${Math.ceil(waitTime / 1000)}秒後に自動で再試行します...`,
    isWaiting: true
  };
}

// モデル変更メッセージ
export function showModelDowngradeMessage(fromModel, toModel) {
  return {
    type: 'info',
    title: 'モデルを変更しました',
    message: `${fromModel}が利用できないため、${toModel}に切り替えました。`,
    isWaiting: false
  };
}

// 単一モデルでのAPI呼び出し
async function callGeminiAPI(modelConfig, prompt, onStatusUpdate) {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`APIエラー: ${response.status} - ${errorText}`);

        // 429 (Too Many Requests) の場合
        if (response.status === 429 || isRateLimitError(error)) {
          const waitTime = calculateWaitTime(attempt);

          // UI更新: 待機メッセージ表示
          if (onStatusUpdate) {
            onStatusUpdate(showRateLimitMessage(modelConfig.displayName, waitTime));
          }

          // 指数バックオフで待機
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // 再試行
        }

        throw error;
      }

      // 成功した場合
      const data = await response.json();
      return data;

    } catch (error) {
      // レート制限エラーの場合は再試行
      if (isRateLimitError(error) && attempt < maxRetries - 1) {
        const waitTime = calculateWaitTime(attempt);

        if (onStatusUpdate) {
          onStatusUpdate(showRateLimitMessage(modelConfig.displayName, waitTime));
        }

        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      throw error;
    }
  }
}

// 一括問題生成（改良版）
export async function generateBatchQuestionsWithAI(genre, topic = '', totalQuestions = 5, onStatusUpdate = null) {
  const safeGenre = genreList.includes(genre)
    ? genre
    : genreList[Math.floor(Math.random() * genreList.length)];
  const safeTopic = topic || `${safeGenre}に関するクイズ`;

  // より詳細なプロンプト（一括生成用）
  const prompt = `
ジャンル: ${safeGenre}
トピック: ${safeTopic}

あなたは優秀なクイズ作成AIです。以下の条件に従って日本語のクイズを${totalQuestions}問作成してください。

【重要な条件】
1. 解答が一言で答えられる問題のみを作成する
2. 解答は実際にソースがある事実に基づく内容にする
3. 推測や事実に基づかない内容は絶対に出力しない
4. 各問題は独立しており、重複しない内容にする
5. 難易度は一般的な知識レベルとする

【出力形式】
以下のJSON形式で出力してください。JSON以外は絶対に出力しないでください。

[
  {
    "question": "問題文",
    "answer": "一言での正解",
    "explanation": "解答の根拠や説明",
    "genre": "${safeGenre}",
    "difficulty": "easy/medium/hard",
    "keywords": ["主要キーワード1", "主要キーワード2"]
  },
  ...
]

注意: 正確性を重視し、不確実な情報は含めないでください。
`;

  let lastError = null;

  // 状態更新: 問題生成開始
  if (onStatusUpdate) {
    onStatusUpdate({
      type: 'info',
      title: '問題を生成中...',
      message: `${safeGenre}の問題を${totalQuestions}問作成しています`,
      isWaiting: true
    });
  }

  // モデルを順番に試す
  for (let i = 0; i < MODEL_HIERARCHY.length; i++) {
    const currentModel = MODEL_HIERARCHY[i];

    try {
      // モデル変更の通知（最初のモデル以外）
      if (i > 0 && onStatusUpdate) {
        onStatusUpdate(showModelDowngradeMessage(
          MODEL_HIERARCHY[0].displayName,
          currentModel.displayName
        ));
      }

      const data = await callGeminiAPI(currentModel, prompt, onStatusUpdate);

      // JSON解析の改良
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('AI回答テキスト:', text);

      // より柔軟なJSON抽出
      let match = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (!match) {
        // 別パターンも試す
        match = text.match(/\{[\s\S]*?\}/g);
        if (match && match.length >= totalQuestions) {
          // 個別のJSONオブジェクトを配列にまとめる
          const jsonString = '[' + match.slice(0, totalQuestions).join(',') + ']';
          match = [jsonString];
        }
      }

      if (!match) {
        throw new Error('有効なJSONが見つかりませんでした');
      }

      const questions = JSON.parse(match[0]);

      // 生成された問題の検証
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('問題が正しく生成されませんでした');
      }

      // 不完全な問題をフィルタリング
      const validQuestions = questions.filter(q =>
        q.question &&
        q.answer &&
        q.question.trim().length > 0 &&
        q.answer.trim().length > 0
      ).slice(0, totalQuestions);

      // 不足している項目を補完
      const completeQuestions = validQuestions.map((q, index) => ({
        question: q.question,
        answer: q.answer,
        explanation: q.explanation || '解答の説明',
        genre: q.genre || safeGenre,
        difficulty: q.difficulty || 'medium',
        keywords: q.keywords || [q.answer],
        id: `${Date.now()}_${index}`, // 一意のID
        createdAt: new Date().toISOString()
      }));

      if (completeQuestions.length < totalQuestions) {
        console.warn(`要求された問題数(${totalQuestions})より少ない問題数(${completeQuestions.length})が生成されました`);
      }

      // 成功時はUI状態をクリア
      if (onStatusUpdate) {
        onStatusUpdate({
          type: 'success',
          title: '問題生成完了',
          message: `${completeQuestions.length}問の問題を生成しました`,
          isWaiting: false
        });
      }

      console.log('生成された問題:', completeQuestions);
      return completeQuestions;

    } catch (error) {
      console.warn(`${currentModel.name}でエラー:`, error.message);
      lastError = error;

      // レート制限エラーの場合は次のモデルに移行
      // その他のエラーの場合も次のモデルを試す
      continue;
    }
  }

  // すべてのモデルで失敗した場合
  if (onStatusUpdate) {
    onStatusUpdate({
      type: 'error',
      title: 'すべてのAIモデルが利用できません',
      message: '時間をおいて再度お試しください。',
      isWaiting: false
    });
  }

  throw new Error(`すべてのモデルで失敗: ${lastError?.message || '不明なエラー'}`);
}

// React コンポーネントで使用する状態更新の例
export function useAIStatus() {
  const [status, setStatus] = React.useState(null);

  const updateStatus = (statusInfo) => {
    setStatus(statusInfo);

    // 自動クリア（エラーメッセージ以外）
    if (statusInfo && !statusInfo.isWaiting && statusInfo.type !== 'error') {
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return [status, updateStatus];
}

// StatusDisplay コンポーネント（UI表示用）
export function StatusDisplay({ status }) {
  if (!status) return null;

  const bgColor = {
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    info: 'bg-blue-100 border-blue-400 text-blue-800',
    error: 'bg-red-100 border-red-400 text-red-800',
    success: 'bg-green-100 border-green-400 text-green-800'
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 mb-4 ${bgColor[status.type]}`}>
      <div className="flex items-center">
        {status.isWaiting && (
          <div className="animate-spin mr-2">⏳</div>
        )}
        <div>
          <h4 className="font-bold">{status.title}</h4>
          <p>{status.message}</p>
        </div>
      </div>
    </div>
  );
}

// 後方互換性のため従来の関数もエクスポート
export async function generateQuestionsWithAI(genre, topic = '', totalQuestions = 1, onStatusUpdate = null) {
  return await generateBatchQuestionsWithAI(genre, topic, totalQuestions, onStatusUpdate);
}
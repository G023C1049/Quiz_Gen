// services/smartJudgeService.js (バグ修正版)

import { judgeAnswerWithAI } from './aiJudgeService';

/**
 * 段階的判定システム（バグ修正版）
 * 1. 完全一致チェック
 * 2. 部分一致・キーワードチェック  
 * 3. 明らかな不正解チェック
 * 4. AI判定（最終手段）
 */

// 文字列正規化（空白、記号、大文字小文字を統一）
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[\s\u3000・、。！？]/g, '') // 空白、全角空白、句読点を除去
    .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角→半角
    .trim();
}

// キーワード抽出（改良版）
function extractKeywords(text) {
  const normalized = normalizeText(text);
  if (normalized.length === 0) return [];
  
  // より柔軟なキーワード抽出
  const patterns = [
    /[あ-んア-ンー一-龯]{2,}/g,  // 2文字以上の日本語
    /[a-z]{2,}/g,                // 2文字以上の英語
    /[0-9]+/g                    // 数字
  ];
  
  let keywords = [];
  patterns.forEach(pattern => {
    const matches = normalized.match(pattern) || [];
    keywords = keywords.concat(matches);
  });
  
  // 重複除去と空文字列フィルタリング
  return [...new Set(keywords)].filter(k => k && k.length > 0);
}

// 数値かどうかの判定（改良版）
function isNumeric(text) {
  if (!text) return false;
  const normalized = normalizeText(text);
  return /^[0-9]+\.?[0-9]*$/.test(normalized) || /^[0-9]+$/.test(normalized);
}

// 英語かどうかの判定（改良版）
function isEnglish(text) {
  if (!text) return false;
  const normalized = normalizeText(text);
  return /^[a-z\s]+$/.test(normalized) && normalized.length > 0;
}

// 段階1: 完全一致チェック
function checkExactMatch(referenceAnswer, userAnswer) {
  const refNormalized = normalizeText(referenceAnswer);
  const userNormalized = normalizeText(userAnswer);
  
  console.log('完全一致チェック:', { 
    original: { ref: referenceAnswer, user: userAnswer },
    normalized: { ref: refNormalized, user: userNormalized },
    match: refNormalized === userNormalized
  });

  if (refNormalized === userNormalized && refNormalized.length > 0) {
    return {
      isCorrect: true,
      reason: '完全一致のため正解です。',
      judgeMethod: 'exact_match'
    };
  }
  
  return null;
}

// 段階2: 部分一致・キーワードチェック（大幅改良）
function checkKeywordMatch(referenceAnswer, userAnswer) {
  const refKeywords = extractKeywords(referenceAnswer);
  const userKeywords = extractKeywords(userAnswer);
  
  console.log('キーワードチェック:', { 
    referenceAnswer, 
    userAnswer, 
    refKeywords, 
    userKeywords 
  });

  // キーワードが抽出できない場合はスキップ
  if (refKeywords.length === 0 || userKeywords.length === 0) {
    console.log('キーワード抽出失敗 - AI判定に移行');
    return null;
  }

  // より精密なマッチング
  let matchedKeywords = [];
  let totalMatches = 0;

  for (const refKeyword of refKeywords) {
    let bestMatch = null;
    let bestMatchScore = 0;

    for (const userKeyword of userKeywords) {
      let matchScore = 0;
      
      // 1. 完全一致（最高スコア）
      if (refKeyword === userKeyword) {
        matchScore = 1.0;
      }
      // 2. 部分一致（含む・含まれる）
      else if (refKeyword.length >= 2 && userKeyword.length >= 2) {
        if (refKeyword.includes(userKeyword) || userKeyword.includes(refKeyword)) {
          matchScore = 0.8;
        }
      }
      // 3. 共通文字列の割合
      else if (refKeyword.length >= 2 && userKeyword.length >= 2) {
        const commonChars = [...refKeyword].filter(char => userKeyword.includes(char)).length;
        const similarity = commonChars / Math.max(refKeyword.length, userKeyword.length);
        if (similarity > 0.5) {
          matchScore = similarity * 0.6;
        }
      }

      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        bestMatch = { ref: refKeyword, user: userKeyword, score: matchScore };
      }
    }

    if (bestMatch && bestMatchScore > 0.5) {
      matchedKeywords.push(bestMatch);
      totalMatches += bestMatchScore;
    }
  }

  const matchRate = refKeywords.length > 0 ? totalMatches / refKeywords.length : 0;
  
  console.log('マッチング詳細:', { 
    matchedKeywords, 
    totalMatches, 
    refKeywordsLength: refKeywords.length, 
    matchRate: Math.round(matchRate * 100) + '%'
  });

  // より柔軟な閾値設定
  if (matchRate >= 0.7) {
    return {
      isCorrect: true,
      reason: `主要キーワードが一致しているため正解です。（一致率: ${Math.round(matchRate * 100)}%）`,
      judgeMethod: 'keyword_match'
    };
  }
  
  if (matchRate <= 0.3) {
    return {
      isCorrect: false,
      reason: `キーワードの一致率が低いため不正解です。（一致率: ${Math.round(matchRate * 100)}%）`,
      judgeMethod: 'keyword_mismatch'
    };
  }

  // 中間的な場合はAI判定に委ねる
  console.log(`マッチ率${Math.round(matchRate * 100)}% - AI判定に移行`);
  return null;
}

// 段階3: 明らかな不正解チェック
function checkObviousWrong(question, referenceAnswer, userAnswer) {
  const userNormalized = normalizeText(userAnswer);
  const refNormalized = normalizeText(referenceAnswer);
  
  console.log('明らかな不正解チェック:', { userNormalized, refNormalized });

  // 空回答
  if (userNormalized.length === 0) {
    return {
      isCorrect: false,
      reason: '回答が空のため不正解です。',
      judgeMethod: 'empty_answer'
    };
  }

  // 数値問題に長い文字列で回答
  const refIsNumeric = isNumeric(referenceAnswer);
  const userIsNumeric = isNumeric(userAnswer);
  
  if (refIsNumeric && !userIsNumeric && userNormalized.length > 8) {
    return {
      isCorrect: false,
      reason: '数値回答が期待されるのに長い文字列で回答されたため不正解です。',
      judgeMethod: 'type_mismatch'
    };
  }

  // 英語問題に明らかに日本語で回答
  const refIsEnglish = isEnglish(referenceAnswer);
  const userIsEnglish = isEnglish(userAnswer);
  
  if (refIsEnglish && !userIsEnglish && userNormalized.match(/[あ-んア-ンー一-龯]/)) {
    return {
      isCorrect: false,
      reason: '英語回答が期待されるのに日本語で回答されたため不正解です。',
      judgeMethod: 'language_mismatch'
    };
  }

  // 「わからない」「知らない」等の諦め回答
  const giveUpPatterns = ['わからない', 'わかりません', '知らない', 'しらない', '不明', 'パス'];
  if (giveUpPatterns.some(pattern => userNormalized.includes(normalizeText(pattern)))) {
    return {
      isCorrect: false,
      reason: '諦めの回答のため不正解です。',
      judgeMethod: 'give_up'
    };
  }

  return null;
}

// AI判定結果の解析（大幅改良）
function parseAIJudgment(aiResult) {
  if (!aiResult || !aiResult.reason) {
    return { isCorrect: false, confidence: 0 };
  }

  const reason = aiResult.reason.toLowerCase();
  
  // より確実な判定パターン
  const positivePatterns = [
    /はい[\s\-]*.*正しい/,
    /はい[\s\-]*.*正解/,
    /はい[\s\-]*.*等しい/,
    /はい[\s\-]*.*一致/,
    /正解.*です/,
    /正しい.*です/,
    /^はい[。．\-\s]/
  ];
  
  const negativePatterns = [
    /いいえ[\s\-]*.*間違/,
    /いいえ[\s\-]*.*異なる/,
    /いいえ[\s\-]*.*不正解/,
    /不正解.*です/,
    /間違.*です/,
    /異なる.*です/,
    /^いいえ[。．\-\s]/
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  // パターンマッチングでスコア計算
  positivePatterns.forEach(pattern => {
    if (pattern.test(reason)) positiveScore += 1;
  });
  
  negativePatterns.forEach(pattern => {
    if (pattern.test(reason)) negativeScore += 1;
  });

  // キーワードベースの追加チェック
  if (reason.includes('はい') && !reason.includes('いいえ')) {
    positiveScore += 0.5;
  }
  if (reason.includes('いいえ') && !reason.includes('はい')) {
    negativeScore += 0.5;
  }

  console.log('AI判定解析:', { 
    reason, 
    positiveScore, 
    negativeScore,
    originalIsCorrect: aiResult.isCorrect
  });

  // 最終判定
  if (positiveScore > negativeScore) {
    return { isCorrect: true, confidence: positiveScore };
  } else if (negativeScore > positiveScore) {
    return { isCorrect: false, confidence: negativeScore };
  } else {
    // スコアが同じ場合は元の判定を使用
    return { isCorrect: aiResult.isCorrect, confidence: 0.5 };
  }
}

// メイン判定関数（バグ修正版）
export async function judgeAnswerSmart({ question, referenceAnswer, userAnswer }) {
  console.log('=== 段階的判定開始 ===');
  console.log('問題:', question);
  console.log('模範解答:', referenceAnswer);
  console.log('ユーザー回答:', userAnswer);

  try {
    // 入力検証
    if (!referenceAnswer || !userAnswer) {
      throw new Error('回答または模範解答が空です');
    }

    // 段階1: 完全一致チェック
    const exactMatch = checkExactMatch(referenceAnswer, userAnswer);
    if (exactMatch) {
      console.log('段階1で判定完了:', exactMatch);
      return exactMatch;
    }

    // 段階2: キーワードマッチチェック
    const keywordMatch = checkKeywordMatch(referenceAnswer, userAnswer);
    if (keywordMatch) {
      console.log('段階2で判定完了:', keywordMatch);
      return keywordMatch;
    }

    // 段階3: 明らかな不正解チェック
    const obviousWrong = checkObviousWrong(question, referenceAnswer, userAnswer);
    if (obviousWrong) {
      console.log('段階3で判定完了:', obviousWrong);
      return obviousWrong;
    }

    // 段階4: AI判定（最終手段）
    console.log('AI判定を実行します');
    const aiResult = await judgeAnswerWithAI({ question, referenceAnswer, userAnswer });
    
    // AI判定結果の詳細解析
    const parsedResult = parseAIJudgment(aiResult);
    
    const finalResult = {
      isCorrect: parsedResult.isCorrect,
      reason: `${aiResult.reason} (AI判定・信頼度: ${Math.round(parsedResult.confidence * 100)}%)`,
      judgeMethod: 'ai_judge'
    };

    console.log('AI判定完了:', {
      original: aiResult,
      parsed: parsedResult,
      final: finalResult
    });

    return finalResult;
    
  } catch (error) {
    console.error('判定エラー:', error);
    
    // エラー時は保守的に不正解として扱う
    return {
      isCorrect: false,
      reason: `判定中にエラーが発生しました: ${error.message}`,
      judgeMethod: 'error'
    };
  }
}

// 判定統計用（デバッグ・分析用）
export function getJudgeStats() {
  try {
    const stats = JSON.parse(localStorage.getItem('judgeStats') || '{}');
    return {
      exact_match: stats.exact_match || 0,
      keyword_match: stats.keyword_match || 0,
      keyword_mismatch: stats.keyword_mismatch || 0,
      empty_answer: stats.empty_answer || 0,
      type_mismatch: stats.type_mismatch || 0,
      language_mismatch: stats.language_mismatch || 0,
      give_up: stats.give_up || 0,
      ai_judge: stats.ai_judge || 0,
      error: stats.error || 0
    };
  } catch (error) {
    console.error('統計データの取得エラー:', error);
    return {};
  }
}

// 判定統計の記録
function recordJudgeMethod(method) {
  try {
    const stats = getJudgeStats();
    stats[method] = (stats[method] || 0) + 1;
    localStorage.setItem('judgeStats', JSON.stringify(stats));
  } catch (error) {
    console.error('統計記録エラー:', error);
  }
}

// 「分からない」選択用の判定結果生成
export function createDontKnowResult() {
  return {
    isCorrect: false,
    reason: '「分からない」を選択したため不正解です。',
    judgeMethod: 'dont_know'
  };
}

// デバッグ用: 判定過程の詳細ログを出力
export function debugJudgeProcess(question, referenceAnswer, userAnswer) {
  console.log('=== 判定デバッグ情報 ===');
  console.log('問題:', question);
  console.log('模範解答:', referenceAnswer);
  console.log('ユーザー回答:', userAnswer);
  
  // 正規化結果
  console.log('正規化結果:');
  console.log('  模範解答:', normalizeText(referenceAnswer));
  console.log('  ユーザー回答:', normalizeText(userAnswer));
  
  // キーワード抽出結果
  console.log('キーワード抽出:');
  console.log('  模範解答:', extractKeywords(referenceAnswer));
  console.log('  ユーザー回答:', extractKeywords(userAnswer));
  
  console.log('========================');
}
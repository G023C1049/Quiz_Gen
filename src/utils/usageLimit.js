// utils/usageLimit.js
// ポートフォリオ用: 1日あたりのゲームプレイ回数制限

const DAILY_LIMIT = 5;
const STORAGE_KEY = 'quizgen_usage';

/**
 * 今日の日付文字列を返す（YYYY-MM-DD形式）
 */
function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * localStorageから使用データを取得（当日分のみ有効）
 */
export function getUsageData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayString(), count: 0 };

    const data = JSON.parse(raw);
    // 日付が変わっていたらリセット
    if (data.date !== getTodayString()) {
      return { date: getTodayString(), count: 0 };
    }
    return data;
  } catch {
    return { date: getTodayString(), count: 0 };
  }
}

/**
 * プレイ可能かどうかを返す
 */
export function canPlay() {
  const { count } = getUsageData();
  return count < DAILY_LIMIT;
}

/**
 * 残り回数を返す
 */
export function getRemainingCount() {
  const { count } = getUsageData();
  return Math.max(0, DAILY_LIMIT - count);
}

/**
 * 使用回数を1増やして保存する
 */
export function incrementUsage() {
  const data = getUsageData();
  const updated = { ...data, count: data.count + 1 };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage書き込み失敗は無視
  }
}

/**
 * 翌日0:00までの残り時間を { hours, minutes, seconds } で返す
 */
export function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

/**
 * 1日の上限回数を返す（UI表示用）
 */
export function getDailyLimit() {
  return DAILY_LIMIT;
}

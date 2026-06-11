// components/LimitModal.jsx
// ポートフォリオ用: 回数制限到達時のモーダル

import React, { useState, useEffect } from 'react';
import { getTimeUntilReset, getDailyLimit } from '../utils/usageLimit';

export default function LimitModal({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());

  // 毎秒カウントダウンを更新
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div
        className="relative w-full max-w-md rounded-3xl p-8 text-center shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
          border: '1px solid rgba(139,92,246,0.4)',
        }}
      >
        {/* アイコン */}
        <div className="text-6xl mb-4 animate-bounce">🎯</div>

        {/* タイトル */}
        <h2 className="text-2xl font-bold text-white mb-2">
          本日の無料プレイ終了
        </h2>

        {/* 回数表示 */}
        <p className="text-purple-200 mb-6 text-sm leading-relaxed">
          デモ版のため、1日あたり <span className="text-yellow-300 font-bold">{getDailyLimit()}回</span> まで
          無料でプレイできます。<br />
          ご利用いただきありがとうございました！
        </p>

        {/* カウントダウン */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <p className="text-purple-300 text-xs mb-3 uppercase tracking-widest">
            リセットまで
          </p>
          <div className="flex justify-center gap-3">
            {[
              { value: pad(timeLeft.hours), label: '時間' },
              { value: pad(timeLeft.minutes), label: '分' },
              { value: pad(timeLeft.seconds), label: '秒' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span
                  className="text-4xl font-bold text-white tabular-nums px-3 py-2 rounded-xl"
                  style={{ backgroundColor: 'rgba(139,92,246,0.3)', minWidth: '64px' }}
                >
                  {value}
                </span>
                <span className="text-purple-300 text-xs mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ポートフォリオリンク案内 */}
        <p className="text-purple-300 text-xs mb-6">
          このアプリは Gemini AI を使ったポートフォリオ作品です。
        </p>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
          }}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

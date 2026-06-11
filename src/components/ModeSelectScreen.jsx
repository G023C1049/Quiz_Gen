import React from 'react';

export default function ModeSelectScreen({
  setCurrentScreen,
  playSound,
  setPlayMode,
  startGame,
  onSelectMode,
  remainingCount
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-800 via-purple-800 to-pink-800 px-4">
      <h2 className="text-4xl font-bold text-white mb-4">モードを選んでください</h2>

      {/* 残り回数バッジ */}
      <div className="mb-8">
        <span
          className="px-4 py-1 rounded-full text-sm font-bold"
          style={{
            backgroundColor: remainingCount > 0 ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${remainingCount > 0 ? 'rgba(52,211,153,0.6)' : 'rgba(239,68,68,0.6)'}`,
            color: remainingCount > 0 ? '#6ee7b7' : '#fca5a5',
          }}
        >
          {remainingCount > 0
            ? `🎮 今日あと ${remainingCount} 回`
            : '⛔ 本日の無料プレイ終了'}
        </span>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-md">
        <button
          className="bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold py-5 px-6 rounded-2xl text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={remainingCount === 0}
          onClick={() => {
            setPlayMode('genre');
            playSound && playSound('select');
            onSelectMode('genre');
          }}
        >
          🎯 ジャンルで遊ぶ
        </button>
        <button
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-5 px-6 rounded-2xl text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={remainingCount === 0}
          onClick={() => {
            setPlayMode('normal');
            playSound && playSound('start');
            startGame({ genreMode: false });
          }}
        >
          🔄 普通モード（ジャンルミックス）
        </button>
      </div>

      <button
        onClick={() => setCurrentScreen('title')}
        className="mt-12 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-8 rounded-full"
      >
        タイトルに戻る
      </button>
    </div>
  );
}

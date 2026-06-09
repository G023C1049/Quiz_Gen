import React from 'react';

export default function ModeSelectScreen({
  setCurrentScreen,
  playSound,
  setPlayMode,
  onSelectMode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-800 via-purple-800 to-pink-800 px-4">
      <h2 className="text-4xl font-bold text-white mb-10">モードを選んでください</h2>

      <div className="flex flex-col gap-6 w-full max-w-md">
        {/* ジャンル別出題 */}
        <button
          className="bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold py-5 px-6 rounded-2xl text-xl shadow-lg"
          onClick={() => {
            setPlayMode('genre');
            playSound && playSound('select');
            onSelectMode('genre');
          }}
        >
          ジャンルを選択
        </button>

        {/* 普通モード */}
        <button
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-5 px-6 rounded-2xl text-xl shadow-lg"
          onClick={() => {
            setPlayMode('normal');
            playSound && playSound('start');
            onSelectMode('normal');
          }}
        >
          ランダム
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

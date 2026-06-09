import React from "react";

export default function ResultScreen({
  gameResults,
  playMode,
  selectedGenre,
  customTopic,
  resetGame,
  playSound,
  setCurrentScreen,
  userGenreStats,
  genreList
}) {
  const { playerScore, totalQuestions } = gameResults || {};
  const correctAnswers = playerScore != null ? playerScore / 10 : 0;
  const percentage = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-200 via-green-200 to-blue-200">
      <h2 className="text-4xl font-bold mb-6 text-green-900">おつかれさまでした！</h2>
      <div className="bg-white bg-opacity-95 rounded-2xl shadow-lg p-8 mb-4 max-w-lg w-full text-center">
        <h3 className="text-2xl text-blue-800 font-bold mb-2">
          {playMode === 'genre' ? `ジャンル: ${selectedGenre}${customTopic ? `（${customTopic}）` : ''}` : "普通モード"}
        </h3>
        <div className="text-xl mb-2">正解数: <span className="font-bold text-blue-600">{correctAnswers} / {totalQuestions}</span></div>
        <div className="text-xl mb-4">正答率: <span className="font-bold text-green-600">{percentage}%</span></div>
      </div>
      <button
        className="text-lg bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-10 rounded-2xl font-bold shadow-lg hover:from-blue-700 hover:to-green-700 mt-6"
        onClick={() => {
          playSound && playSound('start');
          resetGame();
        }}
      >
        タイトルへ
      </button>
    </div>
  );
}

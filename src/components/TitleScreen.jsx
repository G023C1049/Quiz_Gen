import React from "react";
import { Radar } from "react-chartjs-2";
import "chart.js/auto";

export default function TitleScreen({
  setCurrentScreen,
  soundEnabled,
  setSoundEnabled,
  userGenreStats,
  genreList,
  remainingCount
}) {
  // レーダーチャート用データ作成
  const genres = genreList;
  const corrects = genres.map(g => userGenreStats[g]?.correct || 0);
  const totals = genres.map(
    g => (userGenreStats[g]?.correct || 0) + (userGenreStats[g]?.wrong || 0)
  );
  const rate = genres.map((g, i) =>
    totals[i] ? Math.round((corrects[i] / totals[i]) * 100) : 0
  );

  const chartData = {
    labels: genres,
    datasets: [
      {
        label: "正答率",
        data: rate,
        backgroundColor: "rgba(54,162,235,0.22)",
        borderColor: "rgba(54,162,235,0.8)",
        borderWidth: 3,
        pointBackgroundColor: "rgba(54,162,235,1)",
        pointRadius: 7
      }
    ]
  };
  const chartOptions = {
    scale: {
      angleLines: { display: true },
      min: 0,
      max: 100,
      ticks: { stepSize: 20, showLabelBackdrop: false },
      pointLabels: { font: { size: 18 } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sky-900 via-indigo-900 to-teal-900">
      <h1 className="text-5xl font-bold text-white mb-4 tracking-widest">Quiz GēN</h1>

      {/* 残り回数バッジ */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className="px-4 py-1 rounded-full text-sm font-bold"
          style={{
            backgroundColor: remainingCount > 0 ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${remainingCount > 0 ? 'rgba(52,211,153,0.6)' : 'rgba(239,68,68,0.6)'}`,
            color: remainingCount > 0 ? '#6ee7b7' : '#fca5a5',
          }}
        >
          {remainingCount > 0
            ? `🎮 今日あと ${remainingCount} 回プレイできます`
            : '⛔ 本日の無料プレイ終了（明日リセット）'}
        </span>
      </div>

      <button
        onClick={() => setCurrentScreen("modeSelect")}
        disabled={remainingCount === 0}
        className="mb-10 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold px-10 py-4 rounded-2xl text-2xl shadow-xl hover:from-green-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        スタート
      </button>

      <div className="w-full max-w-xl bg-white bg-opacity-90 rounded-2xl mb-6 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-blue-800 mb-3">ジャンルごとの累計正答数</h2>
        <table className="w-full mb-4">
          <thead>
            <tr className="text-blue-700">
              <th className="p-1">ジャンル</th>
              <th className="p-1">正解数</th>
              <th className="p-1">不正解数</th>
              <th className="p-1">正答率</th>
            </tr>
          </thead>
          <tbody>
            {genres.map((g, i) => (
              <tr key={g} className="text-center text-xl">
                <td className="p-1">{g}</td>
                <td className="p-1">{corrects[i]}</td>
                <td className="p-1">{userGenreStats[g]?.wrong || 0}</td>
                <td className="p-1">{totals[i] ? Math.round((corrects[i]/totals[i])*100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="w-full max-w-[400px] mx-auto">
          <Radar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="flex items-center mt-6">
        <label className="text-white mr-3 px-2 text-lg">効果音</label>
        <button
          onClick={() => setSoundEnabled(e => !e)}
          className={`w-24 px-3 py-2 rounded-full font-bold border-2 ${
            soundEnabled ? 'bg-blue-500 border-blue-700 text-white' :
            'bg-gray-300 border-gray-400 text-gray-700'
          }`}
        >
          {soundEnabled ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}

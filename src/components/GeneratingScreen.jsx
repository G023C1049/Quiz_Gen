import React from "react";

export default function GeneratingScreen({ customTopic, selectedGenre }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 via-blue-900 to-indigo-900">
      <div className="bg-white bg-opacity-90 rounded-2xl p-12 text-center shadow-2xl">
        <div className="text-2xl font-bold text-blue-700 mb-4">AIが問題を生成中です…</div>
        <div className="text-xl text-gray-700 mb-2">
          {customTopic || selectedGenre || "クイズ"}
        </div>
        <div className="animate-spin mx-auto mt-4 text-blue-700" style={{ fontSize: '2rem' }}>🔄</div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

const genres = ['雑学', 'アニメ', '映画', '歌詞', '歴史', '観光地'];

export default function GenreSelection({
  setCurrentScreen,
  setSelectedGenre,
  setCustomTopic,
  playSound,
  onSelect
}) {
  const [inputTopics, setInputTopics] = useState({});

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setCustomTopic(inputTopics[genre] || '');
    playSound && playSound('select');
    onSelect(genre, inputTopics[genre] || '');
    setCurrentScreen('game');
  };

  const handleInputChange = (genre, value) => {
    setInputTopics((prev) => ({
      ...prev,
      [genre]: value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4">
      <h2 className="text-4xl font-bold text-white mb-8">ジャンルとトピックを選択</h2>
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mb-12">
        {genres.map((genre, idx) => (
          <div
            key={genre}
            className={`relative bg-gradient-to-br ${
              idx % 2 === 0 ? 'from-purple-500 to-pink-500' : 'from-cyan-500 to-blue-500'
            } rounded-2xl p-6 shadow-lg`}
          >
            <div className="text-3xl mb-2 text-white text-center">{genre}</div>
            <input
              type="text"
              placeholder="トピックを入力（省略可）"
              value={inputTopics[genre] || ''}
              onChange={e => handleInputChange(genre, e.target.value)}
              className="w-full p-3 mt-2 rounded-lg text-gray-800"
            />
            <button
              onClick={() => handleGenreSelect(genre)}
              className="mt-4 w-full bg-white text-indigo-700 font-bold py-2 rounded-full hover:bg-indigo-100 transition-all"
            >
              このジャンルで開始 ▶️
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setCurrentScreen('modeSelect')}
        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-full"
      >
        モード選択に戻る
      </button>
    </div>
  );
}

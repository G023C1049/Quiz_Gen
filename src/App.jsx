// App.jsx (一括生成対応版)

import React, { useState, useEffect } from 'react';
import { generateBatchQuestionsWithAI } from './services/enhancedGeminiService';
import { canPlay, incrementUsage, getRemainingCount } from './utils/usageLimit';

// 各画面コンポーネント（既存のものを使用）
import TitleScreen from './components/TitleScreen';
import ModeSelectScreen from './components/ModeSelectScreen';
import GenreSelection from './components/GenreSelection';
import GeneratingScreen from './components/GeneratingScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import LimitModal from './components/LimitModal';

const genreList = ['雑学', 'アニメ', '映画', '歌詞', '歴史', '観光地'];

export default function App() {
  // ゲーム状態
  const [currentScreen, setCurrentScreen] = useState('title');
  const [playMode, setPlayMode] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  
  // 問題関連
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions] = useState(5);
  
  // ゲームプレイ状態
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameResults, setGameResults] = useState(null);
  
  // 設定
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userGenreStats, setUserGenreStats] = useState({});

  // 回数制限
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [remainingCount, setRemainingCount] = useState(getRemainingCount());

  // LocalStorageから統計データを読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userGenreStats');
      if (saved) {
        setUserGenreStats(JSON.parse(saved));
      }
    } catch (error) {
      console.error('統計データの読み込みエラー:', error);
    }
  }, []);

  // 統計データをLocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem('userGenreStats', JSON.stringify(userGenreStats));
    } catch (error) {
      console.error('統計データの保存エラー:', error);
    }
  }, [userGenreStats]);

  // 効果音再生（簡易実装）
  const playSound = (type) => {
    if (!soundEnabled) return;
    
    try {
      // Web Audio API を使用した簡易効果音
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          break;
        case 'incorrect':
          oscillator.frequency.setValueAtTime(196.00, audioContext.currentTime); // G3
          break;
        case 'timeup':
          oscillator.frequency.setValueAtTime(146.83, audioContext.currentTime); // D3
          break;
        case 'select':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
          break;
        case 'start':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          break;
        default:
          break;
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('効果音の再生に失敗:', error);
    }
  };

  // ジャンル統計記録
  const recordGenreStat = (genre, isCorrect) => {
    setUserGenreStats(prev => ({
      ...prev,
      [genre]: {
        correct: (prev[genre]?.correct || 0) + (isCorrect ? 1 : 0),
        wrong: (prev[genre]?.wrong || 0) + (isCorrect ? 0 : 1)
      }
    }));
  };

  // ゲームリセット
  const resetGame = () => {
    setCurrentScreen('title');
    setPlayMode('');
    setSelectedGenre('');
    setCustomTopic('');
    setCurrentQuestions([]);
    setCurrentQuestion(0);
    setUserAnswer('');
    setScore(0);
    setShowResult(false);
    setGameActive(false);
    setTimeLeft(60);
    setGameResults(null);
  };

  // モード選択ハンドラ
  const onSelectMode = (mode) => {
    if (mode === 'genre') {
      setCurrentScreen('genreSelection');
    } else if (mode === 'normal') {
      // 普通モードは即座にゲーム開始
      startGame({ genreMode: false });
    }
  };

  // ジャンル選択ハンドラ
  const onGenreSelect = async (genre, topic) => {
    setSelectedGenre(genre);
    setCustomTopic(topic);
    await startGame({ genreMode: true, genre, topic });
  };

  // ゲーム開始（一括問題生成対応）
  const startGame = async ({ genreMode = false, genre = '', topic = '' }) => {
    // 回数制限チェック
    if (!canPlay()) {
      setShowLimitModal(true);
      return;
    }

    try {
      // プレイ回数をカウントアップ
      incrementUsage();
      setRemainingCount(getRemainingCount());

      setCurrentScreen('generating');
      
      // 生成パラメータの設定
      const gameGenre = genreMode ? (genre || selectedGenre) : 
                       genreList[Math.floor(Math.random() * genreList.length)];
      const gameTopic = genreMode ? topic : '';
      
      console.log('ゲーム開始:', { gameGenre, gameTopic, totalQuestions });
      
      // 一括で全問題を生成
      const questions = await generateBatchQuestionsWithAI(
        gameGenre,
        gameTopic, 
        totalQuestions
      );
      
      console.log('生成された問題:', questions);
      
      // ゲーム状態を初期化
      setCurrentQuestions(questions);
      setCurrentQuestion(0);
      setScore(0);
      setUserAnswer('');
      setShowResult(false);
      setTimeLeft(60);
      setGameResults(null);
      
      // ゲーム画面に遷移してゲーム開始
      setCurrentScreen('game');
      setGameActive(true);
      
    } catch (error) {
      console.error('ゲーム開始エラー:', error);
      alert(`ゲーム開始に失敗しました: ${error.message}`);
      setCurrentScreen('modeSelect'); // エラー時はモード選択に戻る
    }
  };

  // 古い問題生成関数（後方互換性のため）
  const generateNextQuestion = async (questionIndex) => {
    // 既存のロジックとの互換性を保つためのフォールバック関数
    const fallbackQuestions = [
      {
        question: "日本の首都はどこですか？",
        answer: "東京",
        explanation: "日本の首都は東京です。",
        genre: "雑学"
      }
    ];
    
    return fallbackQuestions[0];
  };

  // 画面別レンダリング
  const renderScreen = () => {
    switch (currentScreen) {
      case 'title':
        return (
          <TitleScreen
            setCurrentScreen={setCurrentScreen}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            userGenreStats={userGenreStats}
            genreList={genreList}
            remainingCount={remainingCount}
          />
        );

      case 'modeSelect':
        return (
          <ModeSelectScreen
            setCurrentScreen={setCurrentScreen}
            playSound={playSound}
            setPlayMode={setPlayMode}
            onSelectMode={onSelectMode}
            remainingCount={remainingCount}
          />
        );

      case 'genreSelection':
        return (
          <GenreSelection
            setCurrentScreen={setCurrentScreen}
            setSelectedGenre={setSelectedGenre}
            setCustomTopic={setCustomTopic}
            playSound={playSound}
            onSelect={onGenreSelect}
          />
        );

      case 'generating':
        return (
          <GeneratingScreen
            customTopic={customTopic}
            selectedGenre={selectedGenre}
          />
        );

      case 'game':
        return (
          <GameScreen
            currentQuestions={currentQuestions}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            setCurrentQuestions={setCurrentQuestions}
            score={score}
            setScore={setScore}
            playMode={playMode}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            showResult={showResult}
            setShowResult={setShowResult}
            gameActive={gameActive}
            setGameActive={setGameActive}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            soundEnabled={soundEnabled}
            playSound={playSound}
            setCurrentScreen={setCurrentScreen}
            setGameResults={setGameResults}
            totalQuestions={totalQuestions}
            customTopic={customTopic}
            selectedGenre={selectedGenre}
            recordGenreStat={recordGenreStat}
            generateNextQuestion={generateNextQuestion}
          />
        );

      case 'result':
        return (
          <ResultScreen
            gameResults={gameResults}
            playMode={playMode}
            selectedGenre={selectedGenre}
            customTopic={customTopic}
            resetGame={resetGame}
            playSound={playSound}
            setCurrentScreen={setCurrentScreen}
            userGenreStats={userGenreStats}
            genreList={genreList}
          />
        );

      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
              <h1 className="text-2xl mb-4">画面エラー</h1>
              <button 
                onClick={resetGame}
                className="bg-blue-500 px-6 py-2 rounded hover:bg-blue-600"
              >
                タイトルに戻る
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* 回数制限モーダル（どの画面上でも表示） */}
      {showLimitModal && (
        <LimitModal onClose={() => setShowLimitModal(false)} />
      )}
      {renderScreen()}
    </>
  );
}
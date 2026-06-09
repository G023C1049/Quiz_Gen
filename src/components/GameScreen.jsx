// components/GameScreen.jsx (判定表示バグ修正版)

import React, { useEffect } from 'react';
import { judgeAnswerSmart } from '../services/smartJudgeService';
import { generateBatchQuestionsWithAI, useAIStatus, StatusDisplay } from '../services/enhancedGeminiService';
import { Trophy, Clock, Zap, Brain, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export default function GameScreen({
  currentQuestions,
  currentQuestion,
  setCurrentQuestion,
  setCurrentQuestions,
  score,
  setScore,
  playMode,
  userAnswer,
  setUserAnswer,
  showResult,
  setShowResult,
  gameActive,
  setGameActive,
  timeLeft,
  setTimeLeft,
  soundEnabled,
  playSound,
  setCurrentScreen,
  setGameResults,
  totalQuestions,
  customTopic,
  selectedGenre,
  recordGenreStat,
  generateNextQuestion,
}) {
  const currentQ = currentQuestions[currentQuestion];
  const [judgeResult, setJudgeResult] = React.useState(null); // 判定結果を一元管理
  const [judging, setJudging] = React.useState(false);
  const [canProceed, setCanProceed] = React.useState(false);
  
  // AI状態管理フック
  const [aiStatus, updateAIStatus] = useAIStatus();

  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameActive) {
      handleTimeUp();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameActive]);

  // 問題が不足している場合のチェック
  useEffect(() => {
    const remainingQuestions = totalQuestions - currentQuestion - 1;
    const availableQuestions = currentQuestions.length - currentQuestion - 1;
    
    if (remainingQuestions > 0 && availableQuestions < remainingQuestions && gameActive) {
      generateMissingQuestions();
    }
  }, [currentQuestion, currentQuestions.length, gameActive]);

  // 不足している問題を生成
  async function generateMissingQuestions() {
    const remainingQuestions = totalQuestions - currentQuestion - 1;
    const availableQuestions = currentQuestions.length - currentQuestion - 1;
    const neededQuestions = remainingQuestions - availableQuestions;
    
    if (neededQuestions <= 0) return;
    
    try {
      console.log(`追加で${neededQuestions}問生成します`);
      
      const newQuestions = await generateBatchQuestionsWithAI(
        selectedGenre || '雑学',
        customTopic,
        neededQuestions,
        updateAIStatus
      );
      
      setCurrentQuestions(prev => [...prev, ...newQuestions]);
    } catch (error) {
      console.error('追加問題生成エラー:', error);
      try {
        const nextQ = await generateNextQuestion(currentQuestion + 1);
        setCurrentQuestions(prev => [...prev, nextQ]);
      } catch (fallbackError) {
        console.error('フォールバック問題生成も失敗:', fallbackError);
      }
    }
  }

  // 「分からない」ボタンのハンドラ
  function handleDontKnow() {
    if (!gameActive || showResult || judging) return;

    // 判定結果を設定
    const result = {
      isCorrect: false,
      reason: '解答をスキップしました。',
      judgeMethod: 'dont_know'
    };
    
    setJudgeResult(result);
    playSound && playSound('incorrect');
    
    // 統計記録
    recordGenreStat(currentQ.genre, false);
    
    // 結果表示
    setShowResult(true);
    setGameActive(false);
    setCanProceed(true);
    
    // UI状態更新
    updateAIStatus({
      type: 'info',
      title: '回答をスキップしました',
      message: '次の問題に進んでください',
      isWaiting: false
    });
  }

  async function handleAnswer() {
    if (!userAnswer.trim() || showResult || judging) return;

    setJudging(true);
    setCanProceed(false);
    setJudgeResult(null); // 判定結果をクリア
    
    updateAIStatus({
      type: 'info',
      title: '回答を判定中...',
      message: '段階的判定システムで回答をチェックしています',
      isWaiting: true
    });

    try {
      // 段階的判定を使用
      const result = await judgeAnswerSmart({
        question: currentQ.question,
        referenceAnswer: currentQ.answer,
        userAnswer: userAnswer.trim(),
      });

      console.log('判定結果詳細:', result);
      
      // 判定結果を設定（一元管理）
      setJudgeResult(result);

      // スコア更新
      if (result.isCorrect) {
        setScore(prevScore => prevScore + 10);
        playSound && playSound('correct');
      } else {
        playSound && playSound('incorrect');
      }

      // 統計記録
      recordGenreStat(currentQ.genre, result.isCorrect);
      
      // 判定方法によってUI状態を更新
      const methodMessages = {
        'exact_match': '完全一致で判定しました',
        'keyword_match': 'キーワードマッチで判定しました', 
        'keyword_mismatch': 'キーワード不一致で判定しました',
        'empty_answer': '空回答として判定しました',
        'type_mismatch': '回答形式の不一致で判定しました',
        'language_mismatch': '言語の不一致で判定しました',
        'give_up': '諦め回答として判定しました',
        'ai_judge': 'AI判定を実行しました',
        'error': '判定中にエラーが発生しました'
      };
      
      updateAIStatus({
        type: result.isCorrect ? 'success' : 'info',
        title: '判定完了',
        message: methodMessages[result.judgeMethod] || '判定が完了しました',
        isWaiting: false
      });

    } catch (err) {
      console.error('判定エラー:', err);
      
      // エラー時の判定結果を設定
      const errorResult = {
        isCorrect: false,
        reason: `判定中にエラーが発生しました: ${err.message}`,
        judgeMethod: 'error'
      };
      
      setJudgeResult(errorResult);
      
      updateAIStatus({
        type: 'error',
        title: '判定エラー',
        message: `判定中にエラーが発生しました: ${err.message}`,
        isWaiting: false
      });
      
      playSound && playSound('timeup');
    } finally {
      setShowResult(true);
      setGameActive(false);
      setJudging(false);
      setCanProceed(true);
    }
  }

  function handleTimeUp() {
    const result = {
      isCorrect: false,
      reason: '時間切れです。',
      judgeMethod: 'timeout'
    };
    
    setJudgeResult(result);
    playSound && playSound('timeup');
    setShowResult(true);
    setGameActive(false);
    setCanProceed(true);
  }

  // 次の問題に進む処理
  function handleNextQuestion() {
    const nextIndex = currentQuestion + 1;

    if (nextIndex >= totalQuestions) {
      setGameResults({ playerScore: score, totalQuestions });
      setCurrentScreen('result');
      return;
    }

    setCurrentQuestion(nextIndex);
    setUserAnswer('');
    setTimeLeft(60);
    setGameActive(true);
    setShowResult(false);
    setJudgeResult(null); // 判定結果をクリア
    setCanProceed(false);
    
    // UI状態をクリア
    updateAIStatus(null);
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-blue-900 text-white">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📄</div>
          <div className="text-xl">問題を読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6">
      {/* AI状態表示 */}
      <StatusDisplay status={aiStatus} />
      
      {/* ゲーム進行情報 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            <span className="text-lg">問題 {currentQuestion + 1}/{totalQuestions}</span>
          </div>
          <div className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            <span className="text-lg">スコア: {score}</span>
          </div>
        </div>
        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-red-400" />
          <span className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : ''}`}>
            {timeLeft}秒
          </span>
        </div>
      </div>

      {/* 問題表示 */}
      <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-6">
        <div className="flex items-center mb-3">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            {currentQ.genre || selectedGenre}
          </span>
          {customTopic && (
            <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm ml-2">
              {customTopic}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-4">{currentQ.question}</h2>
        
        {/* 時間に応じた視覚的な緊急度表示 */}
        {timeLeft <= 10 && gameActive && (
          <div className="flex items-center text-red-400 mb-2">
            <Zap className="w-4 h-4 mr-2 animate-bounce" />
            <span className="text-sm">急いで！時間がありません！</span>
          </div>
        )}
      </div>

      {/* 回答入力エリア */}
      <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium mb-2">あなたの回答:</label>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && userAnswer.trim() && gameActive && !judging) {
              handleAnswer();
            }
          }}
          className="w-full p-4 rounded-lg text-black text-lg border-2 border-transparent focus:border-blue-500 focus:outline-none transition-all"
          disabled={!gameActive || showResult || judging || aiStatus?.isWaiting}
          placeholder="回答を入力してください...（分からない場合は下のボタンを押してください）"
          autoComplete="off"
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-3">
            <button
              onClick={handleAnswer}
              disabled={!gameActive || showResult || judging || aiStatus?.isWaiting || !userAnswer.trim()}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 py-3 rounded-lg font-bold text-white text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {judging ? '判定中...' : '回答する'}
            </button>
            
            <button
              onClick={handleDontKnow}
              disabled={!gameActive || showResult || judging || aiStatus?.isWaiting}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 px-6 py-3 rounded-lg font-bold text-white text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              分からない
            </button>
          </div>
          
          <div className="text-sm text-gray-300 text-center">
            {userAnswer.trim() ? 
              `${userAnswer.trim().length}文字入力済み` : 
              '回答を入力するか「分からない」を選択してください'
            }
            <br />
            <span className="text-xs">Enterキーでも回答送信できます</span>
          </div>
        </div>
      </div>

      {/* 判定中の表示 */}
      {judging && (
        <div className="bg-yellow-500 bg-opacity-20 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin mr-3">⚡</div>
            <div>
              <h3 className="font-bold text-yellow-200">段階的判定実行中...</h3>
              <p className="text-yellow-100 text-sm">
                完全一致 → キーワードマッチ → 明らかな不正解 → AI判定の順で確認しています
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 結果表示（修正版：judgeResultを使用） */}
      {showResult && judgeResult && (
        <div className={`rounded-xl p-6 shadow-lg mb-6 ${
          judgeResult.isCorrect 
            ? 'bg-green-500 bg-opacity-20 border-2 border-green-400' 
            : 'bg-red-500 bg-opacity-20 border-2 border-red-400'
        }`}>
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">
              {judgeResult.isCorrect ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {judgeResult.isCorrect ? '正解！' : '不正解'}
              </h3>
              <div className="text-sm opacity-75 mt-1">
                <span className="bg-blue-500 bg-opacity-50 px-2 py-1 rounded">
                  {judgeResult.judgeMethod === 'exact_match' && '完全一致'}
                  {judgeResult.judgeMethod === 'keyword_match' && 'キーワードマッチ'}
                  {judgeResult.judgeMethod === 'keyword_mismatch' && 'キーワード不一致'}
                  {judgeResult.judgeMethod === 'empty_answer' && '空回答'}
                  {judgeResult.judgeMethod === 'type_mismatch' && '回答形式不一致'}
                  {judgeResult.judgeMethod === 'language_mismatch' && '言語不一致'}
                  {judgeResult.judgeMethod === 'give_up' && '諦め回答'}
                  {judgeResult.judgeMethod === 'dont_know' && '分からない選択'}
                  {judgeResult.judgeMethod === 'ai_judge' && 'AI判定'}
                  {judgeResult.judgeMethod === 'timeout' && 'タイムアップ'}
                  {judgeResult.judgeMethod === 'error' && 'エラー'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {userAnswer.trim() && (
              <div>
                <span className="font-bold text-blue-200">あなたの回答: </span>
                <span className="text-lg">{userAnswer.trim()}</span>
              </div>
            )}
            
            <div>
              <span className="font-bold text-blue-200">模範解答: </span>
              <span className="text-lg">{currentQ.answer}</span>
            </div>
            
            <div>
              <span className="font-bold text-blue-200">判定結果: </span>
              <span>{judgeResult.reason}</span>
            </div>
            
            {currentQ.explanation && (
              <div>
                <span className="font-bold text-blue-200">解説: </span>
                <span className="text-sm">{currentQ.explanation}</span>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-center">
            {canProceed && (
              <button
                onClick={handleNextQuestion}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-3 rounded-lg font-bold text-white text-lg shadow-lg transition-all transform hover:scale-105 flex items-center"
              >
                {currentQuestion + 1 < totalQuestions ? (
                  <>
                    次の問題へ
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    結果を見る
                    <Trophy className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 bg-black bg-opacity-30 rounded p-3 text-xs">
          <div>問題ID: {currentQ.id}</div>
          <div>生成日時: {currentQ.createdAt}</div>
          <div>難易度: {currentQ.difficulty}</div>
          {judgeResult && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div>判定方法: {judgeResult.judgeMethod}</div>
              <div>正解判定: {judgeResult.isCorrect ? 'true' : 'false'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
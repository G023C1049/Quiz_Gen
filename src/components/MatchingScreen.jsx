export default function MatchingScreen({ progress }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-8">対戦相手を探しています</h2>
        <div className="w-64 h-4 bg-gray-700 rounded-full mx-auto mb-8">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="text-2xl text-white mb-4">{progress}%</div>
        <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-8" />
        <p className="text-gray-300">マッチング中...</p>
      </div>
    </div>
  );
}

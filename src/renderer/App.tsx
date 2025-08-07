export function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-ableton-dark)] to-black">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Sidekick
          </h1>
          <div className="h-1 w-24 bg-[var(--color-ableton-blue)] mx-auto rounded-full"></div>
        </div>
        <p className="text-xl text-gray-400 font-light">
          AI Music Generation for Ableton Live
        </p>
        <div className="pt-8">
          <p className="text-sm text-gray-500">
            Ready to generate your next loop
          </p>
        </div>
      </div>
    </div>
  );
}
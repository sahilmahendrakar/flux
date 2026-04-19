export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-5xl font-semibold tracking-tight">Flux</h1>
      <p className="mt-3 text-lg text-gray-400">AI agent task manager</p>
      <p className="mt-6 text-sm text-gray-600">
        Running on {window.electronAPI.platform}
      </p>
    </div>
  );
}

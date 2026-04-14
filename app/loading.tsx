export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      <div className="w-16 h-16 border-4 border-white/5 border-t-primary rounded-full animate-spin"></div>
      <p className="mt-8 text-white/40 font-custom font-bold uppercase tracking-[0.3em] text-xs">Initializing Performance</p>
    </div>
  );
}
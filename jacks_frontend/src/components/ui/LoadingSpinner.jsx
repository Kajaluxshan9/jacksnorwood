export default function LoadingSpinner({ message = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-pub-gold animate-pulse"
            style={{ animationDelay: `${i * 180}ms`, animationDuration: '1.1s' }}
          />
        ))}
      </div>
      {message && (
        <p className="text-stone-400 text-xs tracking-[0.2em] uppercase">{message}</p>
      )}
    </div>
  );
}

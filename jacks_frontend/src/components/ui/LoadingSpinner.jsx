export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 border-4 border-pub-gold/30 border-t-pub-gold rounded-full animate-spin"></div>
      <p className="text-white/50 text-sm">{message}</p>
    </div>
  );
}

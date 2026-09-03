const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-mint-100 via-mint-50 to-mint-100 rounded-xl h-4 w-full"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-mint-200 p-5 space-y-4 animate-pulse ${className}`}>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-mint-100 to-mint-50" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-gradient-to-r from-mint-100 to-mint-50 rounded-full w-1/3" />
        <div className="h-5 bg-gradient-to-r from-mint-100 to-mint-50 rounded-full w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gradient-to-r from-mint-100 to-mint-50 rounded-full w-full" />
      <div className="h-3 bg-gradient-to-r from-mint-100 to-mint-50 rounded-full w-2/3" />
    </div>
  </div>
);

export const SkeletonStatCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-mint-200 overflow-hidden animate-pulse ${className}`}>
    <div className="bg-gradient-to-r from-mint-100 to-mint-50 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-2.5 bg-white/60 rounded-full w-20" />
          <div className="h-7 bg-white/80 rounded-full w-14" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/40" />
      </div>
    </div>
    <div className="px-5 py-2.5 bg-mint-50">
      <div className="h-2.5 bg-mint-200 rounded-full w-2/3" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-mint-200 overflow-hidden animate-pulse ${className}`}>
    <div className="px-5 py-3 bg-mint-50 border-b border-mint-200">
      <div className="h-3 bg-mint-200 rounded-full w-1/4" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-4" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-8 h-8 rounded-lg bg-mint-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-mint-100 rounded-full w-1/3" />
            <div className="h-2.5 bg-mint-50 rounded-full w-1/2" />
          </div>
          <div className="w-16 h-6 rounded-full bg-mint-100" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;

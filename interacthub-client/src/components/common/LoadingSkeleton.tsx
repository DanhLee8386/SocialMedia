interface LoadingSkeletonProps {
  type?: 'post' | 'user' | 'text';
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-36" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>
      {/* Nội dung */}
      <div className="space-y-2">
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-3.5 w-5/6" />
        <SkeletonBlock className="h-3.5 w-4/6" />
      </div>
      {/* Ảnh */}
      <SkeletonBlock className="h-48 w-full rounded-md" />
      {/* Footer */}
      <div className="flex gap-4 pt-1">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
    </div>
  );
}

function UserSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
      <SkeletonBlock className="w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3.5 w-32" />
        <SkeletonBlock className="h-3 w-48" />
      </div>
      <SkeletonBlock className="h-8 w-20 rounded-md" />
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-3.5 w-full" />
      <SkeletonBlock className="h-3.5 w-11/12" />
      <SkeletonBlock className="h-3.5 w-4/5" />
      <SkeletonBlock className="h-3.5 w-3/5" />
    </div>
  );
}

export default function LoadingSkeleton({ type = 'post' }: LoadingSkeletonProps) {
  if (type === 'user') return <UserSkeleton />;
  if (type === 'text') return <TextSkeleton />;
  return <PostSkeleton />;
}

import React from 'react';

export const SkeletonBox: React.FC<React.HTMLAttributes<HTMLDivElement> & {width?: string; height?: string}> = ({width='full', height='4', className='', ...props}) => {
  const w = width === 'full' ? 'w-full' : width;
  const h = typeof height === 'string' ? `h-${height}` : `h-${height}`;
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${w} ${h} ${className}`}
      {...props}
    />
  );
};

export const SkeletonLine: React.FC<{width?: string; className?: string}> = ({width='full', className=''}) => (
  <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${width === 'full' ? 'w-full' : width} ${className} animate-pulse`} />
);

export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({length:4}).map((_,i) => (
      <div key={i} className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="w-3/5 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/3 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SessionHistorySkeleton: React.FC = () => (
  <div className="divide-y divide-gray-200">
    {Array.from({length:5}).map((_,i) => (
      <div key={i} className="w-full p-6 text-left">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-6 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-2/3 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const QuestionSkeleton: React.FC = () => (
  <div className="bg-gray-50 rounded-lg p-6 mb-6">
    <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse mb-3 mx-auto" />
    <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mx-auto" />
    <div className="mt-4 flex justify-center">
      <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
);

export default {
  SkeletonBox,
  SkeletonLine,
  StatsSkeleton,
  SessionHistorySkeleton,
  QuestionSkeleton
};

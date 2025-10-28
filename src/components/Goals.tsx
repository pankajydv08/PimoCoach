import { useEffect, useState } from 'react';

interface SessionSummary {
  id: string;
  created_at: string;
  avg_clarity_score?: number;
  avg_confidence_score?: number;
}

interface GoalsProps {
  sessions: SessionSummary[];
}

export default function Goals({ sessions }: GoalsProps) {
  const [clarityGoal, setClarityGoal] = useState<number>(() => {
    const raw = localStorage.getItem('pc_goal_clarity');
    return raw ? Number(raw) : 80;
  });

  const avgClarity = Math.round(
    (sessions.reduce((s, x) => s + (x.avg_clarity_score || 0), 0) / (sessions.length || 1)) || 0
  );

  useEffect(() => {
    localStorage.setItem('pc_goal_clarity', String(clarityGoal));
  }, [clarityGoal]);

  const progress = Math.min(100, Math.round((avgClarity / Math.max(clarityGoal, 1)) * 100));

  return (
    <div className="bg-card rounded-xl p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Goal: Clarity</h4>
      <div className="flex items-center gap-4 mb-3">
        <input
          type="number"
          value={clarityGoal}
          onChange={(e) => setClarityGoal(Number(e.target.value || 0))}
          className="w-24 p-2 border rounded-md"
        />
        <div className="text-sm text-gray-600">Target clarity %</div>
      </div>

      <div className="mb-2 text-sm text-gray-600">Current avg clarity: {avgClarity}%</div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className="h-3 bg-blue-600" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-2 text-xs text-gray-500">Progress: {progress}%</div>
    </div>
  );
}

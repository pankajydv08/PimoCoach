export function exportSessionToCSV(session: any, responses: any[]) {
  const headers = ['question_number', 'question_text', 'audio_transcript', 'clarity_score', 'confidence_score', 'gpt_evaluation'];

  const rows = responses.map((r) => [
    r.question_number,
    '"' + (r.interview_questions?.question_text?.replace(/"/g, '""') || '') + '"',
    '"' + (r.audio_transcript?.replace(/"/g, '""') || '') + '"',
    r.clarity_score ?? '',
    r.confidence_score ?? '',
    '"' + ((r.gpt_evaluation || '').replace(/"/g, '""')) + '"'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${session?.id || 'report'}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

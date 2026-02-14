// Serialize structured quiz data back to the .txt format
// that parseQuestionsFromText can parse.

const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * @param {Object} opts
 * @param {Object} opts.meta
 * @param {Array}  opts.questions
 * @returns {string}
 */
export function serializeQuiz({ meta = {}, questions = [] }) {
  const lines = [];

  // Metadata
  if (meta.name) lines.push(`# name=${meta.name}`);
  if (meta.questions) lines.push(`# questions=${meta.questions}`);
  if (meta.time) lines.push(`# time=${meta.time}`);
  if (meta.author) lines.push(`# author=${meta.author}`);
  if (meta.version) lines.push(`# version=${meta.version}`);
  if (lines.length > 0) lines.push('');

  let lastTopic = null;

  for (const q of questions) {
    // Topic
    if (q.topic && q.topic !== lastTopic) {
      lines.push(`@${q.topic}`);
      lastTopic = q.topic;
    }

    // Question text
    lines.push(q.text);

    // Answers
    q.answers.forEach((a, i) => {
      const label = a.label || LABELS[i];
      lines.push(`${label}. ${a.text}`);
    });

    if (q.type === 'match') {
      // Items (prefixed with >)
      (q.items || []).forEach((item) => {
        lines.push(`> ${item}`);
      });
      // Mapping line: labels in order corresponding to items
      const mapLabels = (q.correctMap || []).map((ansIdx) => {
        return q.answers[ansIdx]?.label || LABELS[ansIdx];
      });
      lines.push(mapLabels.join(''));
    } else {
      // Correct answer labels
      const correctLabels = (q.correct || []).map((idx) => {
        return q.answers[idx]?.label || LABELS[idx];
      });
      lines.push(correctLabels.join(''));
    }

    // Explanation
    if (q.explanation && q.explanation.trim()) {
      lines.push(`Explanation: ${q.explanation.trim()}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

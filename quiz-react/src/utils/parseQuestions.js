// Parse Domande.txt-like content into structured questions
// Supports topics (lines starting with '@'), variable number of answers,
// and single/multi-correct indicated by letters on the solution line.

export function parseQuestionsFromText(text) {
  const lines = text.split(/\r?\n/);
  const questions = [];
  let i = 0;
  let currentTopic = null;
  let meta = { questions: null, time: null };

  const isAnswerLine = (line) => /^(?:[A-Z])\.[\s]/.test(line);
  const cleanTopic = (line) => line.slice(1).replace(/[^a-zA-ZÀ-ÿ\s]+/g, '').trim();
  const tryParseMeta = (line) => {
    // Support lines like: # questions=20, # time=30, case-insensitive
    if (!line.startsWith('#')) return false;
    const m = line.slice(1).trim();
    const [k, v] = m.split('=').map((s) => s && s.trim());
    if (!k || !v) return true; // comment-like line, ignore
    const key = k.toLowerCase();
    const val = parseInt(v, 10);
    if (Number.isFinite(val)) {
      if (key.includes('question') || key === 'n') meta.questions = val;
      if (key.includes('time') || key.includes('timer') || key.includes('minute')) meta.time = val;
    }
    return true;
  };

  while (i < lines.length) {
    let line = lines[i]?.trim() ?? '';

    if (!line) { i++; continue; }

    // Parse optional metadata before questions
    if (line.startsWith('#')) { i += 1; tryParseMeta(line); continue; }

    if (line.startsWith('@')) { // topic line
      currentTopic = cleanTopic(line);
      i++; continue;
    }

    // Start of a question: non-empty line that is not an answer label and not a topic
    // Collect question text spanning multiple lines until an answer line
    const questionLines = [line];
    i++;
    while (i < lines.length && !isAnswerLine(lines[i]) && lines[i].trim()) {
      questionLines.push(lines[i].trim());
      i++;
    }
    const questionText = questionLines.join('\n');

    // Collect answer options (variable length)
    const answers = [];
    while (i < lines.length && isAnswerLine(lines[i])) {
      const raw = lines[i].trim();
      const label = raw[0];
      const text = raw.replace(/^[A-Z]\.\s*/, '');
      answers.push({ label, text });
      i++;
    }

    // After answers, decide: either a solution labels line (choice) or an items block starting with '>' (match), then a mapping labels line
    // Skip blank lines
    while (i < lines.length && !lines[i].trim()) i++;
    if (i >= lines.length) break;

    const peek = lines[i].trim();
    if (peek.startsWith('>')) {
      // Match-type: collect items first, then mapping labels
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const itemText = lines[i].trim().replace(/^>\s*/, '');
        if (itemText) items.push(itemText);
        i++;
      }
      // Next non-empty line must be mapping labels like ACBD or A C B D
      let mapLine = '';
      while (i < lines.length && !(mapLine = lines[i].trim())) i++;
      if (!mapLine) break;
      const mapLabels = (mapLine.match(/[A-Z]/g) || []).map((c) => c.toUpperCase());
      const labelIndex = Object.fromEntries(answers.map((a, idx) => [a.label, idx]));
      const correctMap = mapLabels
        .filter((lbl) => labelIndex[lbl] !== undefined)
        .map((lbl) => labelIndex[lbl]);

      questions.push({
        topic: currentTopic,
        type: 'match',
        text: questionText,
        items,
        answers,
        correctMap,
        multi: false,
      });
    } else {
      // Choice-type: this line is the solution letters
      const correctLabels = (peek.match(/[A-Z]/g) || []).map((c) => c.toUpperCase());
      const labelIndex = Object.fromEntries(answers.map((a, idx) => [a.label, idx]));
      const correctIndices = correctLabels
        .filter((lbl) => labelIndex[lbl] !== undefined)
        .map((lbl) => labelIndex[lbl]);
      const multiSelect = correctLabels.length > 1;

      questions.push({
        topic: currentTopic,
        type: multiSelect ? 'multiple' : 'single',
        text: questionText,
        answers,
        correct: correctIndices,
      });
    }

    // Skip any trailing blank lines
    i++;
    while (i < lines.length && !lines[i].trim()) i++;
  }

  return { questions, meta };
}

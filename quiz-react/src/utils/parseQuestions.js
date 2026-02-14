// Parse Domande.txt-like content into structured questions
// Supports topics (lines starting with '@'), variable number of answers,
// and single/multi-correct indicated by letters on the solution line.

function readExplanation(lines, startIndex) {
  const explanationLines = [];
  let i = startIndex;
  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) break;
    line = line.replace(/^Explanation:\s*/i, '').trim();
    if (line)
      explanationLines.push(line);
    i++;
  }
  return { explanation: explanationLines.join('\n'), nextIndex: i };
}

export function parseQuestionsFromText(text) {
  const lines = text.split(/\r?\n/);
  const questions = [];
  let i = 0;
  let currentTopic = null, overrideType = null;
  let meta = { questions: null, time: null };

  const isAnswerLine = (line) => /^(?:[A-Z])\.[\s]/.test(line);
  const cleanTopic = (line) => line.slice(1).replace(/[^a-zA-ZÀ-ÿ\s]+/g, '').trim();
  const tryParseMeta = (line) => {
    // Support lines like:
    // # quiz-name=My Quiz
    // # question(s)=20,
    // # time=30 (in minutes)
    // # author=Me
    // # version=1.0
    if (!line.startsWith('#'))
      return false;
    const m = line.slice(1).trim();
    const [k, v] = m.split('=').map((s) => s && s.trim());
    if (!k || !v)
      return true; // comment-like line, ignore
    const key = k.toLowerCase();
    const val = parseInt(v);
    if (key.includes('question') && Number.isFinite(val))
      meta.questions = val;
    if (key.includes('time') && Number.isFinite(val))
      meta.time = val;
    if (key === 'author')
      meta.author = v;
    if (key === 'version')
      meta.version = v;
    if (key.includes('name'))
      meta.name = v;
    return true;
  };

  while (i < lines.length) {
    let line = lines[i]?.trim() ?? '';
    let question = null;

    if (!line) { i++; continue; }

    // Parse optional metadata before questions
    if (line.startsWith('#')) {
      i += 1;
      tryParseMeta(line);
      continue
    }

    if (line.startsWith('@')) { // topic line
      if (line.includes('OverrideType=')) {
        let overridePart = line.split('OverrideType=')[1];
        overrideType = overridePart.split(/\s+/)[0].toLowerCase();
        if (overrideType !== 'single' && overrideType !== 'multiple' && overrideType !== 'match')
          overrideType = null;
      }
      else
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
      
      // Move past mapping labels line before reading explanation
      i++;
      const { explanation, nextIndex } = readExplanation(lines, i);
      i = nextIndex;

      question = {
        topic: currentTopic,
        type: 'match',
        text: questionText,
        items,
        answers,
        correctMap,
      }
    } else {
      // Choice-type: this line is the solution letters
      const correctLabels = (peek.match(/[A-Z]/g) || []).map((c) => c.toUpperCase());
      const labelIndex = Object.fromEntries(answers.map((a, idx) => [a.label, idx]));
      const correctIndices = correctLabels
        .filter((lbl) => labelIndex[lbl] !== undefined)
        .map((lbl) => labelIndex[lbl]);
      const multiSelect = correctLabels.length > 1;

      // Move past solution labels line before reading explanation
      i++;

      question = {
        topic: currentTopic,
        type: multiSelect ? 'multiple' : 'single',
        text: questionText,
        answers,
        correct: correctIndices,
      }
    }
    
    const { explanation, nextIndex } = readExplanation(lines, i);
    i = nextIndex;
    question.explanation = explanation;

    if (overrideType) {
      question.type = overrideType;
      overrideType = null;
    }
    questions.push(question);

    // Skip any trailing blank lines
    i++;
    while (i < lines.length && !lines[i].trim()) i++;
  }

  return { questions, meta };
}

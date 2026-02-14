import React, { useState } from 'react'
import { serializeQuiz } from '../utils/serializeQuestions'
import { parseQuestionsFromText } from '../utils/parseQuestions'

const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function emptyAnswer(index) {
  return { label: LABELS[index] || String.fromCharCode(65 + index), text: '' }
}

function emptyQuestion() {
  return {
    topic: '',
    type: 'single',
    text: '',
    answers: [emptyAnswer(0), emptyAnswer(1), emptyAnswer(2)],
    correct: [],
    items: [],
    correctMap: [],
    explanation: '',
  }
}

/* ─── Individual question editor ────────────────────────── */
function QuestionEditor({ q, index, topics, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [collapsed, setCollapsed] = useState(false)

  const update = (patch) => onChange(index, { ...q, ...patch })

  const setType = (type) => {
    const patch = { type, correct: [], correctMap: [], items: [] }
    if (type === 'match') {
      patch.items = q.answers.map(() => '')
      patch.correctMap = q.answers.map((_, i) => i)
    }
    update(patch)
  }

  const updateAnswer = (ai, text) => {
    const answers = q.answers.map((a, i) => (i === ai ? { ...a, text } : a))
    update({ answers })
  }

  const addAnswer = () => {
    const answers = [...q.answers, emptyAnswer(q.answers.length)]
    const patch = { answers }
    if (q.type === 'match') {
      patch.items = [...(q.items || []), '']
      patch.correctMap = [...(q.correctMap || []), q.answers.length]
    }
    update(patch)
  }

  const removeAnswer = (ai) => {
    if (q.answers.length <= 2) return
    const answers = q.answers.filter((_, i) => i !== ai).map((a, i) => ({ ...a, label: LABELS[i] }))
    const patch = { answers }
    if (q.type === 'match') {
      const items = (q.items || []).filter((_, i) => i !== ai)
      const correctMap = (q.correctMap || [])
        .filter((_, i) => i !== ai)
        .map((v) => (v > ai ? v - 1 : v))
      patch.items = items
      patch.correctMap = correctMap
    } else {
      patch.correct = (q.correct || []).filter((c) => c !== ai).map((c) => (c > ai ? c - 1 : c))
    }
    update(patch)
  }

  const toggleCorrect = (ai) => {
    if (q.type === 'single') {
      update({ correct: [ai] })
    } else {
      const cur = q.correct || []
      const next = cur.includes(ai) ? cur.filter((c) => c !== ai) : [...cur, ai]
      update({ correct: next })
    }
  }

  const updateItem = (ii, text) => {
    const items = (q.items || []).map((it, i) => (i === ii ? text : it))
    update({ items })
  }

  const updateMap = (ii, ansIdx) => {
    const correctMap = [...(q.correctMap || [])]
    correctMap[ii] = ansIdx
    update({ correctMap })
  }

  const preview = () => {
    const typeLabel = q.type === 'single' ? 'Single' : q.type === 'multiple' ? 'Multiple' : 'Match'
    const txt = q.text || '(no text)'
    return `${txt.length > 60 ? txt.slice(0, 57) + '...' : txt}`
  }

  return (
    <div className="card grid create-question">
      <div className="row" onClick={() => setCollapsed(!collapsed)}>
        <b>Q{index + 1}</b>
        <span className="small truncate flex-1">
          {preview()}
        </span>
        <span className="badge" style={{ fontSize: '0.7rem' }}>{q.type}</span>
        <span>{collapsed ? '▸' : '▾'}</span>
      </div>

      {!collapsed && (
        <div className="grid" style={{ gap: 12 }}>
          {/* Topic */}
          <div className="row">
            <label>Topic:</label>
            <input
              type="text"
              list="topic-list"
              placeholder="e.g. Mathematics"
              value={q.topic}
              onChange={(e) => update({ topic: e.target.value })}
              className="flex-1"
            />
            <datalist id="topic-list">
              {topics.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>

          {/* Type */}
          <div className="row">
            <label>Type:</label>
            <select value={q.type} onChange={(e) => setType(e.target.value)}>
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choice</option>
              <option value="match">Match</option>
            </select>
          </div>

          {/* Question text */}
          <div className="grid" style={{ gap: 4 }}>
            <label>Question text:</label>
            <textarea
              rows={2}
              value={q.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Enter your question here..."
              className="create-textarea"
            />
          </div>

          {/* Answers */}
          <div className="grid" style={{ gap: 6 }}>
            <label>Answers:</label>
            {q.answers.map((a, ai) => (
              <div className="row" key={ai}>
                <span className="badge">{a.label}</span>
                {q.type !== 'match' && (
                  <input
                    type={q.type === 'single' ? 'radio' : 'checkbox'}
                    name={`q${index}-correct`}
                    checked={(q.correct || []).includes(ai)}
                    onChange={() => toggleCorrect(ai)}
                    title="Mark as correct"
                  />
                )}
                <input
                  type="text"
                  value={a.text}
                  onChange={(e) => updateAnswer(ai, e.target.value)}
                  placeholder={`Answer ${a.label}`}
                  className="flex-1"
                />
                {q.answers.length > 2 && (
                  <button className="danger btn-sm"
                    onClick={() => removeAnswer(ai)}>✕</button>
                )}
              </div>
            ))}
            <button className="secondary btn-sm" style={{ justifySelf: 'start' }}
              onClick={addAnswer}>+ Add answer</button>
          </div>

          {/* Match items */}
          {q.type === 'match' && (
            <div className="grid" style={{ gap: 6 }}>
              <label>Items to match:</label>
              {(q.items || []).map((item, ii) => (
                <div className="row" key={ii}>
                  <span className="small">{'>'}</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(ii, e.target.value)}
                    placeholder={`Item ${ii + 1}`}
                    className="flex-1"
                  />
                  <span className="small">→</span>
                  <select
                    value={q.correctMap?.[ii] ?? 0}
                    onChange={(e) => updateMap(ii, parseInt(e.target.value))}
                  >
                    {q.answers.map((a, ai) => (
                      <option key={ai} value={ai}>{a.label}. {a.text || '...'}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div className="grid" style={{ gap: 4 }}>
            <label>Explanation (optional):</label>
            <textarea
              rows={2}
              value={q.explanation}
              onChange={(e) => update({ explanation: e.target.value })}
              placeholder="Explain the correct answer..."
              className="create-textarea"
            />
          </div>

          {/* Actions */}
          <div className="row">
            {!isFirst && <button className="secondary btn-sm" onClick={() => onMoveUp(index)}>↑ Move up</button>}
            {!isLast && <button className="secondary btn-sm" onClick={() => onMoveDown(index)}>↓ Move down</button>}
            <button className="danger btn-sm ml-auto" onClick={() => onRemove(index)}>Delete question</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Save modal ────────────────────────────────────────── */
function CreateSaveModal({ show, name, onChangeName, onCancel, onSaveFile, onSaveApp }) {
  if (!show) return null
  return (
    <div className="modal">
      <div className="modal-content grid">
        <h1>Save quiz</h1>
        <div className="row">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            className="flex-1"
            placeholder="My Quiz"
          />
        </div>
        <div className="footer">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <div className="row" style={{ gap: 8 }}>
            <button className="success" onClick={onSaveApp}>Save to app</button>
            <button onClick={onSaveFile}>Download .txt</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Preview modal ─────────────────────────────────────── */
function PreviewModal({ show, text, onClose }) {
  if (!show) return null
  return (
    <div className="modal">
      <div className="modal-content grid" style={{ maxHeight: '80vh', overflow: 'auto' }}>
        <h1>Preview</h1>
        <pre className="create-preview">{text}</pre>
        <div className="footer">
          <span />
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Create component ─────────────────────────────── */
export default function Create({ onBack, onSaveToApp, editQuiz }) {
  const [meta, setMeta] = useState(() => {
    if (editQuiz?.meta) {
      const m = editQuiz.meta
      return {
        name: m.name || '',
        questions: m.questions != null ? String(m.questions) : '',
        time: m.time != null ? String(m.time) : '',
        author: m.author || '',
        version: m.version || '',
      }
    }
    return { name: '', questions: '', time: '', author: '', version: '' }
  })
  const [questions, setQuestions] = useState(() => {
    if (editQuiz?.questions?.length > 0) return editQuiz.questions
    return [emptyQuestion()]
  })
  const [showSave, setShowSave] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [saveName, setSaveName] = useState('')

  // Collect all unique topics for the datalist suggestions
  const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))]

  const updateQuestion = (idx, q) => {
    const next = [...questions]
    next[idx] = q
    setQuestions(next)
  }

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const next = [...questions]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setQuestions(next)
  }

  const moveDown = (idx) => {
    if (idx >= questions.length - 1) return
    const next = [...questions]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setQuestions(next)
  }

  const addQuestion = () => {
    const last = questions[questions.length - 1]
    const newQ = emptyQuestion()
    if (last) newQ.topic = last.topic // inherit topic from last question
    setQuestions([...questions, newQ])
  }

  const buildMeta = () => {
    const m = {}
    if (meta.name) m.name = meta.name
    if (meta.questions) m.questions = parseInt(meta.questions)
    if (meta.time) m.time = parseInt(meta.time)
    if (meta.author) m.author = meta.author
    if (meta.version) m.version = meta.version
    return m
  }

  const buildQuiz = () => {
    return serializeQuiz({ meta: buildMeta(), questions })
  }

  const validate = () => {
    const errors = []
    questions.forEach((q, i) => {
      if (!q.text.trim()) errors.push(`Q${i + 1}: missing question text`)
      const filledAnswers = q.answers.filter((a) => a.text.trim())
      if (filledAnswers.length < 2) errors.push(`Q${i + 1}: needs at least 2 answers`)
      if (q.type !== 'match' && (!q.correct || q.correct.length === 0))
        errors.push(`Q${i + 1}: no correct answer selected`)
      if (q.type === 'match') {
        const filledItems = (q.items || []).filter((it) => it.trim())
        if (filledItems.length === 0) errors.push(`Q${i + 1}: match type needs at least 1 item`)
      }
    })
    return errors
  }

  const handleSaveRequest = () => {
    const errors = validate()
    if (errors.length > 0) {
      alert('Please fix these issues:\n\n' + errors.join('\n'))
      return
    }
    setSaveName(meta.name || 'My Quiz')
    setShowSave(true)
  }

  const handlePreview = () => {
    setShowPreview(true)
  }

  const handleDownloadFile = () => {
    const text = buildQuiz()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${saveName || 'quiz'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setShowSave(false)
  }

  const handleSaveToApp = () => {
    const text = buildQuiz()
    const parsedQuiz = parseQuestionsFromText(text)
    const n = meta.questions ? parseInt(meta.questions) : questions.length
    const t = meta.time ? parseInt(meta.time) : questions.length
    onSaveToApp(saveName.trim() || 'My Quiz', parsedQuiz)
    setShowSave(false)
  }

  const validCount = questions.filter((q) => q.text.trim() && q.answers.filter((a) => a.text.trim()).length >= 2).length

  return (
    <>
      <div className="card grid">
        <div className="row">
          <button className="secondary" onClick={onBack}>← Back</button>
          <h1 style={{ margin: 0 }}>Create a new quiz</h1>
        </div>

        {/* Meta */}
        <details className="create-details" open>
          <summary>Quiz settings (metadata)</summary>
          <div className="grid">
            <div className="row">
              <label>Quiz name:</label>
              <input type="text" value={meta.name}
                onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                placeholder="My Quiz" className="flex-1" />
            </div>
            <div className="row">
              <label>Default questions:</label>
              <input type="number" min={1} value={meta.questions}
                onChange={(e) => setMeta({ ...meta, questions: e.target.value })}
                placeholder={String(questions.length)} />
            </div>
            <div className="row">
              <label>Time (minutes):</label>
              <input type="number" min={1} value={meta.time}
                onChange={(e) => setMeta({ ...meta, time: e.target.value })}
                placeholder={String(questions.length)} />
            </div>
            <div className="row">
              <label>Author:</label>
              <input type="text" value={meta.author}
                onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                placeholder="Your name" className="flex-1" />
            </div>
            <div className="row">
              <label>Version:</label>
              <input type="text" value={meta.version}
                onChange={(e) => setMeta({ ...meta, version: e.target.value })}
                placeholder="1.0" style={{ width: 80 }} />
            </div>
          </div>
        </details>
      </div>

      {/* Questions */}
      <div className="grid">
        {questions.map((q, i) => (
          <QuestionEditor
            key={i}
            q={q}
            index={i}
            topics={topics}
            onChange={updateQuestion}
            onRemove={removeQuestion}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            isFirst={i === 0}
            isLast={i === questions.length - 1}
          />
        ))}
      </div>

      {/* Bottom bar */}
      <div className="card">
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="secondary" onClick={addQuestion}>+ Add question</button>
          <span className="small flex-1" style={{ textAlign: 'center' }}>{validCount} / {questions.length} questions valid</span>
          <button className="secondary" onClick={handlePreview}>Preview</button>
          <button className="success" onClick={handleSaveRequest}>Save quiz</button>
        </div>
      </div>

      <CreateSaveModal
        show={showSave}
        name={saveName}
        onChangeName={setSaveName}
        onCancel={() => setShowSave(false)}
        onSaveFile={handleDownloadFile}
        onSaveApp={handleSaveToApp}
      />

      <PreviewModal
        show={showPreview}
        text={buildQuiz()}
        onClose={() => setShowPreview(false)}
      />
    </>
  )
}

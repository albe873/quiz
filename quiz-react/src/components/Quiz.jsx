import React, { useEffect, useRef, useState } from 'react'

function Option({ type, checked, onChange, label, text }) {
  return (
    <label className={`option`}>
      <input type={type} checked={checked} onChange={onChange} />
      <span>{text}</span>
    </label>
  )
}

function MatchOption({ item, answers, value, onChange }) {
  return (
    <div className="option" style={{ justifyContent: 'space-between' }}>
      <span>{item}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {answers.map((a) => (
          <option key={a.label} value={a.label}>{a.text}</option>
        ))}
      </select>
    </div>
  )
}

function QuizHeader({ idx, total, topic, mins, secs }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <div>
        <div className="badge">Question {idx + 1}/{total}</div>
        {topic && <div className="topic">{topic}</div>}
      </div>
      <div className="badge">{mins}:{secs.toString().padStart(2, '0')}</div>
    </div>
  )
}

function QuizOptions({ q, isSingle, selected, onToggle, onSelectItem }) {
  switch (q.type) {
    case 'match':
      return (
        <div className="options">
          {q.items.map((it, itemIdx) => (
            <MatchOption
              key={itemIdx}
              item={it}
              answers={q.answers}
              value={selected[itemIdx]}
              onChange={(label) => onSelectItem(itemIdx, label)}
            />
          ))}
        </div>
      )
    default:
      return (
        <div className="options">
          {q.answers.map((a) => (
            <Option
              key={a.label}
              type={isSingle ? 'radio' : 'checkbox'}
              checked={selected.has(a.label)}
              onChange={() => onToggle(a.label)}
              label={a.label}
              text={a.text}
            />
          ))}
        </div>
      )
  }
}

function QuizQuestion({ q, isSingle, selected, onToggle, onSelectItem }) {
  return (
    <>
    <h1 className="question-text">{q.text}</h1>
    <QuizOptions q={q} isSingle={isSingle} selected={selected} onToggle={onToggle} onSelectItem={onSelectItem} />
    </>
  )
}

function ProgressBar({ progressPct }) {
  return (
    <div className="progress"><div style={{ width: `${progressPct}%` }} /></div>
  )
}

function QuizFooter({ idx, total, onPrev, onNext, onFinishRequest }) {
  return (
    <div className="footer">
      <div className="row">
        <button className="secondary" onClick={onPrev} disabled={idx === 0}>Previous</button>
        <button className="secondary" onClick={onNext} disabled={idx === total - 1}>Next</button>
      </div>
      <button onClick={onFinishRequest}>Finish</button>
    </div>
  )
}

function ConfirmModal({ title, message, onCancel, onConfirm, confirmLabel = 'Confirm', confirmClass = 'danger' }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h1>{title}</h1>
        <div className="row">
          <span className="small">{message}</span>
        </div>
        <div className="footer">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button className={confirmClass} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function Quiz({ questions, minutes, onFinish }) {
  const total = questions.length
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState(() => questions.map((q) => (q.type === 'match' ? Array(q.items.length).fill(null) : new Set())))
  const [secsLeft, setSecsLeft] = useState(minutes * 60)
  const timerRef = useRef(null)
  const [showFinishModal, setShowFinishModal] = useState(false)

  useEffect(() => {
    timerRef.current = setInterval(() => setSecsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (secsLeft === 0) onFinish(answers)
  }, [secsLeft])

  const q = questions[idx]
  const isSingle = q.type === 'single'
  const selected = answers[idx]

  const progressPct = Math.round(((idx + 1) / total) * 100)
  const mins = Math.floor(secsLeft / 60)
  const secs = secsLeft % 60

  const toggle = (label) => {
    setAnswers((prev) => {
      const next = prev.map((s) => (Array.isArray(s) ? [...s] : new Set(s)))
      if (!Array.isArray(next[idx])) {
        if (isSingle) {
          next[idx] = new Set([label])
        } else {
          const set = next[idx]
          if (set.has(label)) set.delete(label)
          else set.add(label)
        }
      }
      return next
    })
  }

  const selectItem = (itemIdx, label) => {
    setAnswers((prev) => {
      const next = prev.map((s, i) => (i === idx ? (Array.isArray(s) ? [...s] : new Set(s)) : (Array.isArray(s) ? [...s] : new Set(s))))
      if (Array.isArray(next[idx])) {
        next[idx][itemIdx] = label || null
      }
      return next
    })
  }

  const go = (d) => setIdx((i) => Math.min(Math.max(i + d, 0), total - 1))

  return (
    <div className="card grid">
      <QuizHeader idx={idx} total={total} topic={q.topic} mins={mins} secs={secs} />
      <QuizQuestion q={q} isSingle={isSingle} selected={selected} onToggle={toggle} onSelectItem={selectItem} />
      <ProgressBar progressPct={progressPct} />
      <QuizFooter
        idx={idx}
        total={total}
        onPrev={() => go(-1)}
        onNext={() => go(+1)}
        onFinishRequest={() => setShowFinishModal(true)}
      />
      {showFinishModal && (
        <ConfirmModal
          title="Finish quiz"
          message="This will submit your answers and show results."
          onCancel={() => setShowFinishModal(false)}
          onConfirm={() => { setShowFinishModal(false); onFinish(answers) }}
          confirmLabel="Confirm"
          confirmClass="danger"
        />
      )}
    </div>
  )
}

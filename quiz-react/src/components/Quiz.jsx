import React, { useEffect, useRef, useState } from 'react'

function Option({ type, checked, onChange, label, text }) {
  return (
    <label className={`option`}>
      <input type={type} checked={checked} onChange={onChange} />
      <strong>{label}.</strong>
      <span>{text}</span>
    </label>
  )
}

export default function Quiz({ questions, minutes, onFinish }) {
  const total = questions.length
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState(() => questions.map(() => new Set()))
  const [secsLeft, setSecsLeft] = useState(minutes * 60)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setSecsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (secsLeft === 0) onFinish(answers)
  }, [secsLeft])

  const q = questions[idx]
  const isSingle = !q.multi
  const selected = answers[idx]

  const progressPct = Math.round(((idx + 1) / total) * 100)
  const mins = Math.floor(secsLeft / 60)
  const secs = secsLeft % 60

  const toggle = (label) => {
    setAnswers((prev) => {
      const next = prev.map((s) => new Set(s))
      if (isSingle) {
        next[idx] = new Set([label])
      } else {
        const set = next[idx]
        if (set.has(label)) set.delete(label)
        else set.add(label)
      }
      return next
    })
  }

  const go = (d) => setIdx((i) => Math.min(Math.max(i + d, 0), total - 1))

  return (
    <div className="card grid">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="badge">Question {idx + 1}/{total}</div>
          {q.topic && <div className="topic">{q.topic}</div>}
        </div>
        <div className="badge">{mins}:{secs.toString().padStart(2, '0')}</div>
      </div>
      <h1>{q.text}</h1>
      <div className="options">
        {q.answers.map((a) => (
          <Option
            key={a.label}
            type={isSingle ? 'radio' : 'checkbox'}
            checked={selected.has(a.label)}
            onChange={() => toggle(a.label)}
            label={a.label}
            text={a.text}
          />
        ))}
      </div>
      <div className="progress"><div style={{ width: `${progressPct}%` }} /></div>
      <div className="footer">
        <div className="row">
          <button className="secondary" onClick={() => go(-1)} disabled={idx === 0}>Previous</button>
          <button className="secondary" onClick={() => go(+1)} disabled={idx === total - 1}>Next</button>
        </div>
        <button onClick={() => onFinish(answers)}>Finish</button>
      </div>
    </div>
  )
}

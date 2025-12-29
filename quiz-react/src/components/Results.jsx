import React, { useMemo } from 'react'

export default function Results({ questions, selections, onRestart }) {
  const items = useMemo(() => {
    return questions.map((q, i) => {
      const selected = selections[i]
      const correctLabels = q.correct.map((idx) => q.answers[idx].label)
      const selLabels = Array.from(selected)
      const isCorrect = correctLabels.length === selLabels.length && correctLabels.every((l) => selected.has(l))
      return { q, correctLabels, selLabels, isCorrect, selected }
    })
  }, [questions, selections])

  const totalCorrect = items.filter((x) => x.isCorrect).length

  return (
    <div className="card grid results">
      <h1>Results</h1>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="badge">Correct: {totalCorrect}/{questions.length}</div>
        <button onClick={onRestart}>Restart</button>
      </div>
      <hr />
      <div className="grid">
        {items.map(({ q, correctLabels, selLabels, isCorrect, selected }, i) => (
          <div key={i} className={`card`}>
            <div className={`summary ${isCorrect ? 'correct' : 'incorrect'}`} style={{ marginBottom: 8 }}>
              <div style={{ minWidth: 80 }}>
                <div className="badge">#{i + 1}</div>
                {q.topic && <div className="topic">{q.topic}</div>}
              </div>
              <div>
                <div><strong>{q.text}</strong></div>
                <div className="small">Correct answer: {[...correctLabels].sort((a, b) => a.localeCompare(b)).join(', ')}</div>
                <div className="small">Your answer: {selLabels.length ? [...selLabels].sort((a, b) => a.localeCompare(b)).join(', ') : '—'}</div>
              </div>
            </div>
            <div className="options">
              {[...q.answers]
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((a) => {
                  const ok = correctLabels.includes(a.label)
                  const chosen = selected.has(a.label)
                  const cls = chosen ? (ok ? 'correct' : 'incorrect') : (ok ? 'missed' : '')
                  return (
                    <div key={a.label} className={`option ${cls}`}>
                      <strong>{a.label}.</strong>
                      <span>{a.text}</span>
                      <div className="row" style={{ marginLeft: 'auto' }}>
                        {ok && <span className="badge">Correct</span>}
                        {chosen && <span className="badge">Selected</span>}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

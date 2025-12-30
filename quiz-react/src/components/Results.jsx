import React, { useMemo } from 'react'

function ResultsHeader({ totalCorrect, totalQuestions, onRestart }) {
  return (
    <>
      <h1>Results</h1>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="badge">Correct: {totalCorrect}/{totalQuestions}</div>
        <button onClick={onRestart}>Restart</button>
      </div>
      <hr />
    </>
  )
}

function ResultsItem({ index, q, correctLabels, selLabels, isCorrect, selected }) {
  return (
    <div className={`card`}>
      <div className={`summary ${isCorrect ? 'correct' : 'incorrect'}`} style={{ marginBottom: 8 }}>
        <div style={{ minWidth: 80 }}>
          <div className="badge">#{index + 1}</div>
          {q.topic && <div className="topic">{q.topic}</div>}
        </div>
        <div>
          <div><strong>{q.text}</strong></div>
          <div className="small">Correct answer: {[...correctLabels].sort((a, b) => a.localeCompare(b)).join(', ')}</div>
          <div className="small">Your answer: {selLabels.length ? [...selLabels].sort((a, b) => a.localeCompare(b)).join(', ') : '—'}</div>
        </div>
      </div>
      <ResultsAnswers q={q} correctLabels={correctLabels} selected={selected} />
    </div>
  )
}

function ResultsList({ items }) {
  return (
    <div className="grid">
      {items.map(({ q, correctLabels, selLabels, isCorrect, selected }, i) => (
        <ResultsItem
          key={i}
          index={i}
          q={q}
          correctLabels={correctLabels}
          selLabels={selLabels}
          isCorrect={isCorrect}
          selected={selected}
        />
      ))}
    </div>
  )
}

function ResultAnswerOption({ a, correctLabels, selected }) {
  const ok = correctLabels.includes(a.label)
  const chosen = selected.has(a.label)
  const cls = chosen ? (ok ? 'correct' : 'incorrect') : (ok ? 'missed' : '')
  return (
    <div className={`option ${cls}`}>
      <strong>{a.label}.</strong>
      <span>{a.text}</span>
      <div className="row" style={{ marginLeft: 'auto' }}>
        {ok && <span className="badge">Correct</span>}
        {chosen && <span className="badge">Selected</span>}
      </div>
    </div>
  )
}

function ResultsAnswers({ q, correctLabels, selected }) {
  return (
    <div className="options">
      {[...q.answers]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((a) => (
          <ResultAnswerOption key={a.label} a={a} correctLabels={correctLabels} selected={selected} />
        ))}
    </div>
  )
}

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
      <ResultsHeader totalCorrect={totalCorrect} totalQuestions={questions.length} onRestart={onRestart} />
      <ResultsList items={items} />
    </div>
  )
}

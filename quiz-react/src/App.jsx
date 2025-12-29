import React, { useEffect, useState } from 'react'
import { parseQuestionsFromText } from './utils/parseQuestions.js'
import Config from './components/Config.jsx'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'

const appname = 'quiz-react';


export default function App() {
  const [phase, setPhase] = useState('config') // config | quiz | results
  const [all, setAll] = useState([])
  const [picked, setPicked] = useState([])
  const [minutes, setMinutes] = useState(18)
  const [selections, setSelections] = useState([])
  const [lastN, setLastN] = useState(() => {
    const v = localStorage.getItem(`${appname}:n`);
    return v ? parseInt(v, 10) : 10;
  })
  const [lastT, setLastT] = useState(() => {
    const v = localStorage.getItem(`${appname}:t`);
    return v ? parseInt(v, 10) : 10;
  })
  const [savedQuizzes, setSavedQuizzes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${appname}:saved`) || '[]') } catch { return [] }
  })
  const persistSaved = (list) => {
    setSavedQuizzes(list)
    localStorage.setItem(`${appname}:saved`, JSON.stringify(list))
  }

  const onReplaceDataset = (txt) => {
    try {
      const { questions, meta } = parseQuestionsFromText(txt)
      setAll(questions)
      setPicked([])
      setSelections([])
      if (meta?.questions && Number.isFinite(meta.questions)) setLastN(meta.questions)
      if (meta?.time && Number.isFinite(meta.time)) setLastT(meta.time)
      return { count: questions.length }
    } catch { return null }
  }

  const onSaveCurrent = (name, text, n, t) => {
    try {
      const { questions } = parseQuestionsFromText(text)
      const entry = {
        id: Date.now().toString(),
        name,
        text,
        count: questions.length,
        n,
        time: t,
        savedAt: new Date().toISOString(),
      }
      const list = [entry, ...savedQuizzes]
      persistSaved(list)
    } catch {}
  }

  const onLoadSaved = async (id) => {
    const item = savedQuizzes.find((x) => x.id === id)
    if (!item) return null
    try {
      const { questions } = parseQuestionsFromText(item.text)
      setAll(questions)
      setPicked([])
      setSelections([])
      setLastN(item.n)
      setLastT(item.time)
      return { text: item.text, count: questions.length, n: item.n, t: item.time }
    } catch { return null }
  }

  const onDeleteSaved = (id) => {
    const next = savedQuizzes.filter((x) => x.id !== id)
    persistSaved(next)
  }

  const parsedCount = all.length

  const start = (txt, n, tMin) => {
    try {
      let dataset = all
      if (txt && txt.trim().length > 0) {
        const { questions, meta } = parseQuestionsFromText(txt)
        dataset = questions
        setAll(dataset)
      }
      if (dataset.length === 0) {
        alert('No file loaded. Upload a .txt file or use the one already loaded.')
        return
      }
      const count = Math.min(n, dataset.length)
      const shuffledQuestions = [...dataset].sort(() => Math.random() - 0.5).slice(0, count)

      const pickedPrepared = shuffledQuestions.map((q) => {
        const correctLabels = q.correct.map((idx) => q.answers[idx].label)
        const answersShuffled = [...q.answers].sort(() => Math.random() - 0.5)
        const labelIndex = Object.fromEntries(answersShuffled.map((a, i) => [a.label, i]))
        const newCorrect = correctLabels.map((lbl) => labelIndex[lbl]).filter((i) => i !== undefined)
        return { ...q, answers: answersShuffled, correct: newCorrect }
      })

      setPicked(pickedPrepared)
      setMinutes(tMin)
      setLastN(n)
      setLastT(tMin)
      localStorage.setItem(`${appname}:n`, String(n))
      localStorage.setItem(`${appname}:t`, String(tMin))
      setPhase('quiz')
    } catch (e) {
      alert('Error parsing file: ' + e.message)
    }
  }

  const finish = (answersSets) => {
    setSelections(answersSets)
    setPhase('results')
  }

  const restart = () => {
    setPhase('config')
    setPicked([])
    setSelections([])
  }

  return (
    <div className="container grid">
      {phase === 'config' && (
        <Config
          onStart={start}
          parsedCount={parsedCount}
          initialN={lastN}
          initialT={lastT}
          savedQuizzes={savedQuizzes}
          onSaveCurrent={onSaveCurrent}
          onLoadSaved={onLoadSaved}
          onDeleteSaved={onDeleteSaved}
          onReplaceDataset={onReplaceDataset}
        />
      )}
      {phase === 'quiz' && <Quiz questions={picked} minutes={minutes} onFinish={finish} />}
      {phase === 'results' && <Results questions={picked} selections={selections} onRestart={restart} />}
    </div>
  )
}

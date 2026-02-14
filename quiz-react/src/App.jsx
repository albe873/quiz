import React, { useEffect, useState } from 'react'
import { parseQuestionsFromText } from './utils/parseQuestions.js'
import Config from './components/Config.jsx'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import Credits from './components/Credits.jsx'
import Create from './components/Create.jsx'

const appname = 'quiz-react';


export default function App() {
  const [phase, setPhase] = useState('config') // config | quiz | results | create
  const [quiz, setQuiz] = useState(null)
  const [picked, setPicked] = useState([])
  const [editQuiz, setEditQuiz] = useState(null)
  const [selections, setSelections] = useState([])
  const [time, setTime] = useState(() => {
    const v = localStorage.getItem(`${appname}:t`);
    return v ? parseInt(v) : null;
  })
    const [N, setN] = useState(() => {
    const v = localStorage.getItem(`${appname}:n`);
    return v ? parseInt(v) : null;
  })
  const [savedQuizzes, setSavedQuizzes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${appname}:saved`) || '[]') } catch { return [] }
  })
  const persistSaved = (list) => {
    setSavedQuizzes(list)
    localStorage.setItem(`${appname}:saved`, JSON.stringify(list))
  }

  const ensureMeta = (parsedQuiz) => {
    const meta = {
      ...(parsedQuiz.meta || {}),
      questions: Number.isFinite(parsedQuiz.meta?.questions) && parsedQuiz.meta.questions > 0 ? parsedQuiz.meta.questions : parsedQuiz.questions.length,
      time: Number.isFinite(parsedQuiz.meta?.time) && parsedQuiz.meta.time > 0 ? parsedQuiz.meta.time : parsedQuiz.questions.length,
    }
    return { ...parsedQuiz, meta }
  }

  const onReplaceQuiz = (parsedQuiz) => {
    const q = ensureMeta(parsedQuiz)
    setQuiz(q)
    setPicked([])
    setSelections([])
    setN(q.meta.questions)
    setTime(q.meta.time)
  }

  const onSaveCurrent = (name, parsedQuiz) => {
    try {
      const q = ensureMeta(parsedQuiz)
      const entry = {
        id: Date.now().toString(),
        name,
        questions: q.questions,
        meta: q.meta,
        savedAt: new Date().toISOString(),
      }
      const list = [entry, ...savedQuizzes]
      persistSaved(list)
    } catch {}
  }

  const onLoadSaved = async (id) => {
    const item = savedQuizzes.find((x) => x.id === id)
    if (!item) return null
    const loaded = ensureMeta({ questions: item.questions, meta: item.meta })
    setQuiz(loaded)
    setPicked([])
    setSelections([])
    setN(loaded.meta.questions)
    setTime(loaded.meta.time)
    return loaded
  }

  const onDeleteSaved = (id) => {
    const next = savedQuizzes.filter((x) => x.id !== id)
    persistSaved(next)
  }

  const start = (n, time) => {
    try {
      let dataset = quiz?.questions || []
      const count = Math.min(n, dataset.length)
      const shuffledQuestions = [...dataset].sort(() => Math.random() - 0.5).slice(0, count)

      const pickedPrepared = shuffledQuestions.map((q) => {
        const answersShuffled = [...q.answers].sort(() => Math.random() - 0.5)
        const labelToNewIndex = Object.fromEntries(answersShuffled.map((a, i) => [a.label, i]))

        if (q.type === 'match') {
          // Re-map correctMap to shuffled answers using labels
          const oldIndexToLabel = Object.fromEntries(q.answers.map((a, i) => [i, a.label]))
          const remappedByAnswer = (q.correctMap || []).map((oldIdx) => {
            const lbl = oldIndexToLabel[oldIdx]
            return labelToNewIndex[lbl]
          })

          // Shuffle items and reorder correctMap using the same permutation
          const itemsWithIndex = (q.items || []).map((it, idx) => ({ it, idx }))
          const itemsShuffledWithIndex = [...itemsWithIndex].sort(() => Math.random() - 0.5)
          const itemsShuffled = itemsShuffledWithIndex.map((x) => x.it)
          const itemPermutation = itemsShuffledWithIndex.map((x) => x.idx)
          const correctMap = itemPermutation
            .map((oldIdx) => remappedByAnswer[oldIdx])
            .filter((i) => i !== undefined)

          return { ...q, items: itemsShuffled, answers: answersShuffled, correctMap: correctMap }
        } else {
          // non-match: preserve original type ('single' or 'multiple')
          const correctLabels = (q.correct || []).map((idx) => q.answers[idx].label)
          const newCorrect = correctLabels.map((lbl) => labelToNewIndex[lbl]).filter((i) => i !== undefined)
          return { ...q, answers: answersShuffled, correct: newCorrect }
        }
      })

      setPicked(pickedPrepared)
      setTime(time)
      setN(n)
      localStorage.setItem(`${appname}:n`, String(n))
      localStorage.setItem(`${appname}:t`, String(time))
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
    <>
    <div className="container grid">
      {phase === 'config' && (
        <Config
          quiz={quiz}
          savedQuizzes={savedQuizzes}
          onStart={start}
          onSaveCurrent={onSaveCurrent}
          onLoadSaved={onLoadSaved}
          onDeleteSaved={onDeleteSaved}
          onReplaceQuiz={onReplaceQuiz}
          onCreate={() => { setEditQuiz(null); setPhase('create') }}
          onEdit={(id) => {
            const item = savedQuizzes.find((x) => x.id === id)
            if (item) {
              setEditQuiz({ questions: item.questions, meta: { ...item.meta, name: item.name } })
              setPhase('create')
            }
          }}
        />
      )}
      {phase === 'quiz' && <Quiz questions={picked} time={time} onFinish={finish} />}
      {phase === 'results' && <Results questions={picked} selections={selections} onRestart={restart} />}
      {phase === 'create' && (
        <Create
          editQuiz={editQuiz}
          onBack={() => setPhase('config')}
          onSaveToApp={(name, parsedQuiz) => {
            onSaveCurrent(name, parsedQuiz)
            onReplaceQuiz(parsedQuiz)
            setEditQuiz(null)
            setPhase('config')
          }}
        />
      )}
    </div>
    <Credits />
    </>
  )
}

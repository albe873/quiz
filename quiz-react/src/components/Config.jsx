import React, { useEffect, useState } from 'react'
import { parseQuestionsFromText } from '../utils/parseQuestions'

export default function Config({ onStart, parsedCount, initialN, initialT, savedQuizzes, onSaveCurrent, onLoadSaved, onDeleteSaved, onReplaceDataset }) {
  const [fileText, setFileText] = useState('')
  const [n, setN] = useState(initialN ?? 10)
  const [tMin, setTMin] = useState(initialT ?? 10)
  const [foundCount, setFoundCount] = useState(0)
  const [saveName, setSaveName] = useState('')
  const [fileName, setFileName] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)

  useEffect(() => {
    setN(initialN ?? 10)
    setTMin(initialT ?? 10)
  }, [initialN, initialT])

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const txt = await f.text()
    setFileText(txt)
    setFileName(f.name || '')
    try {
      const { questions, meta } = parseQuestionsFromText(txt)
      setFoundCount(questions.length)
      if (meta?.questions && Number.isFinite(meta.questions)) setN(meta.questions)
      if (meta?.time && Number.isFinite(meta.time)) setTMin(meta.time)
      const info = onReplaceDataset && onReplaceDataset(txt)
      if (info && typeof info.count === 'number') setFoundCount(info.count)
    } catch {}
  }

  const hasFile = fileText.trim().length > 0
  const canStart = (hasFile || parsedCount > 0) && n > 0 && tMin > 0

  return (
    <>
      <div className="card grid">
        <div className="grid">
          <div className="row">
            <label>Questions file (.txt):</label>
            <input type="file" accept=".txt" onChange={handleFile} />
            {hasFile && foundCount > 0 && <span className="badge">{foundCount} questions found</span>}
            {!hasFile && parsedCount > 0 && <span className="badge">{parsedCount} questions loaded</span>}
            {hasFile && (
                <button
                className="success"
                style={{ marginLeft: 8 }}
                onClick={() => {
                    const base = (fileName || 'quiz').replace(/\.[^.]+$/, '')
                    setSaveName(base)
                    setShowNameModal(true)
                }}
                >Save loaded quiz</button>
            )}
          </div>
          <div className="row">
            <label>Number of questions:</label>
            <input type="number" min={1} value={n} onChange={(e) => setN(parseInt(e.target.value || '0', 10))} />
          </div>
          <div className="row">
            <label>Time (minutes):</label>
            <input type="number" min={1} value={tMin} onChange={(e) => setTMin(parseInt(e.target.value || '0', 10))} />
          </div>
        </div>
        <div className="footer">
          <span className="small">Upload a file or use the one already loaded.</span>
          <button disabled={!canStart} onClick={() => onStart(hasFile ? fileText : '', n, tMin)}>Start quiz</button>
        </div>
        {showNameModal && (
          <div className="modal">
            <div className="modal-content">
              <h1>Name the quiz</h1>
              <div className="row">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div className="footer">
                <button className="secondary" onClick={() => setShowNameModal(false)}>Cancel</button>
                <button
                  className="success"
                  onClick={() => {
                    if (!saveName.trim()) return
                      onSaveCurrent && onSaveCurrent(saveName.trim(), fileText, n, tMin)
                    setShowNameModal(false)
                  }}
                >Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="grid">
        <div className="card grid">
          <h1>Saved quizzes</h1>
          {(!savedQuizzes || savedQuizzes.length === 0) && <span className="small">No saved quizzes</span>}
          {savedQuizzes && savedQuizzes.map((q) => (
            <div key={q.id} className="option">
              <div style={{ minWidth: 160 }}>
                <div className="badge">{q.name}</div>
                <div className="small">Questions: {q.count} • Time: {q.time} min</div>
              </div>
              <div className="row" style={{ marginLeft: 'auto' }}>
                <button className="secondary" onClick={async () => {
                  const res = onLoadSaved && await onLoadSaved(q.id)
                  if (res) {
                    setFileText(res.text)
                    setFoundCount(res.count)
                    setN(res.n)
                    setTMin(res.t)
                  }
                }}>Load</button>
                <button className="secondary" onClick={() => onDeleteSaved && onDeleteSaved(q.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

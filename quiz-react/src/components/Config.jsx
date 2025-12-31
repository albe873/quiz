import React, { useEffect, useState } from 'react'
import { parseQuestionsFromText } from '../utils/parseQuestions'

function ConfigUpload({ hasFile, parsedCount, foundCount, onFileChange, onSaveRequest }) {
  return (
    <>
    <div className="row">
      <label>Upload a quiz (.txt):</label>
      <input type="file" accept=".txt" onChange={onFileChange} />
    </div>
    <div className="row">
      {hasFile && foundCount > 0 && <span className="badge">{foundCount} questions found</span>}
      {!hasFile && parsedCount > 0 && <span className="badge">{parsedCount} questions loaded</span>}
      {hasFile && (
        <button
          className="success"
          style={{ marginLeft: 8 }}
          onClick={onSaveRequest}
        >Save loaded quiz</button>
      )}
    </div>
    </>
  )
}

function ConfigInputs({ n, tMin, onChangeN, onChangeTMin, canStart, onStart }) {
  return (
    <>
    <div className="row">
      <button
        className="secondary"
        onClick={(e) => {
          const row = e.currentTarget.closest('.row')
          const toToggle = []
          let sib = row?.nextElementSibling
          while (sib && sib.classList.contains('row')) {
            toToggle.push(sib)
            sib = sib.nextElementSibling
          }
          const isHidden = toToggle.length && toToggle[0].style.display === 'none'
          toToggle.forEach((el) => { el.style.display = isHidden ? '' : 'none' })
          e.currentTarget.textContent = isHidden ? 'Hide config' : 'Show config'
        }}
      >
        Show config
      </button>
      <button disabled={!canStart} onClick={onStart} style={{ marginLeft: 'auto' }}>Start quiz</button>
    </div>
    <div className="row" style={{ display: 'none' }}>
      <label>Number of questions:</label>
      <input type="number" min={1} value={n} onChange={(e) => onChangeN(parseInt(e.target.value || '0', 10))} />
    </div>
    <div className="row" style={{ display: 'none' }}>
      <label>Time (minutes):</label>
      <input type="number" min={1} value={tMin} onChange={(e) => onChangeTMin(parseInt(e.target.value || '0', 10))} />
    </div>
    </>
  )
}

function SaveModal({ show, saveName, onChangeName, onCancel, onSave }) {
  if (!show) return null
  return (
    <div className="modal">
      <div className="modal-content">
        <h1>Name the quiz</h1>
        <div className="row">
          <input
            type="text"
            value={saveName}
            onChange={(e) => onChangeName(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div className="footer">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button className="success" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ show, deleteTarget, onCancel, onConfirm }) {
  if (!show) return null
  return (
    <div className="modal">
      <div className="modal-content">
        <h1>Delete saved quiz</h1>
        <div className="row">
          <span className="small">Are you sure you want to delete {deleteTarget?.name || 'this quiz'}?</span>
        </div>
        <div className="footer">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button className="danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function SavedQuizItem({ q, onLoad, onDeleteRequest }) {
  return (
    <div className="option">
      <div style={{ minWidth: 160 }}>
        <div className="badge">{q.name}</div>
        <div className="small">Questions: {q.count} • Time: {q.time} min</div>
      </div>
      <div className="row" style={{ marginLeft: 'auto' }}>
        <button className="secondary" onClick={onLoad}>Load</button>
        <button className="secondary" onClick={onDeleteRequest}>Delete</button>
      </div>
    </div>
  )
}

function SavedQuizzesList({ savedQuizzes, onLoadSaved, onDeleteRequest }) {
  return (
    <div className="card grid">
      <h1>Saved quizzes</h1>
      {(!savedQuizzes || savedQuizzes.length === 0) && <span className="small">No saved quizzes</span>}
      {savedQuizzes && savedQuizzes.map((q) => (
        <SavedQuizItem
          key={q.id}
          q={q}
          onLoad={() => onLoadSaved(q.id)}
          onDeleteRequest={() => onDeleteRequest(q)}
        />
      ))}
    </div>
  )
}

export default function Config({ onStart, parsedCount, initialN, initialT, savedQuizzes, onSaveCurrent, onLoadSaved, onDeleteSaved, onReplaceDataset }) {
  const [fileText, setFileText] = useState('')
  const [n, setN] = useState(initialN ?? 10)
  const [tMin, setTMin] = useState(initialT ?? 10)
  const [foundCount, setFoundCount] = useState(0)
  const [saveName, setSaveName] = useState('')
  const [fileName, setFileName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const requestNameModal = () => {
    const base = (fileName || 'quiz').replace(/\.[^.]+$/, '')
    setSaveName(base)
    setShowSaveModal(true)
  }

  const handleStart = () => onStart(hasFile ? fileText : '', n, tMin)

  const handleConfirmSave = () => {
    if (!saveName.trim()) return
    onSaveCurrent && onSaveCurrent(saveName.trim(), fileText, n, tMin)
    setShowSaveModal(false)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget?.id) {
      onDeleteSaved && onDeleteSaved(deleteTarget.id)
    }
    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  const handleLoadSaved = async (id) => {
    const res = onLoadSaved && await onLoadSaved(id)
    if (res) {
      setFileText(res.text)
      setFoundCount(res.count)
      setN(res.n)
      setTMin(res.t)
    }
  }

  return (
    <>
      <div className="card grid">
        <div className="grid">
          <ConfigUpload
            hasFile={hasFile}
            parsedCount={parsedCount}
            foundCount={foundCount}
            onFileChange={handleFile}
            onSaveRequest={requestNameModal}
          />
          <ConfigInputs
            n={n}
            tMin={tMin}
            onChangeN={(val) => setN(val)}
            onChangeTMin={(val) => setTMin(val)}
            canStart={canStart}
            onStart={handleStart}
          />
        </div>
        <SaveModal
          show={showSaveModal}
          saveName={saveName}
          onChangeName={setSaveName}
          onCancel={() => setShowSaveModal(false)}
          onSave={handleConfirmSave}
        />
      </div>
      <div className="grid">
        <SavedQuizzesList
          savedQuizzes={savedQuizzes}
          onLoadSaved={handleLoadSaved}
          onDeleteRequest={(q) => { setDeleteTarget(q); setShowDeleteModal(true) }}
        />
      </div>
      <DeleteModal
        show={showDeleteModal}
        deleteTarget={deleteTarget}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null) }}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

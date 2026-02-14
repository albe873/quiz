import React, { useEffect, useState } from 'react'
import { parseQuestionsFromText } from '../utils/parseQuestions'

function ConfigUpload({ questionCount, onFileChange, onSaveRequest }) {
  return (
    <>
    <div className="row">
      <label>Upload a quiz (.txt):</label>
      <input type="file" accept=".txt" onChange={onFileChange} />
    </div>
    <div className="row">
      {questionCount > 0 && <span className="badge">{questionCount} questions loaded</span>}
      {questionCount > 0 && (
        <button className="success" style={{ marginLeft: 8 }} onClick={onSaveRequest}>
          Save loaded quiz
        </button>
      )}
    </div>
    </>
  )
}

function ConfigInputs({ n, time, onChangeN, onChangeTime, canStart, onStart }) {
  return (
    <div className="row align-start">
      <details className="flex-1">
        <summary>Config</summary>
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="row">
            <label>Number of questions:</label>
            <input type="number" min={1} value={n} onChange={(e) => onChangeN(parseInt(e.target.value || '0', 10))} />
          </div>
          <div className="row">
            <label>Time (minutes):</label>
            <input type="number" min={1} value={time} onChange={(e) => onChangeTime(parseInt(e.target.value || '0', 10))} />
          </div>
        </div>
      </details>
      <button disabled={!canStart} onClick={onStart}>Start quiz</button>
    </div>
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

function SavedQuizItem({ q, onLoad, onEdit, onDeleteRequest }) {
  return (
    <div className="option">
      <div style={{ minWidth: 160 }}>
        <div className="badge">{q.name}</div>
        <details>
          <summary className="small">Questions: {q.questions.length ?? '?'} - Time: {q.meta?.time ?? '?'} min</summary>
          {q.meta?.author && <div className="small">Author: {q.meta.author}</div>}
          {q.meta?.version && <div className="small">Version: {q.meta.version}</div>}
        </details>
      </div>
      <div className="row" style={{ marginLeft: 'auto' }}>
        <button className="secondary" onClick={onLoad}>Load</button>
        <button className="secondary" onClick={onEdit}>Edit</button>
        <button className="secondary" onClick={onDeleteRequest}>Delete</button>
      </div>
    </div>
  )
}

function SavedQuizzesList({ savedQuizzes, onLoadSaved, onEditSaved, onDeleteRequest }) {
  return (
    <div className="card grid">
      <h1>Saved quizzes</h1>
      {(!savedQuizzes || savedQuizzes.length === 0) && <span className="small">No saved quizzes</span>}
      {savedQuizzes && savedQuizzes.map((q) => (
        <SavedQuizItem
          key={q.id}
          q={q}
          onLoad={() => onLoadSaved(q.id)}
          onEdit={() => onEditSaved(q.id)}
          onDeleteRequest={() => onDeleteRequest(q)}
        />
      ))}
    </div>
  )
}

export default function Config({ quiz, savedQuizzes, onStart, onSaveCurrent, onLoadSaved, onDeleteSaved, onReplaceQuiz, onCreate, onEdit }) {
  const [n, setN] = useState(quiz?.meta?.questions ?? 10)
  const [time, setTime] = useState(quiz?.meta?.time ?? 10)
  const [saveName, setSaveName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (quiz?.meta) {
      setN(quiz.meta.questions ?? quiz.questions.length)
      setTime(quiz.meta.time ?? quiz.questions.length)
    }
  }, [quiz])

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const txt = await f.text()
    try {
      onReplaceQuiz(parseQuestionsFromText(txt))
    } catch {}
  }

  const canStart = quiz != null && n > 0 && time > 0

  const requestNameModal = () => {
    setSaveName(quiz?.meta?.name || 'quiz')
    setShowSaveModal(true)
  }

  const handleStart = () => onStart(n, time)

  const handleConfirmSave = () => {
    if (!saveName.trim() || !quiz) return
    onSaveCurrent(saveName.trim(), quiz)
    setShowSaveModal(false)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget?.id)
      onDeleteSaved(deleteTarget.id)
    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  const handleLoadSaved = async (id) => {
    await onLoadSaved?.(id)
  }

  return (
    <>
      <div className="card grid">
        <ConfigUpload
          questionCount={quiz?.questions?.length || 0}
          onFileChange={handleFile}
          onSaveRequest={requestNameModal}
        />
        <button className="secondary mr-auto" onClick={onCreate}>Create a new quiz</button>
      </div>
      <div className="card grid">
        <ConfigInputs
          n={n}
          time={time}
          onChangeN={setN}
          onChangeTime={setTime}
          canStart={canStart}
          onStart={handleStart}
        />
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
          onEditSaved={(id) => onEdit?.(id)}
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

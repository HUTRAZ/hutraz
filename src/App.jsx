import { useState, useEffect, useRef } from 'react'
import ExerciseCard from './ExerciseCard'

const REST_PRESETS = [30, 60, 90, 120, 180]

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [page, setPage] = useState('workout')
  const [exercises, setExercises] = useState(() => {
    const saved = localStorage.getItem('exercises')
    return saved ? JSON.parse(saved) : []
  })
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('history')
    return saved ? JSON.parse(saved) : []
  })
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('folders')
    if (saved) return JSON.parse(saved)
    // Migrate old templates to default folder
    const oldTemplates = localStorage.getItem('templates')
    if (oldTemplates) {
      const templates = JSON.parse(oldTemplates)
      if (templates.length > 0) {
        return [{ name: 'My Templates', open: true, templates }]
      }
    }
    return [{ name: 'My Templates', open: true, templates: [] }]
  })
  const [defaultRest, setDefaultRest] = useState(() => {
    const saved = localStorage.getItem('defaultRest')
    return saved ? Number(saved) : 90
  })
  const [name, setName] = useState('')
  const [activeRest, setActiveRest] = useState(null)
  const [restTime, setRestTime] = useState(0)
  const [restDuration, setRestDuration] = useState(90)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const restStartRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem('exercises', JSON.stringify(exercises))
  }, [exercises])

  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders))
  }, [folders])

  useEffect(() => {
    localStorage.setItem('defaultRest', String(defaultRest))
  }, [defaultRest])

  useEffect(() => {
    if (!activeRest) return
    if (restTime <= 0) {
      completeRest()
      return
    }
    const timer = setTimeout(() => {
      setRestTime(restTime - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [activeRest, restTime])

  function completeRest() {
    if (!activeRest) return
    const { exIndex, setIndex } = activeRest
    const elapsed = Math.floor((Date.now() - restStartRef.current) / 1000)
    const newExercises = [...exercises]
    newExercises[exIndex].sets[setIndex].restTime = elapsed
    setExercises(newExercises)
    setActiveRest(null)
    setRestTime(0)
    restStartRef.current = null
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  }

  function skipRest() {
    completeRest()
  }

  function addExercise() {
    if (name === '') return
    setExercises([...exercises, { name: name, sets: [], restOverride: null, note: '' }])
    setName('')
  }

  function updateExerciseRest(exIndex, value) {
    const newExercises = [...exercises]
    newExercises[exIndex].restOverride = value === '' ? null : Number(value)
    setExercises(newExercises)
  }

  function updateExerciseNote(exIndex, value) {
    const newExercises = [...exercises]
    newExercises[exIndex].note = value
    setExercises(newExercises)
  }

  function addSet(index) {
    const newExercises = [...exercises]
    const sets = newExercises[index].sets
    const lastSet = sets[sets.length - 1]
    const newSet = lastSet
      ? { kg: lastSet.kg, reps: lastSet.reps, done: false }
      : { kg: '', reps: '', done: false }
    sets.push(newSet)
    setExercises(newExercises)

    setTimeout(() => {
      const input = document.querySelector(`[data-ex="${index}"][data-set="${sets.length - 1}"][data-field="kg"]`)
      if (input) input.focus()
    }, 50)
  }

  function deleteSet(exIndex, setIndex) {
    const newExercises = [...exercises]
    newExercises[exIndex].sets.splice(setIndex, 1)
    if (newExercises[exIndex].sets.length === 0) {
      newExercises.splice(exIndex, 1)
    }
    setExercises(newExercises)
  }

  function updateSet(exIndex, setIndex, field, value) {
    const newExercises = [...exercises]
    newExercises[exIndex].sets[setIndex][field] = value
    setExercises(newExercises)
  }

  function doneSet(exIndex, setIndex) {
    const newExercises = [...exercises]
    const set = newExercises[exIndex].sets[setIndex]
    if (set.kg === '' || set.reps === '') return
    set.done = true
    setExercises(newExercises)

    if (activeRest) {
      completeRest()
    }

    const exRestDuration = exercises[exIndex].restOverride !== null && exercises[exIndex].restOverride !== undefined
      ? exercises[exIndex].restOverride
      : defaultRest

    restStartRef.current = Date.now()
    setActiveRest({ exIndex, setIndex })
    setRestTime(exRestDuration)
    setRestDuration(exRestDuration)
  }

  function getPreviousSets(exerciseName) {
    for (const workout of history) {
      for (const ex of workout.exercises) {
        if (ex.name === exerciseName) {
          return ex.sets
        }
      }
    }
    return null
  }

  function finishWorkout() {
    if (exercises.length === 0) return
    setShowFinishModal(true)
  }

  function confirmFinish(updateAllTemplates) {
    const workout = {
      date: new Date().toLocaleDateString('en-GB'),
      exercises: exercises
    }
    setHistory([workout, ...history])

    if (updateAllTemplates) {
      const newFolders = [...folders]
      for (const ex of exercises) {
        for (const folder of newFolders) {
          for (const template of folder.templates) {
            for (let i = 0; i < template.exercises.length; i++) {
              if (template.exercises[i].name === ex.name) {
                template.exercises[i].sets = ex.sets.map(set => ({ kg: set.kg, reps: set.reps }))
              }
            }
          }
        }
      }
      setFolders(newFolders)
    }

    setExercises([])
    setActiveRest(null)
    setRestTime(0)
    setShowFinishModal(false)
  }

  function saveTemplate() {
    if (exercises.length === 0) return
    setShowSaveModal(true)
  }

  function confirmSaveTemplate(folderIndex, templateName) {
    const template = {
      name: templateName,
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(set => ({ kg: set.kg, reps: set.reps })),
        restOverride: ex.restOverride,
        note: ex.note || ''
      }))
    }
    const newFolders = [...folders]
    newFolders[folderIndex].templates.push(template)
    setFolders(newFolders)
    setShowSaveModal(false)
  }

  function loadTemplate(template) {
    const newExercises = template.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets.map(set => ({ kg: set.kg || '', reps: set.reps || '', done: false })),
      restOverride: ex.restOverride !== undefined ? ex.restOverride : null,
      note: ex.note || ''
    }))
    setExercises(newExercises)
  }

  function deleteTemplate(folderIndex, templateIndex) {
    const newFolders = [...folders]
    newFolders[folderIndex].templates.splice(templateIndex, 1)
    setFolders(newFolders)
  }

  function deleteTemplateNote(folderIndex, templateIndex, exIndex) {
    const newFolders = [...folders]
    newFolders[folderIndex].templates[templateIndex].exercises[exIndex].note = ''
    setFolders(newFolders)
  }

  // Folder management
  function addFolder() {
    const newFolders = [...folders, { name: 'New Folder', open: true, templates: [] }]
    setFolders(newFolders)
    setEditingFolder(newFolders.length - 1)
    setEditingFolderName('New Folder')
  }

  function toggleFolder(index) {
    const newFolders = [...folders]
    newFolders[index].open = !newFolders[index].open
    setFolders(newFolders)
  }

  function startEditFolder(index) {
    setEditingFolder(index)
    setEditingFolderName(folders[index].name)
  }

  function confirmEditFolder() {
    if (editingFolder === null) return
    const newFolders = [...folders]
    newFolders[editingFolder].name = editingFolderName || 'Untitled'
    setFolders(newFolders)
    setEditingFolder(null)
  }

  function deleteFolder(index) {
    if (folders.length <= 1) return
    const newFolders = [...folders]
    // Move templates to first remaining folder
    const remaining = newFolders.filter((_, i) => i !== index)
    remaining[0].templates.push(...newFolders[index].templates)
    setFolders(remaining)
  }

  function moveFolderUp(index) {
    if (index === 0) return
    const newFolders = [...folders]
    const temp = newFolders[index - 1]
    newFolders[index - 1] = newFolders[index]
    newFolders[index] = temp
    setFolders(newFolders)
  }

  function moveFolderDown(index) {
    if (index >= folders.length - 1) return
    const newFolders = [...folders]
    const temp = newFolders[index + 1]
    newFolders[index + 1] = newFolders[index]
    newFolders[index] = temp
    setFolders(newFolders)
  }

  function moveTemplateUp(folderIndex, templateIndex) {
    if (templateIndex === 0) return
    const newFolders = [...folders]
    const t = newFolders[folderIndex].templates
    const temp = t[templateIndex - 1]
    t[templateIndex - 1] = t[templateIndex]
    t[templateIndex] = temp
    setFolders(newFolders)
  }

  function moveTemplateDown(folderIndex, templateIndex) {
    const t = folders[folderIndex].templates
    if (templateIndex >= t.length - 1) return
    const newFolders = [...folders]
    const temps = newFolders[folderIndex].templates
    const temp = temps[templateIndex + 1]
    temps[templateIndex + 1] = temps[templateIndex]
    temps[templateIndex] = temp
    setFolders(newFolders)
  }

  function getBestSet(exerciseName) {
    let best = null
    for (const workout of history) {
      for (const ex of workout.exercises) {
        if (ex.name === exerciseName) {
          for (const set of ex.sets) {
            const volume = Number(set.kg) * Number(set.reps)
            if (!best || volume > best.volume) {
              best = { kg: set.kg, reps: set.reps, volume: volume }
            }
          }
        }
      }
    }
    return best
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <>
      {showSplash && (
        <div className="fixed inset-0 bg-[#0D0D1A] flex flex-col items-center justify-center z-50">
          <img src="/icon.svg" className="w-20 h-20 mb-4 animate-bounce" alt="Hutraz" />
          <div className="text-2xl font-bold tracking-widest text-white">HUTRAZ</div>
          <div className="text-xs text-[#7B7BFF] mt-2">Simple tracking. Real progress.</div>
        </div>
      )}

      <div className="min-h-screen bg-[#0D0D1A] text-white pb-24">
        <div className="px-4 py-6 max-w-md mx-auto">

          {/* PROGRESS */}
          {page === 'progress' && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-6">Progress</h1>

              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-5 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{history.length}</div>
                    <div className="text-xs text-[#555]">Workouts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {history.reduce((sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets.length, 0), 0)}
                    </div>
                    <div className="text-xs text-[#555]">Sets logged</div>
                  </div>
                </div>
              </div>

              {history.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-3">Recent workouts</h3>
                  {history.slice(0, 10).map((w, i) => (
                    <div key={i} className="bg-[#13132A] border border-[#232340] rounded-xl p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">{w.date}</span>
                        <span className="text-xs text-[#555]">{w.exercises.length} exercises</span>
                      </div>
                      {w.exercises.map((ex, j) => (
                        <div key={j} className="text-xs text-[#666] ml-1">
                          {ex.name} — {ex.sets.length} sets
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-12 h-12 stroke-[#2A2A4A] mx-auto mb-4">
                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                  <div className="text-[#555] text-sm">No workouts yet</div>
                  <div className="text-[#444] text-xs mt-2">Complete a workout to see your progress</div>
                </div>
              )}
            </div>
          )}

          {/* WORKOUT */}
          {page === 'workout' && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">HUTRAZ</h1>
              <p className="text-xs text-[#7B7BFF] mb-6">Simple tracking. Real progress.</p>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                  className="flex-1 bg-[#1C1C38] border border-[#2A2A4A] rounded-xl px-4 py-3 text-white placeholder-[#3a3a55] outline-none focus:border-[#7B7BFF] transition-colors"
                />
                <button
                  onClick={addExercise}
                  className="bg-[#7B7BFF] rounded-xl px-5 py-3 font-bold text-sm hover:bg-[#6060DD] transition-colors"
                >
                  Add
                </button>
              </div>

              {exercises.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  exercise={ex}
                  exIndex={i}
                  onAddSet={addSet}
                  onUpdateSet={updateSet}
                  onDoneSet={doneSet}
                  onDeleteSet={deleteSet}
                  onUpdateExerciseRest={updateExerciseRest}
                  onUpdateExerciseNote={updateExerciseNote}
                  bestSet={getBestSet(ex.name)}
                  previousSets={getPreviousSets(ex.name)}
                  activeRest={activeRest}
                  restTime={restTime}
                  restDuration={restDuration}
                  defaultRest={defaultRest}
                  onSkipRest={skipRest}
                />
              ))}

              {exercises.length > 0 && (
                <div className="flex flex-col gap-3 mt-4 mb-8">
                  <button
                    onClick={finishWorkout}
                    className="w-full py-4 bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] rounded-2xl font-bold text-base shadow-lg shadow-[#7B7BFF]/25 hover:translate-y-[-1px] active:translate-y-[1px] transition-transform"
                  >
                    Finish workout
                  </button>
                  <button
                    onClick={saveTemplate}
                    className="w-full py-3 border border-dashed border-[#2A2A4A] rounded-2xl text-[#555] text-sm font-semibold hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors"
                  >
                    Save as template
                  </button>
                </div>
              )}

              {/* TEMPLATE FOLDERS */}
              <div className="mt-8 border-t border-[#1a1a30] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide">Templates</h3>
                  <button
                    onClick={addFolder}
                    className="text-[10px] font-semibold text-[#555] border border-[#2A2A4A] px-3 py-1.5 rounded-lg hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors"
                  >
                    + Folder
                  </button>
                </div>

                {folders.map((folder, fi) => (
                  <div key={fi} className="mb-3">
                    {/* Folder header */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* Reorder arrows */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveFolderUp(fi)}
                          className={`text-[#444] p-0.5 ${fi === 0 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`}
                          disabled={fi === 0}
                        >
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3 stroke-current">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => moveFolderDown(fi)}
                          className={`text-[#444] p-0.5 ${fi >= folders.length - 1 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`}
                          disabled={fi >= folders.length - 1}
                        >
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3 stroke-current">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      </div>

                      {/* Folder icon + toggle */}
                      <button onClick={() => toggleFolder(fi)} className="flex items-center gap-2 flex-1 min-w-0">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                          className={`w-4 h-4 shrink-0 transition-colors ${folder.open ? 'stroke-[#7B7BFF] fill-[#7B7BFF]/10' : 'stroke-[#555]'}`}
                        >
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>

                        {editingFolder === fi ? (
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmEditFolder()}
                            onBlur={confirmEditFolder}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1C1C38] border border-[#7B7BFF] rounded-lg px-2 py-1 text-sm font-semibold text-white outline-none flex-1 min-w-0"
                          />
                        ) : (
                          <span className="text-sm font-semibold truncate">{folder.name}</span>
                        )}

                        <span className="text-[10px] text-[#555] shrink-0">{folder.templates.length}</span>

                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"
                          className={`w-3.5 h-3.5 stroke-[#444] shrink-0 transition-transform ${folder.open ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>

                      {/* Folder actions */}
                      {editingFolder !== fi && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEditFolder(fi)}
                            className="text-[#444] p-1 hover:text-[#7B7BFF] transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-current">
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          {folders.length > 1 && (
                            <button
                              onClick={() => deleteFolder(fi)}
                              className="text-[#444] p-1 hover:text-red-400 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 stroke-current">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Folder contents */}
                    {folder.open && (
                      <div className="ml-7 border-l border-[#1a1a30] pl-3">
                        {folder.templates.length === 0 ? (
                          <div className="text-[10px] text-[#444] py-3 italic">No templates</div>
                        ) : (
                          folder.templates.map((t, ti) => (
                            <div key={ti} className="bg-[#13132A] border border-[#232340] rounded-xl p-3.5 mb-2">
                              <div className="flex items-center gap-2">
                                {/* Reorder */}
                                <div className="flex flex-col shrink-0">
                                  <button
                                    onClick={() => moveTemplateUp(fi, ti)}
                                    className={`text-[#444] p-0.5 ${ti === 0 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`}
                                    disabled={ti === 0}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5 stroke-current">
                                      <polyline points="18 15 12 9 6 15"/>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => moveTemplateDown(fi, ti)}
                                    className={`text-[#444] p-0.5 ${ti >= folder.templates.length - 1 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`}
                                    disabled={ti >= folder.templates.length - 1}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5 stroke-current">
                                      <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                  </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="font-bold text-sm truncate">{t.name}</span>
                                    <span className="text-[10px] text-[#555] shrink-0 ml-2">{t.exercises.length} ex</span>
                                  </div>
                                  {t.exercises.map((ex, j) => (
                                    <div key={j} className="ml-0.5 mb-0.5">
                                      <span className="text-[10px] text-[#666]">{ex.name} — {ex.sets.length} sets</span>
                                      {ex.note && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] text-[#4a4a6a] italic">"{ex.note}"</span>
                                          <button
                                            onClick={() => deleteTemplateNote(fi, ti, j)}
                                            className="text-[#3a3a55] hover:text-red-400"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-2.5 h-2.5 stroke-current">
                                              <path d="M18 6L6 18M6 6l12 12"/>
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2 mt-2.5">
                                <button
                                  onClick={() => loadTemplate(t)}
                                  className="flex-1 py-2 bg-[#7B7BFF] rounded-lg text-xs font-bold hover:bg-[#6060DD] transition-colors"
                                >
                                  Start
                                </button>
                                <button
                                  onClick={() => deleteTemplate(fi, ti)}
                                  className="py-2 px-3 border border-[#2A2A4A] rounded-lg text-[10px] font-semibold text-[#555] hover:border-red-500/50 hover:text-red-400 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {page === 'profile' && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-6">Profile</h1>

              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-5 mb-4">
                <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-4">Settings</h3>

                <div className="mb-2">
                  <div className="text-sm font-semibold mb-1">Rest timer</div>
                  <div className="text-xs text-[#555] mb-3">Default rest duration between sets</div>
                  <div className="flex gap-2 flex-wrap">
                    {REST_PRESETS.map(seconds => (
                      <button
                        key={seconds}
                        onClick={() => setDefaultRest(seconds)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
                          ${defaultRest === seconds
                            ? 'bg-[#7B7BFF] text-white'
                            : 'bg-[#1C1C38] border border-[#2A2A4A] text-[#888] hover:border-[#7B7BFF]'
                          }`}
                      >
                        {formatTime(seconds)}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[#444] mt-3">Current: {formatTime(defaultRest)}</div>
                </div>
              </div>

              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-4">About</h3>
                <div className="text-xs text-[#555]">
                  <div className="mb-1">HUTRAZ v1.0</div>
                  <div>Simple tracking. Real progress.</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FINISH WORKOUT MODAL */}
        {showFinishModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50">
            <div className="w-full max-w-md bg-[#13132A] rounded-t-3xl p-6 pb-10">
              <h2 className="text-lg font-bold text-center mb-2">Finish workout</h2>
              <p className="text-xs text-[#555] text-center mb-6">Update templates with today's values?</p>

              <button
                onClick={() => confirmFinish(true)}
                className="w-full py-4 bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] rounded-2xl font-bold text-sm mb-3 shadow-lg shadow-[#7B7BFF]/25"
              >
                Save & update all templates
              </button>
              <button
                onClick={() => confirmFinish(false)}
                className="w-full py-3 border border-[#2A2A4A] rounded-2xl text-sm font-semibold text-[#888] mb-3"
              >
                Save without updating templates
              </button>
              <button
                onClick={() => setShowFinishModal(false)}
                className="w-full py-3 text-sm font-semibold text-[#555]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* SAVE TEMPLATE MODAL */}
        {showSaveModal && (
          <SaveTemplateModal
            folders={folders}
            onSave={confirmSaveTemplate}
            onCancel={() => setShowSaveModal(false)}
          />
        )}

        {/* BOTTOM NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D1A]/95 backdrop-blur-xl border-t border-[#1a1a30] px-6 py-3 pb-8 flex justify-around max-w-md mx-auto">
          <button onClick={() => setPage('progress')} className={`flex flex-col items-center gap-1 ${page === 'progress' ? 'opacity-100' : 'opacity-40'}`}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'progress' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}>
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            <span className={`text-[10px] font-semibold ${page === 'progress' ? 'text-[#7B7BFF]' : 'text-white'}`}>Progress</span>
          </button>
          <button onClick={() => setPage('workout')} className={`flex flex-col items-center gap-1 ${page === 'workout' ? 'opacity-100' : 'opacity-40'}`}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'workout' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className={`text-[10px] font-semibold ${page === 'workout' ? 'text-[#7B7BFF]' : 'text-white'}`}>Workout</span>
          </button>
          <button onClick={() => setPage('profile')} className={`flex flex-col items-center gap-1 ${page === 'profile' ? 'opacity-100' : 'opacity-40'}`}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'profile' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}>
              <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
            <span className={`text-[10px] font-semibold ${page === 'profile' ? 'text-[#7B7BFF]' : 'text-white'}`}>Profile</span>
          </button>
        </div>
      </div>
    </>
  )
}

// Save Template Modal - pick folder and name
function SaveTemplateModal({ folders, onSave, onCancel }) {
  const [templateName, setTemplateName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(0)

  function handleSave() {
    if (!templateName) return
    onSave(selectedFolder, templateName)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-[#13132A] rounded-t-3xl p-6 pb-10">
        <h2 className="text-lg font-bold text-center mb-5">Save as template</h2>

        <div className="mb-4">
          <div className="text-xs text-[#555] font-semibold uppercase tracking-wide mb-2">Template name</div>
          <input
            type="text"
            placeholder="e.g. Push Day A"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="w-full bg-[#1C1C38] border border-[#2A2A4A] rounded-xl px-4 py-3 text-white placeholder-[#3a3a55] outline-none focus:border-[#7B7BFF] transition-colors"
          />
        </div>

        <div className="mb-5">
          <div className="text-xs text-[#555] font-semibold uppercase tracking-wide mb-2">Save to folder</div>
          <div className="flex flex-col gap-1.5">
            {folders.map((folder, i) => (
              <button
                key={i}
                onClick={() => setSelectedFolder(i)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all
                  ${selectedFolder === i
                    ? 'bg-[#7B7BFF]/15 border border-[#7B7BFF]/40 text-white'
                    : 'bg-[#1C1C38] border border-[#2A2A4A] text-[#888]'
                  }`}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`w-4 h-4 shrink-0 ${selectedFolder === i ? 'stroke-[#7B7BFF] fill-[#7B7BFF]/10' : 'stroke-[#555]'}`}
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                {folder.name}
                <span className="text-[10px] text-[#555] ml-auto">{folder.templates.length}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-bold text-sm mb-3 transition-all ${
            templateName
              ? 'bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] shadow-lg shadow-[#7B7BFF]/25'
              : 'bg-[#1C1C38] text-[#555]'
          }`}
          disabled={!templateName}
        >
          Save template
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 text-sm font-semibold text-[#555]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default App

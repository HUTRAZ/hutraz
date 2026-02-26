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
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('templates')
    return saved ? JSON.parse(saved) : []
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
    localStorage.setItem('templates', JSON.stringify(templates))
  }, [templates])

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
      const newTemplates = [...templates]
      for (const ex of exercises) {
        for (const template of newTemplates) {
          for (let i = 0; i < template.exercises.length; i++) {
            if (template.exercises[i].name === ex.name) {
              template.exercises[i].sets = ex.sets.map(set => ({ kg: set.kg, reps: set.reps }))
            }
          }
        }
      }
      setTemplates(newTemplates)
    }

    setExercises([])
    setActiveRest(null)
    setRestTime(0)
    setShowFinishModal(false)
  }

  function saveTemplate() {
    if (exercises.length === 0) return
    const templateName = prompt('Template name:')
    if (!templateName) return
    const template = {
      name: templateName,
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(set => ({ kg: set.kg, reps: set.reps })),
        restOverride: ex.restOverride,
        note: ex.note || ''
      }))
    }
    setTemplates([...templates, template])
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

  function updateTemplateNote(templateIndex, exIndex, value) {
    const newTemplates = [...templates]
    newTemplates[templateIndex].exercises[exIndex].note = value
    setTemplates(newTemplates)
  }

  function deleteTemplateNote(templateIndex, exIndex) {
    const newTemplates = [...templates]
    newTemplates[templateIndex].exercises[exIndex].note = ''
    setTemplates(newTemplates)
  }

  function deleteTemplate(index) {
    const newTemplates = [...templates]
    newTemplates.splice(index, 1)
    setTemplates(newTemplates)
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

              {templates.length > 0 && exercises.length === 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-3">Templates</h3>
                  <div className="flex flex-col gap-2">
                    {templates.map((t, i) => (
                      <div key={i} className="bg-[#13132A] border border-[#232340] rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">{t.name}</span>
                          <span className="text-xs text-[#555]">{t.exercises.length} exercises</span>
                        </div>
                        {t.exercises.map((ex, j) => (
                          <div key={j} className="ml-1 mb-1">
                            <div className="text-xs text-[#666]">{ex.name} — {ex.sets.length} sets</div>
                            {ex.note && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-[#4a4a6a] italic">"{ex.note}"</span>
                                <button
                                  onClick={() => deleteTemplateNote(i, j)}
                                  className="text-[#3a3a55] hover:text-red-400 transition-colors"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3 h-3 stroke-current">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => loadTemplate(t)}
                            className="flex-1 py-2.5 bg-[#7B7BFF] rounded-xl text-sm font-bold hover:bg-[#6060DD] transition-colors"
                          >
                            Start workout
                          </button>
                          <button
                            onClick={() => deleteTemplate(i)}
                            className="py-2.5 px-4 border border-[#2A2A4A] rounded-xl text-xs font-semibold text-[#555] hover:border-red-500/50 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                <div className="flex flex-col gap-3 mt-4 mb-6">
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

export default App

import { useState, useEffect } from 'react'
import ExerciseCard from './ExerciseCard'

console.log('APP LOADED')

function App() {
  const [showSplash, setShowSplash] = useState(true)
  console.log('showSplash:', showSplash)
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
  const [name, setName] = useState('')
  const [restTime, setRestTime] = useState(0)
  const [restActive, setRestActive] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000)
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
    if (!restActive) return
    if (restTime <= 0) {
      setRestActive(false)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      return
    }
    const timer = setTimeout(() => {
      setRestTime(restTime - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [restActive, restTime])

  function addExercise() {
    if (name === '') return
    setExercises([...exercises, { name: name, sets: [] }])
    setName('')
  }

function addSet(index) {
    console.log('addSet called')
    const newExercises = [...exercises]
    const sets = newExercises[index].sets
    const lastSet = sets[sets.length - 1]
    console.log('lastSet:', lastSet)
    const newSet = lastSet
      ? { kg: lastSet.kg, reps: lastSet.reps, done: false }
      : { kg: '', reps: '', done: false }
    console.log('newSet:', newSet)
    sets.push(newSet)
    setExercises(newExercises)

    setTimeout(() => {
      const input = document.querySelector(`[data-ex="${index}"][data-set="${sets.length - 1}"][data-field="kg"]`)
      if (input) input.focus()
    }, 50)
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
    setRestTime(90)
    setRestActive(true)
  }

  function finishWorkout() {
    if (exercises.length === 0) return
    const workout = {
      date: new Date().toLocaleDateString('da-DK'),
      exercises: exercises
    }
    setHistory([workout, ...history])
    setExercises([])
    setRestActive(false)
    setRestTime(0)
  }

  function saveTemplate() {
    if (exercises.length === 0) return
    const templateName = prompt('Navn på template:')
    if (!templateName) return
    const template = {
      name: templateName,
      exercises: exercises.map(ex => ({ name: ex.name, sets: ex.sets.length }))
    }
    setTemplates([...templates, template])
  }

  function loadTemplate(template) {
    const newExercises = template.exercises.map(ex => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ kg: '', reps: '', done: false }))
    }))
    setExercises(newExercises)
    setPage('workout')
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

  return (
    <>
    {showSplash && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
          <img src="/icon.svg" className="w-20 h-20 mb-4 animate-bounce" />
          <div className="text-2xl font-bold tracking-widest text-white">HUTRAZ</div>
          <div className="text-xs text-[#7B7BFF] mt-2">Simple tracking. Real progress.</div>
        </div>
      )}
      <div className="min-h-screen bg-[#0D0D1A] text-white pb-24">
        <div className="px-4 py-6 max-w-md mx-auto">

          {/* HOME */}
          {page === 'home' && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">HUTRAZ</h1>
              <p className="text-xs text-[#7B7BFF] mb-6">Simple tracking. Real progress.</p>

              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-5 mb-4">
                <div className="text-sm font-semibold text-[#555] uppercase tracking-wide mb-2">Statistik</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{history.length}</div>
                    <div className="text-xs text-[#555]">Workouts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {history.reduce((sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets.length, 0), 0)}
                    </div>
                    <div className="text-xs text-[#555]">Sæt logget</div>
                  </div>
                </div>
              </div>

              {history.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-3">Seneste workouts</div>
                  {history.slice(0, 5).map((w, i) => (
                    <div key={i} className="bg-[#13132A] border border-[#232340] rounded-xl p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">{w.date}</span>
                        <span className="text-xs text-[#555]">{w.exercises.length} øvelser</span>
                      </div>
                      {w.exercises.map((ex, j) => (
                        <div key={j} className="text-xs text-[#666] ml-1">
                          {ex.name} — {ex.sets.length} sæt
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WORKOUT */}
          {page === 'workout' && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-6">Workout</h1>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Øvelsesnavn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                  className="flex-1 bg-[#1C1C38] border border-[#2A2A4A] rounded-xl px-4 py-3 text-white placeholder-[#3a3a55] outline-none focus:border-[#7B7BFF] transition-colors"
                />
                <button
                  onClick={addExercise}
                  className="bg-[#7B7BFF] rounded-xl px-5 py-3 font-bold text-sm hover:bg-[#6060DD] transition-colors"
                >
                  Tilføj
                </button>
              </div>

              {restActive && (
                <div className="bg-[#13132A] border border-[#5BF5A0]/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#5BF5A0] rounded-full animate-pulse" />
                    <span className="text-[#5BF5A0] font-bold text-lg tabular-nums">
                      {Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    onClick={() => setRestActive(false)}
                    className="border border-[#5BF5A0]/30 text-[#5BF5A0] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#5BF5A0]/10 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              )}

              {exercises.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  exercise={ex}
                  exIndex={i}
                  onAddSet={addSet}
                  onUpdateSet={updateSet}
                  onDoneSet={doneSet}
                  bestSet={getBestSet(ex.name)}
                />
              ))}

              {exercises.length > 0 && (
                <div className="flex flex-col gap-3 mt-4 mb-6">
                  <button
                    onClick={finishWorkout}
                    className="w-full py-4 bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] rounded-2xl font-bold text-base shadow-lg shadow-[#7B7BFF]/25 hover:translate-y-[-1px] active:translate-y-[1px] transition-transform"
                  >
                    Afslut workout
                  </button>
                  <button
                    onClick={saveTemplate}
                    className="w-full py-3 border border-dashed border-[#2A2A4A] rounded-2xl text-[#555] text-sm font-semibold hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors"
                  >
                    Gem som template
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TEMPLATES */}
          {page === 'templates' && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-6">Templates</h1>

              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-[#555] text-sm">Ingen templates endnu</div>
                  <div className="text-[#444] text-xs mt-2">Log en workout og gem den som template</div>
                </div>
              ) : (
                templates.map((t, i) => (
                  <div key={i} className="bg-[#13132A] border border-[#232340] rounded-xl p-4 mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold">{t.name}</span>
                      <span className="text-xs text-[#555]">{t.exercises.length} øvelser</span>
                    </div>
                    {t.exercises.map((ex, j) => (
                      <div key={j} className="text-xs text-[#666] ml-1 mb-1">{ex.name} — {ex.sets} sæt</div>
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
                        Slet
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D1A]/95 backdrop-blur-xl border-t border-[#1a1a30] px-6 py-3 pb-8 flex justify-around max-w-md mx-auto">
          <button onClick={() => setPage('home')} className={`flex flex-col items-center gap-1 ${page === 'home' ? 'opacity-100' : 'opacity-40'}`}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${page === 'home' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span className={`text-[10px] font-semibold ${page === 'home' ? 'text-[#7B7BFF]' : 'text-white'}`}>Home</span>
          </button>
          <button onClick={() => setPage('workout')} className={`flex flex-col items-center gap-1 ${page === 'workout' ? 'opacity-100' : 'opacity-40'}`}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'workout' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className={`text-[10px] font-semibold ${page === 'workout' ? 'text-[#7B7BFF]' : 'text-white'}`}>Workout</span>
          </button>
          <button onClick={() => setPage('templates')} className={`flex flex-col items-center gap-1 ${page === 'templates' ? 'opacity-100' : 'opacity-40'}`}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'templates' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            <span className={`text-[10px] font-semibold ${page === 'templates' ? 'text-[#7B7BFF]' : 'text-white'}`}>Templates</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default App

import { useState, useEffect } from 'react'
import ExerciseCard from './ExerciseCard'

function App() {
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
    const newExercises = [...exercises]
    newExercises[index].sets.push({ kg: '', reps: '', done: false })
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
    <div className="min-h-screen bg-[#0D0D1A] text-white px-4 py-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">HUTRAZ</h1>

      {templates.length > 0 && exercises.length === 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-3">Templates</h3>
          <div className="flex flex-wrap gap-2">
            {templates.map((t, i) => (
              <button
                key={i}
                onClick={() => loadTemplate(t)}
                className="bg-[#13132A] border border-[#232340] rounded-xl px-4 py-3 text-sm font-semibold hover:border-[#7B7BFF] transition-colors"
              >
                {t.name} ({t.exercises.length} øvelser)
              </button>
            ))}
          </div>
        </div>
      )}

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

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-4">Tidligere workouts</h2>
          {history.map((w, i) => (
            <div key={i} className="bg-[#13132A] border border-[#232340] rounded-xl p-4 mb-3">
              <h4 className="text-sm font-bold mb-2">{w.date}</h4>
              {w.exercises.map((ex, j) => (
                <div key={j} className="mb-2">
                  <div className="text-sm font-semibold text-[#B8B8FF]">{ex.name}</div>
                  {ex.sets.map((set, k) => (
                    <div key={k} className="text-xs text-[#555] ml-3">
                      Sæt {k + 1}: {set.kg} kg x {set.reps} reps
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
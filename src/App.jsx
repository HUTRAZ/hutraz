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
      alert('Hvil er ovre!')
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
    <div>
      <h1>Hutraz</h1>

      {templates.length > 0 && exercises.length === 0 && (
        <div>
          <h3>Templates</h3>
          {templates.map((t, i) => (
            <button key={i} onClick={() => loadTemplate(t)}>
              {t.name} ({t.exercises.length} øvelser)
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Øvelsesnavn"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={addExercise}>Tilføj øvelse</button>

      {restActive && (
        <div>
          <strong>Hvil: {Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}</strong>
          <button onClick={() => setRestActive(false)}>Skip</button>
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
        <div>
          <button onClick={finishWorkout}>Afslut workout</button>
          <button onClick={saveTemplate}>Gem som template</button>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2>Tidligere workouts</h2>
          {history.map((w, i) => (
            <div key={i}>
              <h4>{w.date}</h4>
              {w.exercises.map((ex, j) => (
                <div key={j}>
                  <strong>{ex.name}</strong>
                  {ex.sets.map((set, k) => (
                    <div key={k}>
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
function ExerciseCard({ exercise, exIndex, onAddSet, onUpdateSet, onDoneSet, bestSet }) {
  return (
    <div>
      <h3>{exercise.name}</h3>
      {bestSet && (
        <div>PR: {bestSet.kg} kg x {bestSet.reps} reps</div>
      )}
      {exercise.sets.map((set, j) => (
        <div key={j}>
          <span>Sæt {j + 1}: </span>
          <input
            type="number"
            placeholder="kg"
            value={set.kg}
            onChange={(e) => onUpdateSet(exIndex, j, 'kg', e.target.value)}
            disabled={set.done}
          />
          <input
            type="number"
            placeholder="reps"
            value={set.reps}
            onChange={(e) => onUpdateSet(exIndex, j, 'reps', e.target.value)}
            disabled={set.done}
          />
          {set.done ? (
            <span> ✓</span>
          ) : (
            <button onClick={() => onDoneSet(exIndex, j)}>Done</button>
          )}
        </div>
      ))}
      <button onClick={() => onAddSet(exIndex)}>+ Tilføj sæt</button>
    </div>
  )
}

export default ExerciseCard
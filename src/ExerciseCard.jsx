function ExerciseCard({ exercise, exIndex, onAddSet, onUpdateSet, onDoneSet, bestSet }) {
  return (
    <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-5 mb-3">
      <div className="text-lg font-bold tracking-tight">{exercise.name}</div>
      {bestSet && (
        <div className="text-xs text-[#4a4a6a] mt-1">PR: {bestSet.kg} kg x {bestSet.reps} reps</div>
      )}

      <div className="grid grid-cols-[32px_1fr_1fr_36px] gap-1.5 mt-4 mb-2">
        <span className="text-[10px] font-bold text-[#444] uppercase text-center">Set</span>
        <span className="text-[10px] font-bold text-[#444] uppercase text-center">KG</span>
        <span className="text-[10px] font-bold text-[#444] uppercase text-center">Reps</span>
        <span></span>
      </div>

      {exercise.sets.map((set, j) => (
        <div key={j} className="grid grid-cols-[32px_1fr_1fr_36px] gap-1.5 items-center mb-2">
          <span className="text-sm font-bold text-[#666] text-center">{j + 1}</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="kg"
            data-ex={exIndex}
            data-set={j}
            data-field="kg"
            value={set.kg}
            onChange={(e) => onUpdateSet(exIndex, j, 'kg', e.target.value)}
            disabled={set.done}
            className={`w-full min-w-0 bg-[#1C1C38] border rounded-xl px-2 py-2 text-center text-sm font-bold outline-none transition-all
              ${set.done
                ? 'border-[#7B7BFF]/25 bg-[#7B7BFF]/5 text-[#B8B8FF]'
                : 'border-[#2A2A4A] text-white placeholder-[#3a3a55] focus:border-[#7B7BFF] focus:shadow-[0_0_0_3px_rgba(123,123,255,0.15)]'
              }`}
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="reps"
            data-ex={exIndex}
            data-set={j}
            data-field="reps"
            value={set.reps}
            onChange={(e) => onUpdateSet(exIndex, j, 'reps', e.target.value)}
            disabled={set.done}
            className={`w-full min-w-0 bg-[#1C1C38] border rounded-xl px-2 py-2 text-center text-sm font-bold outline-none transition-all
              ${set.done
                ? 'border-[#7B7BFF]/25 bg-[#7B7BFF]/5 text-[#B8B8FF]'
                : 'border-[#2A2A4A] text-white placeholder-[#3a3a55] focus:border-[#7B7BFF] focus:shadow-[0_0_0_3px_rgba(123,123,255,0.15)]'
              }`}
          />
          {set.done ? (
            <div className="w-8 h-8 bg-[#5BF5A0] rounded-lg flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" className="w-4 h-4 stroke-[#0D0D1A]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <button
              onClick={() => onDoneSet(exIndex, j)}
              className="w-8 h-8 border-2 border-[#2A2A4A] rounded-lg flex items-center justify-center mx-auto hover:border-[#5BF5A0] transition-colors active:scale-90"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" className="w-4 h-4 stroke-[#3a3a55]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => onAddSet(exIndex)}
        className="w-full py-3 mt-3 border border-dashed border-[#2A2A4A] rounded-xl text-[#555] text-xs font-semibold hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors"
      >
        + Tilføj sæt
      </button>
    </div>
  )
}

export default ExerciseCard

import { useState, useRef } from 'react'

const REST_PRESETS = [30, 60, 90, 120, 180]

function ExerciseCard({ exercise, exIndex, onAddSet, onUpdateSet, onDoneSet, onDeleteSet, onUpdateExerciseRest, onUpdateExerciseNote, bestSet, previousSets, activeRest, restTime, restDuration, defaultRest, onSkipRest }) {
  const [showRestPicker, setShowRestPicker] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [swipedSet, setSwipedSet] = useState(null)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const touchDeltaRef = useRef(0)
  const isSwipingRef = useRef(false)
  const rowRefs = useRef({})

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  function handleTouchStart(e, setIndex) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchDeltaRef.current = 0
    isSwipingRef.current = false
  }

  function handleTouchMove(e, setIndex) {
    const deltaX = touchStartRef.current.x - e.touches[0].clientX
    const deltaY = Math.abs(touchStartRef.current.y - e.touches[0].clientY)

    if (!isSwipingRef.current && deltaX > 10 && deltaX > deltaY) {
      isSwipingRef.current = true
    }

    if (!isSwipingRef.current) return

    touchDeltaRef.current = deltaX
    const el = rowRefs.current[setIndex]
    if (el && deltaX > 0) {
      el.style.transform = `translateX(${Math.max(-80, -deltaX)}px)`
      el.style.transition = 'none'
    }
  }

  function handleTouchEnd(e, setIndex) {
    const el = rowRefs.current[setIndex]
    if (!el) return

    el.style.transition = 'transform 0.2s ease'

    if (touchDeltaRef.current > 60) {
      el.style.transform = 'translateX(-80px)'
      if (swipedSet !== null && swipedSet !== setIndex) {
        const prevEl = rowRefs.current[swipedSet]
        if (prevEl) {
          prevEl.style.transition = 'transform 0.2s ease'
          prevEl.style.transform = 'translateX(0)'
        }
      }
      setSwipedSet(setIndex)
    } else {
      el.style.transform = 'translateX(0)'
      if (swipedSet === setIndex) setSwipedSet(null)
    }

    touchStartRef.current = { x: 0, y: 0 }
    touchDeltaRef.current = 0
    isSwipingRef.current = false
  }

  function confirmDelete(setIndex) {
    const el = rowRefs.current[setIndex]
    if (el) {
      el.style.transition = 'transform 0.2s ease'
      el.style.transform = 'translateX(0)'
    }
    setSwipedSet(null)
    onDeleteSet(exIndex, setIndex)
  }

  function tapOutside(setIndex) {
    if (swipedSet !== null && swipedSet !== setIndex) {
      const el = rowRefs.current[swipedSet]
      if (el) {
        el.style.transition = 'transform 0.2s ease'
        el.style.transform = 'translateX(0)'
      }
      setSwipedSet(null)
    }
  }

  const currentRest = exercise.restOverride !== null && exercise.restOverride !== undefined
    ? exercise.restOverride
    : defaultRest

  const hasPrevious = previousSets && previousSets.length > 0

  return (
    <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-5 mb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold tracking-tight">{exercise.name}</div>
          {bestSet && (
            <div className="text-xs text-[#4a4a6a] mt-1">PR: {bestSet.kg} kg x {bestSet.reps} reps</div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors
              ${exercise.note
                ? 'bg-[#7B7BFF]/10 text-[#7B7BFF] border border-[#7B7BFF]/20'
                : 'bg-[#1C1C38] text-[#555] border border-[#2A2A4A]'
              }`}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 stroke-current">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button
            onClick={() => setShowRestPicker(!showRestPicker)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors
              ${exercise.restOverride !== null && exercise.restOverride !== undefined
                ? 'bg-[#5BF5A0]/10 text-[#5BF5A0] border border-[#5BF5A0]/20'
                : 'bg-[#1C1C38] text-[#555] border border-[#2A2A4A]'
              }`}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3 h-3 stroke-current">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {formatTime(currentRest)}
          </button>
        </div>
      </div>

      {/* Note display */}
      {exercise.note && !showNoteInput && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-[#1C1C38] rounded-lg border border-[#2A2A4A]">
          <span className="text-xs text-[#888] italic flex-1">{exercise.note}</span>
          <button
            onClick={() => onUpdateExerciseNote(exIndex, '')}
            className="text-[#3a3a55] hover:text-red-400 transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 stroke-current">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Note input */}
      {showNoteInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder="Add a note..."
            value={exercise.note || ''}
            onChange={(e) => onUpdateExerciseNote(exIndex, e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setShowNoteInput(false)}
            autoFocus
            className="flex-1 bg-[#1C1C38] border border-[#2A2A4A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#3a3a55] outline-none focus:border-[#7B7BFF] transition-colors"
          />
          <button
            onClick={() => setShowNoteInput(false)}
            className="px-3 py-2 bg-[#7B7BFF] rounded-lg text-xs font-bold hover:bg-[#6060DD] transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Per-exercise rest picker */}
      {showRestPicker && (
        <div className="mt-3 mb-2 p-3 bg-[#1C1C38] rounded-xl border border-[#2A2A4A]">
          <div className="text-[10px] text-[#555] font-semibold uppercase tracking-wide mb-2">Rest timer for this exercise</div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => { onUpdateExerciseRest(exIndex, ''); setShowRestPicker(false) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${exercise.restOverride === null || exercise.restOverride === undefined
                  ? 'bg-[#7B7BFF] text-white'
                  : 'bg-[#13132A] border border-[#2A2A4A] text-[#888]'
                }`}
            >
              Default
            </button>
            {REST_PRESETS.map(seconds => (
              <button
                key={seconds}
                onClick={() => { onUpdateExerciseRest(exIndex, seconds); setShowRestPicker(false) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${exercise.restOverride === seconds
                    ? 'bg-[#5BF5A0] text-[#0D0D1A]'
                    : 'bg-[#13132A] border border-[#2A2A4A] text-[#888]'
                  }`}
              >
                {formatTime(seconds)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header row */}
      <div className={`grid ${hasPrevious ? 'grid-cols-[32px_50px_1fr_1fr_36px]' : 'grid-cols-[32px_1fr_1fr_36px]'} gap-1.5 mt-4 mb-2`}>
        <span className="text-[10px] font-bold text-[#444] uppercase text-center">Set</span>
        {hasPrevious && <span className="text-[10px] font-bold text-[#444] uppercase text-center">Prev</span>}
        <span className="text-[10px] font-bold text-[#444] uppercase text-center">KG</span>
        <span className="text-[10px] font-bold text-[#444] uppercase text-center">Reps</span>
        <span></span>
      </div>

      {exercise.sets.map((set, j) => {
        const isActiveRest = activeRest && activeRest.exIndex === exIndex && activeRest.setIndex === j
        const hasCompletedRest = set.done && set.restTime && !isActiveRest
        const prevSet = previousSets && previousSets[j]
        const isSwiped = swipedSet === j

        return (
          <div key={j}>
            {/* Swipeable container */}
            <div className="relative overflow-hidden rounded-lg mb-1">
              {/* Delete button behind */}
              <button
                onClick={() => confirmDelete(j)}
                className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 rounded-r-lg z-0"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 stroke-white mr-1">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span className="text-white text-xs font-bold">Delete</span>
              </button>

              {/* Set row - slides over delete button */}
              <div
                ref={(el) => { rowRefs.current[j] = el }}
                className={`grid ${hasPrevious ? 'grid-cols-[32px_50px_1fr_1fr_36px]' : 'grid-cols-[32px_1fr_1fr_36px]'} gap-1.5 items-center bg-[#13132A] relative z-10 h-full`}
                onTouchStart={(e) => { tapOutside(j); handleTouchStart(e, j) }}
                onTouchMove={(e) => handleTouchMove(e, j)}
                onTouchEnd={(e) => handleTouchEnd(e, j)}
              >
                <span className="text-sm font-bold text-[#666] text-center">{j + 1}</span>
                {hasPrevious && (
                  <span className="text-[10px] text-[#4a4a6a] text-center font-medium italic">
                    {prevSet ? `${prevSet.kg}×${prevSet.reps}` : '—'}
                  </span>
                )}
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
            </div>

            {/* Active rest timer inline */}
            {isActiveRest && (
              <div className="flex items-center justify-center gap-3 py-2 my-1 rounded-lg relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#5BF5A0]/10 to-[#4ECDC4]/5 rounded-lg transition-all duration-500"
                  style={{ width: `${Math.max(0, (restTime / restDuration) * 100)}%` }}
                />
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 stroke-[#5BF5A0] relative z-10">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-[#5BF5A0] font-bold text-base tabular-nums relative z-10 min-w-[40px] text-center">
                  {formatTime(restTime)}
                </span>
                <button
                  onClick={onSkipRest}
                  className="border border-[#5BF5A0]/30 text-[#5BF5A0] text-[10px] font-semibold px-2.5 py-1 rounded-md relative z-10"
                >
                  Skip
                </button>
              </div>
            )}

            {/* Completed rest indicator */}
            {hasCompletedRest && (
              <div className="flex items-center justify-center gap-1.5 py-1 my-0.5">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3 h-3 stroke-[#3a3a55]">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-[#3a3a55] text-[10px] font-semibold">{formatTime(set.restTime)}</span>
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={() => onAddSet(exIndex)}
        className="w-full py-3 mt-3 border border-dashed border-[#2A2A4A] rounded-xl text-[#555] text-xs font-semibold hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors"
      >
        + Add set
      </button>
    </div>
  )
}

export default ExerciseCard

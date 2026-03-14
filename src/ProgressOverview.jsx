import { useState, useEffect } from 'react'
import { getTopMovers } from './progressUtils'
import { MUSCLE_COLOURS_HEX, getMuscleRecoveryPct, formatMuscleLabel } from './utils'
import PhotosModal from './PhotosModal'
import { loadPhotoSrc } from './PhotosModal'

const TOTAL_FREE_PHOTOS = 24

export default function ProgressOverview({
  history,
  muscleLastWorked,
  weekStreak,
  weightLog,
  bodyFatLog,
  muscleMassLog,
  photoSessions,
  setPhotoSessions,
  unitWeight,
}) {
  const [showPhotos, setShowPhotos] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [showAllHistory, setShowAllHistory] = useState(false)

  const safeHistory = Array.isArray(history) ? history : []
  const safeWeekStreak = Array.isArray(weekStreak) ? weekStreak : []
  const safeWeightLog = Array.isArray(weightLog) ? weightLog : []
  const safeBodyFatLog = Array.isArray(bodyFatLog) ? bodyFatLog : []
  const safeMuscleMassLog = Array.isArray(muscleMassLog) ? muscleMassLog : []
  const safePhotoSessions = Array.isArray(photoSessions) ? photoSessions : []
  const safeMuscleLastWorked = muscleLastWorked && typeof muscleLastWorked === 'object' ? muscleLastWorked : {}

  const thisWeekSessions = safeWeekStreak.filter((d) => d.worked || d.isToday).length
  const thisWeekTime = (() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dayOfWeek = (now.getDay() + 6) % 7
    return safeHistory
      .filter((w) => {
        const parts = (w.date || '').split('/')
        if (parts.length !== 3) return false
        const d = new Date(parts[2], parts[1] - 1, parts[0])
        d.setHours(0, 0, 0, 0)
        return (now - d) / 86400000 <= dayOfWeek
      })
      .reduce((sum, w) => sum + (w.duration || 0), 0)
  })()
  const thisWeekVol = (() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dayOfWeek = (now.getDay() + 6) % 7
    return safeHistory
      .filter((w) => {
        const parts = (w.date || '').split('/')
        if (parts.length !== 3) return false
        const d = new Date(parts[2], parts[1] - 1, parts[0])
        d.setHours(0, 0, 0, 0)
        return (now - d) / 86400000 <= dayOfWeek
      })
      .reduce(
        (sum, w) =>
          sum +
          (w.exercises || []).reduce((s, ex) => {
            const doneSets = (ex.sets || []).filter((set) => set.done === true)
            return s + doneSets.reduce((v, set) => v + Number(set.kg || 0) * Number(set.reps || 0), 0)
          }, 0),
        0
      )
  })()

  const movers = getTopMovers(safeHistory, 2)

  const latestWeight = safeWeightLog.length > 0 ? safeWeightLog[safeWeightLog.length - 1] : null
  const firstWeight = safeWeightLog.length > 0 ? safeWeightLog[0] : null
  const latestBF = safeBodyFatLog.length > 0 ? safeBodyFatLog[safeBodyFatLog.length - 1] : null
  const latestMuscleMass = safeMuscleMassLog.length > 0 ? safeMuscleMassLog[safeMuscleMassLog.length - 1] : null
  const firstMuscleMass = safeMuscleMassLog.length > 0 ? safeMuscleMassLog[0] : null

  const OVERVIEW_MUSCLES = ['chest', 'back', 'quads', 'side-delts', 'biceps', 'triceps', 'glutes', 'abs']
  const CIRC = 2 * Math.PI * 14

  const oldestSession = safePhotoSessions.length > 0 ? safePhotoSessions[0] : null
  const newestSession = safePhotoSessions.length > 1 ? safePhotoSessions[safePhotoSessions.length - 1] : null

  return (
    <div className="flex flex-col gap-0">
      <div className="sec">This week</div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <StatTile val={thisWeekSessions} unit="×" label="Workouts" />
        <StatTile val={(thisWeekTime / 3600).toFixed(1)} unit="h" label="Time" />
        <StatTile
          val={thisWeekVol >= 1000 ? (thisWeekVol / 1000).toFixed(1) + 'k' : thisWeekVol}
          unit=""
          label="Volume"
        />
      </div>

      {movers.length > 0 && (
        <>
          <div className="sec">Strength · top movers</div>
          {movers.map((m) => (
            <div
              key={m.name}
              className="bg-card border border-border rounded-[14px] p-[13px_14px] mb-[6px] flex items-center justify-between"
            >
              <div>
                <div className="text-[14px] font-bold text-text">{m.name}</div>
                <div className="text-[10px] text-muted mt-0.5">
                  {m.currentE1RM} {unitWeight} · est. max
                </div>
              </div>
              <div className={`rounded-[6px] px-[10px] py-[4px] text-[12px] font-extrabold ${
                m.pct > 0 ? 'bg-[rgba(91,245,160,0.09)] border border-[rgba(91,245,160,0.2)] text-success' : 'bg-card-alt border border-border text-muted'
              }`}>
                {m.pct > 0 ? `↑ +${m.pct}%` : m.pct < 0 ? `↓ ${m.pct}%` : '—'}
              </div>
            </div>
          ))}
        </>
      )}

      {(latestWeight || latestMuscleMass) && (
        <>
          <div className="sec">Body</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {latestWeight && (
              <StatTile
                val={latestWeight.value}
                unit={unitWeight}
                label="Weight"
                delta={firstWeight && firstWeight !== latestWeight ? latestWeight.value - firstWeight.value : null}
                deltaLabel="since start"
                invertDelta
              />
            )}
            {latestMuscleMass && (
              <StatTile
                val={latestMuscleMass.value}
                unit={unitWeight}
                label="Muscle mass"
                delta={firstMuscleMass ? latestMuscleMass.value - firstMuscleMass.value : null}
                deltaLabel="since start"
              />
            )}
          </div>
        </>
      )}

      <div className="sec">Transformation</div>
      <TransformCard
        oldestSession={oldestSession}
        newestSession={newestSession}
        onOpen={() => setShowPhotos(true)}
        photoSessions={safePhotoSessions}
      />

      <div className="sec">Recovery · now</div>
      <div className="grid grid-cols-4 gap-[5px] mb-2">
        {OVERVIEW_MUSCLES.map((slug) => {
          const pct = getMuscleRecoveryPct(slug, safeMuscleLastWorked[slug] ?? null)
          const colour = MUSCLE_COLOURS_HEX[slug] ?? '#888'
          const offset = CIRC * (1 - pct / 100)
          return (
            <div
              key={slug}
              className="bg-card border border-border rounded-[12px] py-[10px] px-[5px] flex flex-col items-center gap-[5px]"
            >
              <div className="relative w-[36px] h-[36px]">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={colour}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={offset}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-extrabold text-white">
                  {pct}%
                </span>
              </div>
              <span className="text-[8px] font-bold text-muted uppercase tracking-[0.4px] text-center">
                {formatMuscleLabel(slug)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="sec">Recent workouts</div>
      {safeHistory.length === 0 ? (
        <div className="text-sm text-muted italic mb-4">No workouts yet</div>
      ) : (
        <>
          {safeHistory.slice(0, 5).map((w, i) => (
            <WorkoutHistoryRow
              key={w.date + (w.name || '') + i}
              workout={w}
              unitWeight={unitWeight}
              onClick={() => setSelectedWorkout(w)}
            />
          ))}
          {safeHistory.length > 5 && (
            <button
              onClick={() => setShowAllHistory(true)}
              className="w-full py-2.5 text-[12px] font-semibold text-accent text-center mb-2"
            >
              Show all {safeHistory.length} workouts
            </button>
          )}
        </>
      )}

      {selectedWorkout && (
        <WorkoutDetailSheet
          workout={selectedWorkout}
          unitWeight={unitWeight}
          onClose={() => setSelectedWorkout(null)}
        />
      )}

      {showAllHistory && (
        <AllHistorySheet
          history={safeHistory}
          unitWeight={unitWeight}
          onSelect={(w) => {
            setSelectedWorkout(w)
            setShowAllHistory(false)
          }}
          onClose={() => setShowAllHistory(false)}
        />
      )}

      {showPhotos && (
        <PhotosModal
          photoSessions={safePhotoSessions}
          setPhotoSessions={setPhotoSessions}
          totalPhotos={safePhotoSessions.reduce((sum, s) => sum + [s.front, s.back, s.side].filter(Boolean).length, 0)}
          atLimit={safePhotoSessions.reduce((sum, s) => sum + [s.front, s.back, s.side].filter(Boolean).length, 0) >= TOTAL_FREE_PHOTOS}
          onClose={() => setShowPhotos(false)}
        />
      )}
    </div>
  )
}

function StatTile({ val, unit, label, delta, deltaLabel, invertDelta }) {
  const isPositive = delta > 0
  const isGood = invertDelta ? !isPositive : isPositive
  return (
    <div className="bg-card border border-border rounded-[14px] p-[13px_12px]">
      <div className="text-[20px] font-extrabold text-text leading-none">
        {val}
        <span className="text-[10px] text-muted font-semibold ml-0.5">{unit}</span>
      </div>
      <div className="text-[9px] font-bold text-muted uppercase tracking-[0.5px] mt-1">{label}</div>
      {delta != null && delta !== 0 && (
        <div className={`text-[10px] font-bold mt-1 ${isGood ? 'text-success' : 'text-[#ff6b6b]'}`}>
          {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)} {unit} {deltaLabel}
        </div>
      )}
    </div>
  )
}

function TransformCard({ oldestSession, newestSession, onOpen, photoSessions }) {
  if (photoSessions.length === 0) {
    return (
      <div
        onClick={onOpen}
        className="bg-card border border-border rounded-[14px] overflow-hidden cursor-pointer mb-2 relative"
      >
        <div className="grid grid-cols-2 gap-[2px]">
          {['Before', 'After'].map((label) => (
            <div key={label} className="aspect-[0.85] bg-card-deep flex items-center justify-center relative">
              <svg width="48" height="86" viewBox="0 0 50 90" fill="none">
                <ellipse cx="25" cy="14" rx="10" ry="11" fill="rgba(255,255,255,0.05)" />
                <path
                  d="M10 35 Q10 24 25 24 Q40 24 40 35 L43 70 Q43 74 39 74 L34 74 L32 90 L18 90 L16 74 L11 74 Q7 74 7 70 Z"
                  fill="rgba(255,255,255,0.05)"
                />
              </svg>
              <span className="absolute bottom-2 text-[8px] font-bold text-muted uppercase tracking-[0.5px]">
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-page border border-border rounded-[20px] px-2 py-1 text-[9px] font-extrabold text-muted z-10">
          VS
        </div>
        <div className="flex items-center justify-between p-[12px_14px] border-t border-border">
          <div>
            <div className="text-[13px] font-bold text-text">Start tracking</div>
            <div className="text-[10px] text-muted mt-0.5">Add your first photos</div>
          </div>
          <div className="w-[26px] h-[26px] bg-[rgba(123,123,255,0.08)] border border-[rgba(123,123,255,0.2)] rounded-full flex items-center justify-center text-accent text-[12px]">
            →
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onOpen}
      className="bg-card border border-border rounded-[14px] overflow-hidden cursor-pointer mb-2 relative"
    >
      <div className="grid grid-cols-2 gap-[2px]">
        <PhotoThumb session={oldestSession} label={oldestSession?.date} />
        <PhotoThumb session={newestSession ?? oldestSession} label={newestSession?.date ?? oldestSession?.date} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-page border border-border rounded-[20px] px-2 py-1 text-[9px] font-extrabold text-muted z-10">
        VS
      </div>
      <div className="flex items-center justify-between p-[12px_14px] border-t border-border">
        <div>
          <div className="text-[13px] font-bold text-text">Your transformation</div>
          <div className="text-[10px] text-muted mt-0.5">
            {oldestSession?.date} → {newestSession?.date ?? oldestSession?.date} · {photoSessions.length * 3} photos
          </div>
        </div>
        <div className="w-[26px] h-[26px] bg-[rgba(123,123,255,0.08)] border border-[rgba(123,123,255,0.2)] rounded-full flex items-center justify-center text-accent text-[12px]">
          →
        </div>
      </div>
    </div>
  )
}

function PhotoThumb({ session, label }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!session?.front) return
    loadPhotoSrc(session.front).then(setSrc).catch(() => {})
  }, [session?.front])

  return (
    <div className="aspect-[0.85] bg-card-deep flex items-center justify-center relative overflow-hidden">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <svg width="44" height="80" viewBox="0 0 50 90" fill="none">
          <ellipse cx="25" cy="14" rx="10" ry="11" fill="rgba(255,255,255,0.07)" />
          <path
            d="M10 35 Q10 24 25 24 Q40 24 40 35 L43 70 Q43 74 39 74 L34 74 L32 90 L18 90 L16 74 L11 74 Q7 74 7 70 Z"
            fill="rgba(255,255,255,0.07)"
          />
        </svg>
      )}
      {label && (
        <span className="absolute bottom-2 text-[8px] font-bold text-white/30 uppercase tracking-[0.5px]">
          {label}
        </span>
      )}
    </div>
  )
}

function relDate(dateStr) {
  if (!dateStr) return ''
  const parts = (dateStr || '').split('/')
  if (parts.length !== 3) return dateStr
  const d = new Date(parts[2], parts[1] - 1, parts[0])
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  if (diff < 14) return '1 week ago'
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
  return dateStr
}

function WorkoutHistoryRow({ workout, unitWeight, onClick }) {
  const doneSets = (workout.exercises || []).reduce(
    (sum, ex) => sum + (ex.sets || []).filter((s) => s.done).length,
    0
  )
  const volume = (workout.exercises || []).reduce(
    (sum, ex) =>
      sum +
      (ex.sets || [])
        .filter((s) => s.done)
        .reduce((v, s) => v + Number(s.kg || 0) * Number(s.reps || 0), 0),
    0
  )
  const mins = workout.duration ? Math.floor(workout.duration / 60) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[14px] p-[13px_14px] mb-[6px] text-left"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[14px] font-bold text-text truncate mr-2">
          {workout.name || workout.date}
        </span>
        <span className="text-[11px] text-muted shrink-0">{relDate(workout.date)}</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted">
        {mins != null && <span>{mins} min</span>}
        <span>{doneSets} sets</span>
        {volume > 0 && (
          <span>{volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume} {unitWeight}</span>
        )}
      </div>
    </button>
  )
}

function WorkoutDetailSheet({ workout, unitWeight, onClose }) {
  const doneSets = (workout.exercises || []).reduce(
    (sum, ex) => sum + (ex.sets || []).filter((s) => s.done).length,
    0
  )
  const volume = (workout.exercises || []).reduce(
    (sum, ex) =>
      sum +
      (ex.sets || [])
        .filter((s) => s.done)
        .reduce((v, s) => v + Number(s.kg || 0) * Number(s.reps || 0), 0),
    0
  )
  const mins = workout.duration ? Math.floor(workout.duration / 60) : null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-page rounded-t-[20px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-[17px] font-extrabold text-text">
              {workout.name || workout.date}
            </h2>
            <p className="text-[11px] text-muted mt-0.5">{workout.date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-card-alt flex items-center justify-center text-muted text-sm"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-5 py-4 shrink-0">
          {mins != null && (
            <div className="bg-card border border-border rounded-[12px] p-3 text-center">
              <div className="text-[18px] font-extrabold text-text">{mins}</div>
              <div className="text-[9px] font-bold text-muted uppercase tracking-[0.5px] mt-0.5">Min</div>
            </div>
          )}
          <div className="bg-card border border-border rounded-[12px] p-3 text-center">
            <div className="text-[18px] font-extrabold text-text">{doneSets}</div>
            <div className="text-[9px] font-bold text-muted uppercase tracking-[0.5px] mt-0.5">Sets</div>
          </div>
          {volume > 0 && (
            <div className="bg-card border border-border rounded-[12px] p-3 text-center">
              <div className="text-[18px] font-extrabold text-text">
                {volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume}
              </div>
              <div className="text-[9px] font-bold text-muted uppercase tracking-[0.5px] mt-0.5">
                {unitWeight} vol
              </div>
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-5 pb-8">
          {(workout.exercises || []).map((ex, i) => {
            const done = (ex.sets || []).filter((s) => s.done)
            if (!done.length) return null
            return (
              <div key={i} className="mb-4">
                <div className="text-[13px] font-bold text-text mb-1.5">{ex.name}</div>
                {done.map((s, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3 py-1 border-b border-border last:border-0"
                  >
                    <span className="text-[11px] text-muted w-6">{j + 1}</span>
                    <span className="text-[12px] font-semibold text-text">
                      {s.kg ? `${s.kg} ${unitWeight}` : ''}
                      {s.kg && s.reps ? ' × ' : ''}
                      {s.reps ? `${s.reps} reps` : ''}
                      {s.time ? s.time : ''}
                      {s.distance ? `${s.distance} km` : ''}
                    </span>
                    {s.rir !== undefined && s.rir !== null && (
                      <span className="ml-auto text-[10px] text-muted">RIR {s.rir}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AllHistorySheet({ history, unitWeight, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? history.filter(
        (w) =>
          (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (w.date || '').includes(search)
      )
    : history

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-page rounded-t-[20px] max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <h2 className="text-[17px] font-extrabold text-text">All workouts</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-card-alt flex items-center justify-center text-muted text-sm"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-3 shrink-0">
          <div className="bg-card border border-border rounded-[12px] p-[10px_14px] flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-muted shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workouts..."
              className="bg-transparent text-[13px] text-text placeholder-muted outline-none flex-1"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-muted text-sm">
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-5 pb-8">
          {filtered.map((w, i) => (
            <WorkoutHistoryRow
              key={w.date + (w.name || '') + i}
              workout={w}
              unitWeight={unitWeight}
              onClick={() => onSelect(w)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted italic text-center py-8">No workouts found</div>
          )}
        </div>
      </div>
    </div>
  )
}

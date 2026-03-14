import { useState, useMemo } from 'react'
import { getTopMovers, getTrainedExercises, getE1RMHistory, getBestE1RM } from './progressUtils'

const PERIODS = ['4W', '3M', '6M', '1Y', 'All']

export default function ProgressStrength({ history, unitWeight }) {
  const [period, setPeriod] = useState('6M')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const safeHistory = Array.isArray(history) ? history : []
  const movers = useMemo(() => getTopMovers(safeHistory, 3), [safeHistory])
  const trained = useMemo(() => getTrainedExercises(safeHistory), [safeHistory])

  const filtered = search ? trained.filter((n) => n.toLowerCase().includes(search.toLowerCase())) : []

  function filterByPeriod(points) {
    if (period === 'All') return points
    const now = Date.now()
    const MS = { '4W': 28, '3M': 90, '6M': 180, '1Y': 365 }[period] * 86400000
    return points.filter((p) => now - p.date.getTime() <= MS)
  }

  const e1rmHistory = selected ? filterByPeriod(getE1RMHistory(selected, safeHistory)) : []
  const allTimePR = selected ? getBestE1RM(selected, safeHistory) : null

  const lastSession = selected
    ? (() => {
        for (const w of safeHistory) {
          const ex = (w.exercises || []).find((e) => e.name === selected)
          if (!ex) continue
          const doneSets = (ex.sets || []).filter((s) => s.done === true && s.kg != null && s.reps != null)
          if (!doneSets.length) continue
          return { date: w.date, sets: doneSets }
        }
        return null
      })()
    : null

  const chartMax = e1rmHistory.length ? Math.max(...e1rmHistory.map((p) => p.e1rm)) : 0

  return (
    <div>
      <div className="sec">Top movers</div>
      {movers.length === 0 && (
        <div className="text-sm text-muted italic mb-4">Train each exercise at least 2 times to see top movers</div>
      )}
      {movers.map((m) => (
        <button
          key={m.name}
          onClick={() => {
            setSelected(m.name)
            setSearch('')
          }}
          className="w-full bg-card border border-border rounded-[14px] p-[13px_14px] mb-[6px] flex items-center justify-between text-left"
        >
          <div>
            <div className="text-[14px] font-bold text-text">{m.name}</div>
            <div className="text-[10px] text-muted mt-0.5">
              {m.prevE1RM} → {m.currentE1RM} {unitWeight} est. max
            </div>
          </div>
          <div className={`rounded-[6px] px-[10px] py-[4px] text-[12px] font-extrabold ${
            m.pct > 0 ? 'bg-[rgba(91,245,160,0.09)] border border-[rgba(91,245,160,0.2)] text-success' : 'bg-card-alt border border-border text-muted'
          }`}>
            {m.pct > 0 ? `↑ +${m.pct}%` : m.pct < 0 ? `↓ ${m.pct}%` : '—'}
          </div>
        </button>
      ))}

      <div className="sec">Exercise deep-dive</div>
      <div className="bg-card border border-border rounded-[12px] p-[11px_14px] flex items-center gap-[9px] mb-2">
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
          onChange={(e) => {
            setSearch(e.target.value)
            setSelected(null)
          }}
          placeholder="Search your exercises..."
          className="bg-transparent text-[13px] text-text placeholder-muted outline-none flex-1 font-medium"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-muted text-sm">
            ✕
          </button>
        )}
      </div>

      {search && filtered.length > 0 && (
        <div className="bg-card border border-border rounded-[12px] mb-3 overflow-hidden">
          {filtered.slice(0, 6).map((name) => (
            <button
              key={name}
              onClick={() => {
                setSelected(name)
                setSearch('')
              }}
              className="w-full px-4 py-3 text-left text-[13px] font-semibold text-text border-b border-border last:border-0 hover:bg-card-alt"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          <div className="bg-card border border-border rounded-[14px] p-4 mb-2">
            <div className="flex justify-between items-baseline mb-3">
              <div className="text-[13px] font-bold text-text">{selected} · est. max</div>
              {allTimePR && (
                <div className="text-[11px] font-bold text-success">
                  PR {allTimePR} {unitWeight}
                </div>
              )}
            </div>
            {e1rmHistory.length > 1 ? (
              <>
                <div className="flex items-end gap-1 h-[80px]">
                  {e1rmHistory.map((p, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[3px] min-w-0"
                      style={{
                        height: `${Math.round((p.e1rm / chartMax) * 100)}%`,
                        background:
                          i === e1rmHistory.length - 1
                            ? '#7B7BFF'
                            : `rgba(123,123,255,${0.25 + (i / e1rmHistory.length) * 0.6})`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px] text-muted font-semibold">
                    {e1rmHistory[0]?.date.toLocaleDateString('en-GB', { month: 'short' })}
                  </span>
                  <span className="text-[8px] text-muted font-semibold">
                    {e1rmHistory[e1rmHistory.length - 1]?.date.toLocaleDateString('en-GB', {
                      month: 'short',
                      year: '2-digit',
                    })}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted italic">Not enough data for this period</div>
            )}
          </div>

          <div className="flex gap-[3px] bg-[rgba(255,255,255,0.03)] border border-border rounded-[10px] p-[3px] mb-3">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-[6px] rounded-[7px] text-[10px] font-bold text-center ${
                  period === p ? 'bg-[rgba(123,123,255,0.15)] text-accent' : 'text-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-card border border-border rounded-[14px] p-[13px_12px]">
              <div className="text-[20px] font-extrabold text-text">
                {e1rmHistory.length > 0 ? e1rmHistory[e1rmHistory.length - 1].e1rm : '—'}
                <span className="text-[10px] text-muted ml-0.5">{unitWeight}</span>
              </div>
              <div className="text-[9px] font-bold text-muted uppercase tracking-[0.5px] mt-1">
                Est. max now
              </div>
            </div>
            <div className="bg-card border border-border rounded-[14px] p-[13px_12px]">
              <div className="text-[20px] font-extrabold text-text">
                {allTimePR ?? '—'}
                <span className="text-[10px] text-muted ml-0.5">{unitWeight}</span>
              </div>
              <div className="text-[9px] font-bold text-muted uppercase tracking-[0.5px] mt-1">
                All-time PR
              </div>
            </div>
          </div>

          {lastSession && (
            <div className="bg-card border border-border rounded-[14px] p-[13px_14px] mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[13px] font-bold text-text">Last session</div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {lastSession.date} · {lastSession.sets.length} sets
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-extrabold text-text">
                    {lastSession.sets[0].kg} {unitWeight} × {lastSession.sets[0].reps}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

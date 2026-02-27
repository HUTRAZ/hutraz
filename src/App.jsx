import { useState, useEffect, useRef } from 'react'
import ExerciseCard from './ExerciseCard'

const REST_PRESETS = [0, 30, 60, 90, 120, 180]

const EXERCISE_TYPES = [
  { id: 'weight_reps', label: 'Weight + Reps', desc: 'Bench, squat, rows...' },
  { id: 'bw_reps', label: 'Bodyweight ± kg', desc: 'Dips, pullups, chin-ups...' },
  { id: 'reps_only', label: 'Reps only', desc: 'Pushups, situps...' },
  { id: 'time_only', label: 'Time only', desc: 'Plank, dead hang...' },
  { id: 'distance_time', label: 'Distance + Time', desc: 'Running, rowing, cycling...' },
]

function TypeIcon({ type, size = 'w-4 h-4' }) {
  switch (type) {
    case 'weight_reps':
      return <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`${size} stroke-[#7B7BFF]`}><path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M4 8v8M20 8v8M2 10v4M22 10v4"/></svg>
    case 'bw_reps':
      return <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${size} stroke-[#7B7BFF]`}><circle cx="12" cy="5" r="2.5"/><path d="M12 7.5v5M9 20l1.5-7.5h3L15 20"/><path d="M8 12h8"/></svg>
    case 'reps_only':
      return <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`${size} stroke-[#7B7BFF]`}><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    case 'time_only':
      return <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`${size} stroke-[#7B7BFF]`}><circle cx="12" cy="13" r="9"/><polyline points="12 9 12 13 15 14.5"/><path d="M12 4V2M8.5 4.5L7.5 3M15.5 4.5l1-1.5"/></svg>
    case 'distance_time':
      return <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${size} stroke-[#7B7BFF]`}><path d="M3 19h18"/><path d="M5 19c0-3 2-5 4-7l3-5 3 5c2 2 4 4 4 7"/></svg>
    default: return null
  }
}

function PlayIcon({ className = 'w-3.5 h-3.5' }) {
  return <svg viewBox="0 0 24 24" className={`${className} fill-current`}><polygon points="5 3 19 12 5 21 5 3"/></svg>
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length !== 3) return dateStr
  const d = new Date(parts[2], parts[1] - 1, parts[0])
  const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0)
  const diff = Math.floor((now - d) / (1000*60*60*24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  if (diff < 14) return '1 week ago'
  if (diff < 30) return `${Math.floor(diff/7)} weeks ago`
  return dateStr
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [page, setPage] = useState('workout')
  const [workoutActive, setWorkoutActive] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [workoutElapsed, setWorkoutElapsed] = useState(0)
  const [exercises, setExercises] = useState(() => { const s = localStorage.getItem('exercises'); return s ? JSON.parse(s) : [] })
  const [history, setHistory] = useState(() => { const s = localStorage.getItem('history'); return s ? JSON.parse(s) : [] })
  const [folders, setFolders] = useState(() => {
    const s = localStorage.getItem('folders')
    if (s) return JSON.parse(s)
    const old = localStorage.getItem('templates')
    if (old) { const t = JSON.parse(old); if (t.length > 0) return [{ name: 'My Templates', open: true, templates: t }] }
    return [{ name: 'My Templates', open: true, templates: [] }]
  })
  const [defaultRest, setDefaultRest] = useState(() => { const s = localStorage.getItem('defaultRest'); return s ? Number(s) : 90 })
  const [bodyweight, setBodyweight] = useState(() => { const s = localStorage.getItem('bodyweight'); return s ? Number(s) : 80 })
  const [name, setName] = useState('')
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [activeRest, setActiveRest] = useState(null)
  const [restTime, setRestTime] = useState(0)
  const [restDuration, setRestDuration] = useState(90)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [deletingFolder, setDeletingFolder] = useState(null)
  const [deletingTemplate, setDeletingTemplate] = useState(null) // { fi, ti }
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showEmptyNameModal, setShowEmptyNameModal] = useState(false)
  const [emptyWorkoutName, setEmptyWorkoutName] = useState('')
  const [pendingStart, setPendingStart] = useState(null)
  const restStartRef = useRef(null)

  useEffect(() => { const t = setTimeout(() => setShowSplash(false), 1500); return () => clearTimeout(t) }, [])
  useEffect(() => { localStorage.setItem('exercises', JSON.stringify(exercises)) }, [exercises])
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)) }, [history])
  useEffect(() => { localStorage.setItem('folders', JSON.stringify(folders)) }, [folders])
  useEffect(() => { localStorage.setItem('defaultRest', String(defaultRest)) }, [defaultRest])
  useEffect(() => { localStorage.setItem('bodyweight', String(bodyweight)) }, [bodyweight])

  // Restore active workout
  useEffect(() => {
    if (exercises.length > 0) {
      const savedName = localStorage.getItem('workoutName')
      const savedStart = localStorage.getItem('workoutStartTime')
      setWorkoutActive(true)
      setWorkoutName(savedName || '')
      if (savedStart) setWorkoutStartTime(Number(savedStart))
      else { const now = Date.now(); setWorkoutStartTime(now); localStorage.setItem('workoutStartTime', String(now)) }
    }
  }, [])

  useEffect(() => { localStorage.setItem('workoutName', workoutName) }, [workoutName])
  useEffect(() => { if (workoutStartTime) localStorage.setItem('workoutStartTime', String(workoutStartTime)) }, [workoutStartTime])

  // Workout timer
  useEffect(() => {
    if (!workoutActive || !workoutStartTime) return
    const tick = () => setWorkoutElapsed(Math.floor((Date.now() - workoutStartTime) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [workoutActive, workoutStartTime])

  // Rest timer
  useEffect(() => {
    if (!activeRest) return
    if (restTime <= 0) { completeRest(); return }
    const timer = setTimeout(() => setRestTime(restTime - 1), 1000)
    return () => clearTimeout(timer)
  }, [activeRest, restTime])

  function completeRest() {
    if (!activeRest) return
    const { exIndex, setIndex } = activeRest
    const elapsed = Math.floor((Date.now() - restStartRef.current) / 1000)
    const n = [...exercises]; n[exIndex].sets[setIndex].restTime = elapsed
    setExercises(n); setActiveRest(null); setRestTime(0); restStartRef.current = null
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  }

  function skipRest() { completeRest() }

  function tryStart(type, data) {
    if (workoutActive && exercises.length > 0) { setPendingStart({ type, data }); return }
    executeStart(type, data)
  }

  function executeStart(type, data) {
    const now = Date.now()
    if (type === 'template') {
      setWorkoutName(data.name)
      setExercises(data.exercises.map(ex => ({ name: ex.name, type: ex.type || 'weight_reps', sets: ex.sets.map(s => ({ ...s, done: false })), restOverride: ex.restOverride !== undefined ? ex.restOverride : null, note: ex.note || '' })))
    } else if (type === 'last') {
      setWorkoutName(data.name || data.date)
      setExercises(data.exercises.map(ex => ({ name: ex.name, type: ex.type || 'weight_reps', sets: ex.sets.map(s => ({ ...s, done: false })), restOverride: ex.restOverride !== undefined ? ex.restOverride : null, note: ex.note || '' })))
    } else if (type === 'empty') {
      setWorkoutName(data.name)
      setExercises([])
    }
    setWorkoutActive(true); setWorkoutStartTime(now); setWorkoutElapsed(0)
    setActiveRest(null); setRestTime(0); setPendingStart(null)
  }

  function confirmDiscardAndStart() { if (!pendingStart) return; setExercises([]); setActiveRest(null); setRestTime(0); executeStart(pendingStart.type, pendingStart.data) }

  function startEmpty() { setEmptyWorkoutName(''); setShowEmptyNameModal(true) }
  function confirmEmptyStart() { if (!emptyWorkoutName) return; setShowEmptyNameModal(false); tryStart('empty', { name: emptyWorkoutName }) }

  function getSuggestedNext() {
    if (history.length === 0) return null
    const last = history[0]; const ltn = last.templateName
    if (!ltn) return null
    for (let fi = 0; fi < folders.length; fi++) {
      const folder = folders[fi]
      for (let ti = 0; ti < folder.templates.length; ti++) {
        if (folder.templates[ti].name === ltn) {
          const next = (ti + 1) % folder.templates.length
          return { template: folder.templates[next], folderName: folder.name }
        }
      }
    }
    return null
  }

  function addExercise() { if (name === '') return; setShowTypePicker(true) }
  function confirmAddExercise(type) { setExercises([...exercises, { name, type, sets: [], restOverride: null, note: '' }]); setName(''); setShowTypePicker(false) }
  function updateExerciseRest(exIndex, value) { const n = [...exercises]; n[exIndex].restOverride = value === '' ? null : Number(value); setExercises(n) }
  function updateExerciseNote(exIndex, value) { const n = [...exercises]; n[exIndex].note = value; setExercises(n) }

  function emptySetForType(type) {
    switch (type) {
      case 'weight_reps': return { kg: '', reps: '', done: false }
      case 'bw_reps': return { kg: '', reps: '', done: false }
      case 'reps_only': return { reps: '', done: false }
      case 'time_only': return { time: '', done: false }
      case 'distance_time': return { distance: '', time: '', done: false }
      default: return { kg: '', reps: '', done: false }
    }
  }

  function copySet(set, type) {
    switch (type) {
      case 'weight_reps': return { kg: set.kg, reps: set.reps, done: false }
      case 'bw_reps': return { kg: set.kg, reps: set.reps, done: false }
      case 'reps_only': return { reps: set.reps, done: false }
      case 'time_only': return { time: set.time, done: false }
      case 'distance_time': return { distance: set.distance, time: set.time, done: false }
      default: return { kg: set.kg, reps: set.reps, done: false }
    }
  }

  function isSetComplete(set, type) {
    switch (type) {
      case 'weight_reps': return set.kg !== '' && set.reps !== ''
      case 'bw_reps': return set.reps !== ''
      case 'reps_only': return set.reps !== ''
      case 'time_only': return set.time !== ''
      case 'distance_time': return set.distance !== '' || set.time !== ''
      default: return false
    }
  }

  function addSet(index) {
    const n = [...exercises]; const ex = n[index]; const sets = ex.sets
    const lastSet = sets[sets.length - 1]
    sets.push(lastSet ? copySet(lastSet, ex.type || 'weight_reps') : emptySetForType(ex.type || 'weight_reps'))
    setExercises(n)
    setTimeout(() => {
      const type = ex.type || 'weight_reps'
      let field = 'kg'
      if (type === 'reps_only') field = 'reps'
      else if (type === 'time_only') field = 'time'
      else if (type === 'distance_time') field = 'distance'
      const input = document.querySelector(`[data-ex="${index}"][data-set="${sets.length - 1}"][data-field="${field}"]`)
      if (input) input.focus()
    }, 50)
  }

  function deleteSet(exIndex, setIndex) {
    const n = [...exercises]; n[exIndex].sets.splice(setIndex, 1)
    if (n[exIndex].sets.length === 0) n.splice(exIndex, 1)
    setExercises(n)
  }

  function updateSet(exIndex, setIndex, field, value) { const n = [...exercises]; n[exIndex].sets[setIndex][field] = value; setExercises(n) }

  function doneSet(exIndex, setIndex) {
    const n = [...exercises]; const ex = n[exIndex]; const set = ex.sets[setIndex]
    if (!isSetComplete(set, ex.type || 'weight_reps')) return
    set.done = true; setExercises(n)
    if (activeRest) completeRest()
    const dur = ex.restOverride !== null && ex.restOverride !== undefined ? ex.restOverride : defaultRest
    if (dur === 0) return
    restStartRef.current = Date.now()
    setActiveRest({ exIndex, setIndex }); setRestTime(dur); setRestDuration(dur)
  }

  function moveExerciseUp(i) { if (i === 0) return; const n = [...exercises]; [n[i-1], n[i]] = [n[i], n[i-1]]; setExercises(n) }
  function moveExerciseDown(i) { if (i >= exercises.length-1) return; const n = [...exercises]; [n[i+1], n[i]] = [n[i], n[i+1]]; setExercises(n) }
  function removeExercise(i) { const n = [...exercises]; n.splice(i, 1); setExercises(n) }

  function getPreviousSets(exerciseName) {
    for (const w of history) for (const ex of w.exercises) if (ex.name === exerciseName) return ex.sets
    return null
  }

  function finishWorkout() { if (exercises.length === 0) return; setShowFinishModal(true) }

  function confirmFinish(updateAll) {
    let templateName = null
    for (const f of folders) for (const t of f.templates) if (t.name === workoutName) { templateName = workoutName; break }

    const duration = Math.floor((Date.now() - workoutStartTime) / 1000)
    const workout = { date: new Date().toLocaleDateString('en-GB'), name: workoutName, templateName, duration, exercises }
    setHistory([workout, ...history])

    if (updateAll) {
      const nf = [...folders]
      for (const ex of exercises) for (const f of nf) for (const t of f.templates) {
        for (let i = 0; i < t.exercises.length; i++) {
          if (t.exercises[i].name === ex.name) {
            t.exercises[i].sets = ex.sets.map(s => { const c = { ...s }; delete c.done; delete c.restTime; return c })
            t.exercises[i].note = ex.note || ''
          }
        }
      }
      setFolders(nf)
    }
    setExercises([]); setActiveRest(null); setRestTime(0); setShowFinishModal(false)
    setWorkoutActive(false); setWorkoutName(''); setWorkoutStartTime(null); setWorkoutElapsed(0)
    localStorage.removeItem('workoutStartTime')
  }

  function cancelWorkout() {
    setExercises([]); setActiveRest(null); setRestTime(0)
    setWorkoutActive(false); setWorkoutName(''); setWorkoutStartTime(null); setWorkoutElapsed(0)
    localStorage.removeItem('workoutStartTime')
  }

  function saveTemplate() { if (exercises.length === 0) return; setShowSaveModal(true) }

  function confirmSaveTemplate(folderIndex, templateName) {
    const template = {
      name: templateName,
      exercises: exercises.map(ex => ({
        name: ex.name, type: ex.type || 'weight_reps',
        sets: ex.sets.map(s => { const c = { ...s }; delete c.done; delete c.restTime; return c }),
        restOverride: ex.restOverride, note: ex.note || ''
      }))
    }
    const nf = [...folders]; nf[folderIndex].templates.push(template); setFolders(nf); setShowSaveModal(false)
  }

  function editTemplate(fi, ti) {
    const t = folders[fi].templates[ti]
    setExercises(t.exercises.map(ex => ({ name: ex.name, type: ex.type || 'weight_reps', sets: ex.sets.map(s => ({ ...s, done: false })), restOverride: ex.restOverride !== undefined ? ex.restOverride : null, note: ex.note || '' })))
    setEditingTemplate({ folderIndex: fi, templateIndex: ti })
    setWorkoutActive(true); setWorkoutName(t.name)
  }

  function saveEditedTemplate() {
    if (!editingTemplate) return
    const { folderIndex, templateIndex } = editingTemplate
    const nf = [...folders]; const oldName = nf[folderIndex].templates[templateIndex].name
    nf[folderIndex].templates[templateIndex] = {
      name: oldName,
      exercises: exercises.map(ex => ({
        name: ex.name, type: ex.type || 'weight_reps',
        sets: ex.sets.map(s => { const c = { ...s }; delete c.done; delete c.restTime; return c }),
        restOverride: ex.restOverride, note: ex.note || ''
      }))
    }
    setFolders(nf); setExercises([]); setEditingTemplate(null); setWorkoutActive(false); setWorkoutName('')
  }

  function cancelEditTemplate() { setExercises([]); setEditingTemplate(null); setWorkoutActive(false); setWorkoutName('') }

  function requestDeleteTemplate(fi, ti) { setDeletingTemplate({ fi, ti }) }
  function confirmDeleteTemplate() {
    if (!deletingTemplate) return
    const nf = [...folders]; nf[deletingTemplate.fi].templates.splice(deletingTemplate.ti, 1); setFolders(nf); setDeletingTemplate(null)
  }

  function addFolder() { const nf = [...folders, { name: 'New Folder', open: true, templates: [] }]; setFolders(nf); setEditingFolder(nf.length - 1); setEditingFolderName('New Folder') }
  function toggleFolder(i) { const nf = [...folders]; nf[i].open = !nf[i].open; setFolders(nf) }
  function startEditFolder(i) { setEditingFolder(i); setEditingFolderName(folders[i].name) }
  function confirmEditFolder() { if (editingFolder === null) return; const nf = [...folders]; nf[editingFolder].name = editingFolderName || 'Untitled'; setFolders(nf); setEditingFolder(null) }
  function requestDeleteFolder(i) { setDeletingFolder(i) }
  function confirmDeleteFolder() { if (deletingFolder === null) return; const nf = [...folders]; const r = nf.filter((_, i) => i !== deletingFolder); r[0].templates.push(...nf[deletingFolder].templates); setFolders(r); setDeletingFolder(null) }
  function moveFolderUp(i) { if (i === 0) return; const f = [...folders]; [f[i-1], f[i]] = [f[i], f[i-1]]; setFolders(f) }
  function moveFolderDown(i) { if (i >= folders.length-1) return; const f = [...folders]; [f[i+1], f[i]] = [f[i], f[i+1]]; setFolders(f) }
  function moveTemplateUp(fi, ti) { if (ti === 0) return; const f = [...folders]; [f[fi].templates[ti-1], f[fi].templates[ti]] = [f[fi].templates[ti], f[fi].templates[ti-1]]; setFolders(f) }
  function moveTemplateDown(fi, ti) { if (ti >= folders[fi].templates.length-1) return; const f = [...folders]; [f[fi].templates[ti+1], f[fi].templates[ti]] = [f[fi].templates[ti], f[fi].templates[ti+1]]; setFolders(f) }

  function getBestSet(eName) {
    let best = null
    for (const w of history) for (const ex of w.exercises) if (ex.name === eName) for (const s of ex.sets) {
      const vol = Number(s.kg || 0) * Number(s.reps || 0)
      if (!best || vol > best.volume) best = { kg: s.kg, reps: s.reps, volume: vol }
    }
    return best
  }

  function formatTime(sec) { return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}` }
  function formatDuration(sec) { const m = Math.floor(sec/60); if (m < 60) return `${m} min`; const h = Math.floor(m/60); return `${h}h ${m%60}m` }

  const lastWorkout = history.length > 0 ? history[0] : null
  const suggestedNext = getSuggestedNext()
  const isNew = history.length === 0
  const disabledText = 'Shown when you complete your first workout'

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
                  <div><div className="text-2xl font-bold">{history.length}</div><div className="text-xs text-[#555]">Workouts</div></div>
                  <div><div className="text-2xl font-bold">{history.reduce((sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets.length, 0), 0)}</div><div className="text-xs text-[#555]">Sets logged</div></div>
                </div>
              </div>
              {history.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-3">Recent workouts</h3>
                  {history.slice(0, 10).map((w, i) => (
                    <div key={i} className="bg-[#13132A] border border-[#232340] rounded-xl p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">{w.name || w.date}</span>
                        <span className="text-xs text-[#555]">{relativeTime(w.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-2 text-[10px] text-[#555]">
                        {w.duration && <span>{formatDuration(w.duration)}</span>}
                        <span>{w.exercises.reduce((s, ex) => s + ex.sets.length, 0)} sets</span>
                      </div>
                      {w.exercises.map((ex, j) => <div key={j} className="text-xs text-[#666] ml-1">{ex.name} — {ex.sets.length} sets</div>)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-12 h-12 stroke-[#2A2A4A] mx-auto mb-4"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  <div className="text-[#555] text-sm">No workouts yet</div>
                </div>
              )}
            </div>
          )}

          {/* WORKOUT — START SCREEN */}
          {page === 'workout' && !workoutActive && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">HUTRAZ</h1>
              <p className="text-xs text-[#7B7BFF] mb-6">Simple tracking. Real progress.</p>

              {/* LAST */}
              <div className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">
                Last workout {lastWorkout ? `· ${relativeTime(lastWorkout.date)}` : ''}
              </div>
              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-4 mb-4">
                {lastWorkout ? (<>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[15px] font-bold">{lastWorkout.name || lastWorkout.date}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-[#7B7BFF]/10 text-[#7B7BFF]">Last</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {lastWorkout.exercises.map((ex, i) => <span key={i} className="bg-[#1C1C38] rounded-md px-2 py-0.5 text-[10px] text-[#888]">{ex.name}</span>)}
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-[10px] text-[#555]">
                    {lastWorkout.duration && <span>{formatDuration(lastWorkout.duration)}</span>}
                    <span>{lastWorkout.exercises.reduce((s, ex) => s + ex.sets.length, 0)} sets</span>
                    <span>{lastWorkout.exercises.length} exercises</span>
                  </div>
                  <button onClick={() => tryStart('last', lastWorkout)} className="flex items-center justify-center gap-2 w-full py-2 mt-2 border-[1.5px] border-[#7B7BFF] rounded-xl text-xs font-bold text-[#7B7BFF] hover:bg-[#7B7BFF]/8 transition-colors">
                    <PlayIcon className="w-3 h-3" /> Start
                  </button>
                </>) : <div className="text-xs text-[#444] italic py-2">{disabledText}</div>}
              </div>

              {/* SUGGESTED */}
              <div className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">Suggested next</div>
              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-4 mb-4">
                {suggestedNext ? (<>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[15px] font-bold">{suggestedNext.template.name}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-[#5BF5A0]/10 text-[#5BF5A0]">Up next</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {suggestedNext.template.exercises.map((ex, i) => <span key={i} className="bg-[#1C1C38] rounded-md px-2 py-0.5 text-[10px] text-[#888]">{ex.name}</span>)}
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-[10px] text-[#555]">
                    <span>{suggestedNext.template.exercises.reduce((s, ex) => s + ex.sets.length, 0)} sets</span>
                    <span>{suggestedNext.folderName}</span>
                  </div>
                  <button onClick={() => tryStart('template', suggestedNext.template)} className="flex items-center justify-center gap-2 w-full py-2 mt-2 border-[1.5px] border-[#7B7BFF] rounded-xl text-xs font-bold text-[#7B7BFF] hover:bg-[#7B7BFF]/8 transition-colors">
                    <PlayIcon className="w-3 h-3" /> Start
                  </button>
                </>) : <div className="text-xs text-[#444] italic py-2">{isNew ? disabledText : 'Use templates to get suggestions'}</div>}
              </div>

              {/* EMPTY */}
              <div className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">Start fresh</div>
              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[15px] font-bold">Empty workout</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-white/5 text-[#888]">New</span>
                </div>
                <div className="text-[11px] text-[#666] mb-3">Start fresh and add exercises as you go</div>
                <button onClick={startEmpty} className="flex items-center justify-center gap-2 w-full py-2 border-[1.5px] border-[#7B7BFF] rounded-xl text-xs font-bold text-[#7B7BFF] hover:bg-[#7B7BFF]/8 transition-colors">
                  <PlayIcon className="w-3 h-3" /> Start
                </button>
              </div>

              {/* TEMPLATES */}
              <div className="border-t border-[#1a1a30] pt-6 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide">Templates</h3>
                  <button onClick={addFolder} className="text-[10px] font-semibold text-[#555] border border-[#2A2A4A] px-3 py-1.5 rounded-lg hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors">+ Folder</button>
                </div>
                <div className="text-[10px] text-[#444] mb-4">Tap folder to open/close · Use <span className="inline-flex flex-col align-middle mx-0.5"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5 stroke-[#555]"><polyline points="18 15 12 9 6 15"/></svg><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5 stroke-[#555]"><polyline points="6 9 12 15 18 9"/></svg></span> to reorder</div>

                {folders.map((folder, fi) => (
                  <div key={fi} className="mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex flex-col">
                        <button onClick={() => moveFolderUp(fi)} className={`text-[#444] p-0.5 ${fi === 0 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`} disabled={fi === 0}><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3 stroke-current"><polyline points="18 15 12 9 6 15"/></svg></button>
                        <button onClick={() => moveFolderDown(fi)} className={`text-[#444] p-0.5 ${fi >= folders.length-1 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`} disabled={fi >= folders.length-1}><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3 stroke-current"><polyline points="6 9 12 15 18 9"/></svg></button>
                      </div>
                      <button onClick={() => toggleFolder(fi)} className="flex items-center gap-2 flex-1 min-w-0">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 shrink-0 transition-colors ${folder.open ? 'stroke-[#7B7BFF] fill-[#7B7BFF]/10' : 'stroke-[#555]'}`}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        {editingFolder === fi ? <input type="text" value={editingFolderName} onChange={(e) => setEditingFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmEditFolder()} onBlur={confirmEditFolder} autoFocus onClick={(e) => e.stopPropagation()} className="bg-[#1C1C38] border border-[#7B7BFF] rounded-lg px-2 py-1 text-sm font-semibold text-white outline-none flex-1 min-w-0" /> : <span className="text-sm font-semibold truncate">{folder.name}</span>}
                        <span className="text-[10px] text-[#555] shrink-0">{folder.templates.length}</span>
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-3.5 h-3.5 stroke-[#444] shrink-0 transition-transform ${folder.open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {editingFolder !== fi && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEditFolder(fi)} className="text-[#444] p-1 hover:text-[#7B7BFF] transition-colors"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-current"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                          {folders.length > 1 && <button onClick={() => requestDeleteFolder(fi)} className="text-[#444] p-1 hover:text-red-400 transition-colors"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 stroke-current"><path d="M18 6L6 18M6 6l12 12"/></svg></button>}
                        </div>
                      )}
                    </div>
                    {folder.open && (
                      <div className="ml-7 border-l border-[#1a1a30] pl-3">
                        {folder.templates.length === 0 ? (
                          <div className="text-[10px] text-[#444] py-3 italic">No templates</div>
                        ) : folder.templates.map((t, ti) => (
                          <div key={ti} className="bg-[#13132A] border border-[#232340] rounded-xl p-3.5 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col shrink-0">
                                <button onClick={() => moveTemplateUp(fi, ti)} className={`text-[#444] p-0.5 ${ti === 0 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`} disabled={ti === 0}><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5 stroke-current"><polyline points="18 15 12 9 6 15"/></svg></button>
                                <button onClick={() => moveTemplateDown(fi, ti)} className={`text-[#444] p-0.5 ${ti >= folder.templates.length-1 ? 'opacity-20' : 'hover:text-[#7B7BFF]'}`} disabled={ti >= folder.templates.length-1}><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5 stroke-current"><polyline points="6 9 12 15 18 9"/></svg></button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1.5"><span className="font-bold text-sm truncate">{t.name}</span><span className="text-[10px] text-[#555] shrink-0 ml-2">{t.exercises.length} ex</span></div>
                                {t.exercises.map((ex, j) => <div key={j} className="flex items-center gap-1.5 ml-0.5 mb-0.5"><TypeIcon type={ex.type || 'weight_reps'} size="w-3 h-3" /><span className="text-[10px] text-[#666]">{ex.name} — {ex.sets.length} sets</span></div>)}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2.5">
                              <button onClick={() => tryStart('template', t)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border-[1.5px] border-[#7B7BFF] rounded-lg text-xs font-bold text-[#7B7BFF] hover:bg-[#7B7BFF]/8 transition-colors"><PlayIcon className="w-2.5 h-2.5" />Start</button>
                              <button onClick={() => editTemplate(fi, ti)} className="py-2 px-3 border border-[#2A2A4A] rounded-lg text-[10px] font-semibold text-[#888] hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors">Edit</button>
                              <button onClick={() => requestDeleteTemplate(fi, ti)} className="py-2 px-3 border border-[#2A2A4A] rounded-lg text-[10px] font-semibold text-[#555] hover:border-red-500/50 hover:text-red-400 transition-colors">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE WORKOUT */}
          {page === 'workout' && workoutActive && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-bold tracking-tight">{workoutName || 'Workout'}</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[#5BF5A0] text-sm font-bold tabular-nums">
                    <div className="w-2 h-2 bg-[#5BF5A0] rounded-full animate-pulse" />
                    {formatTime(workoutElapsed)}
                  </div>
                  <button onClick={cancelWorkout} className="text-[10px] font-semibold text-[#555] border border-[#2A2A4A] px-3 py-1.5 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors">Cancel</button>
                </div>
              </div>
              <p className="text-xs text-[#7B7BFF] mb-6">Simple tracking. Real progress.</p>

              {editingTemplate && (
                <div className="bg-[#7B7BFF]/10 border border-[#7B7BFF]/30 rounded-xl p-3 mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#7B7BFF]">Editing template</div>
                    <div className="text-[10px] text-[#888]">{folders[editingTemplate.folderIndex]?.templates[editingTemplate.templateIndex]?.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEditedTemplate} className="px-3 py-1.5 bg-[#7B7BFF] rounded-lg text-xs font-bold">Save</button>
                    <button onClick={cancelEditTemplate} className="px-3 py-1.5 border border-[#2A2A4A] rounded-lg text-xs font-semibold text-[#888]">Cancel</button>
                  </div>
                </div>
              )}

              {exercises.map((ex, i) => (
                <ExerciseCard key={i} exercise={ex} exIndex={i}
                  isEditing={!!editingTemplate} exerciseCount={exercises.length}
                  onMoveUp={moveExerciseUp} onMoveDown={moveExerciseDown} onRemoveExercise={removeExercise}
                  onAddSet={addSet} onUpdateSet={updateSet} onDoneSet={doneSet} onDeleteSet={deleteSet}
                  onUpdateExerciseRest={updateExerciseRest} onUpdateExerciseNote={updateExerciseNote}
                  bestSet={getBestSet(ex.name)} previousSets={getPreviousSets(ex.name)}
                  activeRest={activeRest} restTime={restTime} restDuration={restDuration} defaultRest={defaultRest} onSkipRest={skipRest}
                  bodyweight={bodyweight} TypeIcon={TypeIcon} />
              ))}

              <div className="flex gap-2 mb-6">
                <input type="text" placeholder="Exercise name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                  className="flex-1 bg-[#1C1C38] border border-dashed border-[#5BF5A0]/30 rounded-xl px-4 py-3 text-white placeholder-[#3a3a55] outline-none focus:border-[#5BF5A0] transition-colors" />
                <button onClick={addExercise} className="border border-dashed border-[#5BF5A0]/30 text-[#5BF5A0] rounded-xl px-5 py-3 font-bold text-sm hover:bg-[#5BF5A0]/8 hover:border-[#5BF5A0] transition-colors">+ Add</button>
              </div>

              {exercises.length > 0 && !editingTemplate && (
                <div className="flex flex-col gap-3 mt-4 mb-8">
                  <button onClick={finishWorkout} className="w-full py-4 bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] rounded-2xl font-bold text-base shadow-lg shadow-[#7B7BFF]/25 hover:translate-y-[-1px] active:translate-y-[1px] transition-transform">Finish workout</button>
                  <button onClick={saveTemplate} className="w-full py-3 border border-dashed border-[#2A2A4A] rounded-2xl text-[#555] text-sm font-semibold hover:border-[#7B7BFF] hover:text-[#7B7BFF] transition-colors">Save as template</button>
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
                <div className="mb-5">
                  <div className="text-sm font-semibold mb-1">Bodyweight</div>
                  <div className="text-xs text-[#555] mb-3">Used for volume calculation on bodyweight exercises</div>
                  <div className="flex items-center gap-3">
                    <input type="number" inputMode="decimal" value={bodyweight} onChange={(e) => setBodyweight(Number(e.target.value))} className="w-24 bg-[#1C1C38] border border-[#2A2A4A] rounded-xl px-3 py-2 text-center text-sm font-bold text-white outline-none focus:border-[#7B7BFF] transition-colors" />
                    <span className="text-sm text-[#555]">kg</span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-sm font-semibold mb-1">Rest timer</div>
                  <div className="text-xs text-[#555] mb-3">Default rest duration between sets</div>
                  <div className="flex gap-2 flex-wrap">
                    {REST_PRESETS.map(s => <button key={s} onClick={() => setDefaultRest(s)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${defaultRest === s ? 'bg-[#7B7BFF] text-white' : 'bg-[#1C1C38] border border-[#2A2A4A] text-[#888] hover:border-[#7B7BFF]'}`}>{s === 0 ? 'None' : formatTime(s)}</button>)}
                  </div>
                  <div className="text-xs text-[#444] mt-3">Current: {defaultRest === 0 ? 'None' : formatTime(defaultRest)}</div>
                </div>
              </div>
              <div className="bg-[#13132A] border border-[#232340] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-[#7B7BFF] uppercase tracking-wide mb-4">About</h3>
                <div className="text-xs text-[#555]"><div className="mb-1">HUTRAZ v1.0</div><div>Simple tracking. Real progress.</div></div>
              </div>
            </div>
          )}
        </div>

        {/* TYPE PICKER */}
        {showTypePicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50">
            <div className="w-full max-w-md bg-[#13132A] rounded-t-3xl p-6 pb-10">
              <h2 className="text-lg font-bold text-center mb-1">Add "{name}"</h2>
              <p className="text-xs text-[#555] text-center mb-5">Choose exercise type</p>
              <div className="flex flex-col gap-2">
                {EXERCISE_TYPES.map(t => (
                  <button key={t.id} onClick={() => confirmAddExercise(t.id)} className="flex items-center gap-3 px-4 py-3.5 bg-[#1C1C38] border border-[#2A2A4A] rounded-xl text-left hover:border-[#7B7BFF] transition-colors">
                    <TypeIcon type={t.id} size="w-5 h-5" /><div><div className="text-sm font-semibold">{t.label}</div><div className="text-[10px] text-[#555]">{t.desc}</div></div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowTypePicker(false)} className="w-full py-3 mt-4 text-sm font-semibold text-[#555]">Cancel</button>
            </div>
          </div>
        )}

        {/* EMPTY NAME MODAL */}
        {showEmptyNameModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50">
            <div className="w-full max-w-md bg-[#13132A] rounded-t-3xl p-6 pb-10">
              <h2 className="text-lg font-bold text-center mb-5">Name your workout</h2>
              <input type="text" placeholder="e.g. Push Day, Upper Body..." value={emptyWorkoutName} onChange={(e) => setEmptyWorkoutName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmEmptyStart()} autoFocus className="w-full bg-[#1C1C38] border border-[#2A2A4A] rounded-xl px-4 py-3 text-white placeholder-[#3a3a55] outline-none focus:border-[#7B7BFF] transition-colors mb-4" />
              <button onClick={confirmEmptyStart} className={`w-full py-4 rounded-2xl font-bold text-sm mb-3 transition-all ${emptyWorkoutName ? 'bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] shadow-lg shadow-[#7B7BFF]/25' : 'bg-[#1C1C38] text-[#555]'}`} disabled={!emptyWorkoutName}>Start workout</button>
              <button onClick={() => setShowEmptyNameModal(false)} className="w-full py-3 text-sm font-semibold text-[#555]">Cancel</button>
            </div>
          </div>
        )}

        {/* FINISH MODAL */}
        {showFinishModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50">
            <div className="w-full max-w-md bg-[#13132A] rounded-t-3xl p-6 pb-10">
              <h2 className="text-lg font-bold text-center mb-2">Finish workout</h2>
              <p className="text-xs text-[#555] text-center mb-6">Update templates with today's values?</p>
              <button onClick={() => confirmFinish(true)} className="w-full py-4 bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] rounded-2xl font-bold text-sm mb-3 shadow-lg shadow-[#7B7BFF]/25">Save & update all templates</button>
              <button onClick={() => confirmFinish(false)} className="w-full py-3 border border-[#2A2A4A] rounded-2xl text-sm font-semibold text-[#888] mb-3">Save without updating templates</button>
              <button onClick={() => setShowFinishModal(false)} className="w-full py-3 text-sm font-semibold text-[#555]">Cancel</button>
            </div>
          </div>
        )}

        {/* ACTIVE WORKOUT WARNING */}
        {pendingStart && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-6">
            <div className="w-full max-w-sm bg-[#13132A] border border-[#232340] rounded-2xl p-6">
              <div className="flex justify-center mb-4"><div className="w-12 h-12 bg-[#7B7BFF]/10 rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-6 h-6 stroke-[#7B7BFF]"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div>
              <h2 className="text-base font-bold text-center mb-2">Active workout</h2>
              <p className="text-xs text-[#888] text-center mb-5">You have an active workout with <span className="font-bold text-white">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>. Starting a new one will discard it.</p>
              <button onClick={confirmDiscardAndStart} className="w-full py-3 bg-red-500 rounded-xl font-bold text-sm mb-2">Discard & start new</button>
              <button onClick={() => setPendingStart(null)} className="w-full py-3 text-sm font-semibold text-[#555]">Keep current workout</button>
            </div>
          </div>
        )}

        {/* DELETE FOLDER CONFIRM */}
        {deletingFolder !== null && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-6">
            <div className="w-full max-w-sm bg-[#13132A] border border-[#232340] rounded-2xl p-6">
              <div className="flex justify-center mb-4"><div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-6 h-6 stroke-red-400"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div></div>
              <h2 className="text-base font-bold text-center mb-2">Delete "{folders[deletingFolder]?.name}"?</h2>
              <p className="text-xs text-[#888] text-center mb-1">This folder contains <span className="font-bold text-white">{folders[deletingFolder]?.templates.length} template{folders[deletingFolder]?.templates.length !== 1 ? 's' : ''}</span>.</p>
              <p className="text-xs text-[#555] text-center mb-5">Templates will be moved to "{folders.find((_, i) => i !== deletingFolder)?.name}".</p>
              <button onClick={confirmDeleteFolder} className="w-full py-3 bg-red-500 rounded-xl font-bold text-sm mb-2">Delete folder</button>
              <button onClick={() => setDeletingFolder(null)} className="w-full py-3 text-sm font-semibold text-[#555]">Cancel</button>
            </div>
          </div>
        )}

        {/* DELETE TEMPLATE CONFIRM */}
        {deletingTemplate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-6">
            <div className="w-full max-w-sm bg-[#13132A] border border-[#232340] rounded-2xl p-6">
              <div className="flex justify-center mb-4"><div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-6 h-6 stroke-red-400"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div></div>
              <h2 className="text-base font-bold text-center mb-2">Delete template?</h2>
              <p className="text-xs text-[#888] text-center mb-5">"{folders[deletingTemplate.fi]?.templates[deletingTemplate.ti]?.name}" will be permanently deleted.</p>
              <button onClick={confirmDeleteTemplate} className="w-full py-3 bg-red-500 rounded-xl font-bold text-sm mb-2">Delete template</button>
              <button onClick={() => setDeletingTemplate(null)} className="w-full py-3 text-sm font-semibold text-[#555]">Cancel</button>
            </div>
          </div>
        )}

        {/* SAVE TEMPLATE MODAL */}
        {showSaveModal && <SaveTemplateModal folders={folders} onSave={confirmSaveTemplate} onCancel={() => setShowSaveModal(false)} />}

        {/* BOTTOM NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D1A]/95 backdrop-blur-xl border-t border-[#1a1a30] px-6 py-3 pb-8 flex justify-around max-w-md mx-auto">
          <button onClick={() => setPage('progress')} className={`flex flex-col items-center gap-1 ${page === 'progress' ? 'opacity-100' : 'opacity-40'}`}><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'progress' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}><path d="M18 20V10M12 20V4M6 20v-6"/></svg><span className={`text-[10px] font-semibold ${page === 'progress' ? 'text-[#7B7BFF]' : 'text-white'}`}>Progress</span></button>
          <button onClick={() => setPage('workout')} className={`flex flex-col items-center gap-1 ${page === 'workout' ? 'opacity-100' : 'opacity-40'}`}><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'workout' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span className={`text-[10px] font-semibold ${page === 'workout' ? 'text-[#7B7BFF]' : 'text-white'}`}>Workout</span></button>
          <button onClick={() => setPage('profile')} className={`flex flex-col items-center gap-1 ${page === 'profile' ? 'opacity-100' : 'opacity-40'}`}><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className={`w-5 h-5 ${page === 'profile' ? 'stroke-[#7B7BFF]' : 'stroke-white'}`}><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><span className={`text-[10px] font-semibold ${page === 'profile' ? 'text-[#7B7BFF]' : 'text-white'}`}>Profile</span></button>
        </div>
      </div>
    </>
  )
}

function SaveTemplateModal({ folders, onSave, onCancel }) {
  const [templateName, setTemplateName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(0)
  function handleSave() { if (!templateName) return; onSave(selectedFolder, templateName) }
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-[#13132A] rounded-t-3xl p-6 pb-10">
        <h2 className="text-lg font-bold text-center mb-5">Save as template</h2>
        <div className="mb-4">
          <div className="text-xs text-[#555] font-semibold uppercase tracking-wide mb-2">Template name</div>
          <input type="text" placeholder="e.g. Push Day A" value={templateName} onChange={(e) => setTemplateName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus className="w-full bg-[#1C1C38] border border-[#2A2A4A] rounded-xl px-4 py-3 text-white placeholder-[#3a3a55] outline-none focus:border-[#7B7BFF] transition-colors" />
        </div>
        <div className="mb-5">
          <div className="text-xs text-[#555] font-semibold uppercase tracking-wide mb-2">Save to folder</div>
          <div className="flex flex-col gap-1.5">
            {folders.map((f, i) => (
              <button key={i} onClick={() => setSelectedFolder(i)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${selectedFolder === i ? 'bg-[#7B7BFF]/15 border border-[#7B7BFF]/40 text-white' : 'bg-[#1C1C38] border border-[#2A2A4A] text-[#888]'}`}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 shrink-0 ${selectedFolder === i ? 'stroke-[#7B7BFF] fill-[#7B7BFF]/10' : 'stroke-[#555]'}`}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                {f.name}<span className="text-[10px] text-[#555] ml-auto">{f.templates.length}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSave} className={`w-full py-4 rounded-2xl font-bold text-sm mb-3 transition-all ${templateName ? 'bg-gradient-to-r from-[#7B7BFF] to-[#6060DD] shadow-lg shadow-[#7B7BFF]/25' : 'bg-[#1C1C38] text-[#555]'}`} disabled={!templateName}>Save template</button>
        <button onClick={onCancel} className="w-full py-3 text-sm font-semibold text-[#555]">Cancel</button>
      </div>
    </div>
  )
}

export default App

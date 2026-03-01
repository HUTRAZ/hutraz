// Muscle group definitions with colors and SVG icon paths
export const MUSCLE_GROUPS = {
  chest:     { label: 'Chest',     color: '#7B7BFF', bg: 'rgba(123,123,255,0.1)', movement: 'push', body: 'upper', icon: 'chest' },
  back:      { label: 'Back',      color: '#5BF5A0', bg: 'rgba(91,245,160,0.1)',  movement: 'pull', body: 'upper', icon: 'back' },
  legs:      { label: 'Legs',      color: '#FFAA50', bg: 'rgba(255,170,80,0.1)',   movement: null,   body: 'lower', icon: 'legs' },
  shoulders: { label: 'Shoulders', color: '#4ECDC4', bg: 'rgba(78,205,196,0.1)',  movement: 'push', body: 'upper', icon: 'shoulders' },
  arms:      { label: 'Arms',      color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)', movement: null,   body: 'upper', icon: 'arms' },
  core:      { label: 'Core',      color: '#C8A0FF', bg: 'rgba(200,160,255,0.1)', movement: null,   body: 'upper', icon: 'core' },
}

export const EQUIPMENT_TYPES = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Band', 'Other']

// Default exercise library (~45 exercises)
export const DEFAULT_EXERCISES = [
  // CHEST (8)
  { name: 'Bench Press',        muscle: 'chest', equipment: 'Barbell',    type: 'weight_reps', movement: 'push' },
  { name: 'Incline Bench Press', muscle: 'chest', equipment: 'Barbell',   type: 'weight_reps', movement: 'push' },
  { name: 'Decline Bench Press', muscle: 'chest', equipment: 'Barbell',   type: 'weight_reps', movement: 'push' },
  { name: 'Dumbbell Press',     muscle: 'chest', equipment: 'Dumbbell',   type: 'weight_reps', movement: 'push' },
  { name: 'Incline DB Press',   muscle: 'chest', equipment: 'Dumbbell',   type: 'weight_reps', movement: 'push' },
  { name: 'Cable Flyes',        muscle: 'chest', equipment: 'Cable',      type: 'weight_reps', movement: 'push' },
  { name: 'Chest Dip',          muscle: 'chest', equipment: 'Bodyweight', type: 'bw_reps',     movement: 'push' },
  { name: 'Push-ups',           muscle: 'chest', equipment: 'Bodyweight', type: 'reps_only',   movement: 'push' },

  // BACK (7)
  { name: 'Barbell Row',        muscle: 'back', equipment: 'Barbell',    type: 'weight_reps', movement: 'pull' },
  { name: 'Deadlift',           muscle: 'back', equipment: 'Barbell',    type: 'weight_reps', movement: 'pull' },
  { name: 'Pull-ups',           muscle: 'back', equipment: 'Bodyweight', type: 'bw_reps',     movement: 'pull' },
  { name: 'Chin-ups',           muscle: 'back', equipment: 'Bodyweight', type: 'bw_reps',     movement: 'pull' },
  { name: 'Lat Pulldown',       muscle: 'back', equipment: 'Cable',      type: 'weight_reps', movement: 'pull' },
  { name: 'Seated Cable Row',   muscle: 'back', equipment: 'Cable',      type: 'weight_reps', movement: 'pull' },
  { name: 'Dumbbell Row',       muscle: 'back', equipment: 'Dumbbell',   type: 'weight_reps', movement: 'pull' },

  // LEGS (8)
  { name: 'Squat',              muscle: 'legs', equipment: 'Barbell',    type: 'weight_reps', movement: 'push' },
  { name: 'Front Squat',        muscle: 'legs', equipment: 'Barbell',    type: 'weight_reps', movement: 'push' },
  { name: 'Romanian Deadlift',  muscle: 'legs', equipment: 'Barbell',    type: 'weight_reps', movement: 'pull' },
  { name: 'Leg Press',          muscle: 'legs', equipment: 'Machine',    type: 'weight_reps', movement: 'push' },
  { name: 'Leg Curl',           muscle: 'legs', equipment: 'Machine',    type: 'weight_reps', movement: 'pull' },
  { name: 'Leg Extension',      muscle: 'legs', equipment: 'Machine',    type: 'weight_reps', movement: 'push' },
  { name: 'Bulgarian Split Squat', muscle: 'legs', equipment: 'Dumbbell', type: 'weight_reps', movement: 'push' },
  { name: 'Calf Raises',        muscle: 'legs', equipment: 'Machine',    type: 'weight_reps', movement: 'push' },

  // SHOULDERS (6)
  { name: 'Overhead Press',     muscle: 'shoulders', equipment: 'Barbell',  type: 'weight_reps', movement: 'push' },
  { name: 'DB Shoulder Press',  muscle: 'shoulders', equipment: 'Dumbbell', type: 'weight_reps', movement: 'push' },
  { name: 'Lateral Raises',     muscle: 'shoulders', equipment: 'Dumbbell', type: 'weight_reps', movement: 'push' },
  { name: 'Front Raises',       muscle: 'shoulders', equipment: 'Dumbbell', type: 'weight_reps', movement: 'push' },
  { name: 'Face Pulls',         muscle: 'shoulders', equipment: 'Cable',    type: 'weight_reps', movement: 'pull' },
  { name: 'Reverse Flyes',      muscle: 'shoulders', equipment: 'Dumbbell', type: 'weight_reps', movement: 'pull' },

  // ARMS (8)
  { name: 'Barbell Curl',       muscle: 'arms', equipment: 'Barbell',    type: 'weight_reps', movement: 'pull' },
  { name: 'Dumbbell Curl',      muscle: 'arms', equipment: 'Dumbbell',   type: 'weight_reps', movement: 'pull' },
  { name: 'Hammer Curl',        muscle: 'arms', equipment: 'Dumbbell',   type: 'weight_reps', movement: 'pull' },
  { name: 'Cable Curl',         muscle: 'arms', equipment: 'Cable',      type: 'weight_reps', movement: 'pull' },
  { name: 'Tricep Pushdown',    muscle: 'arms', equipment: 'Cable',      type: 'weight_reps', movement: 'push' },
  { name: 'Skull Crushers',     muscle: 'arms', equipment: 'Barbell',    type: 'weight_reps', movement: 'push' },
  { name: 'Overhead Tricep Ext', muscle: 'arms', equipment: 'Cable',     type: 'weight_reps', movement: 'push' },
  { name: 'Dips',               muscle: 'arms', equipment: 'Bodyweight', type: 'bw_reps',     movement: 'push' },

  // CORE (4)
  { name: 'Plank',              muscle: 'core', equipment: 'Bodyweight', type: 'time_only',   movement: null },
  { name: 'Cable Woodchop',     muscle: 'core', equipment: 'Cable',      type: 'weight_reps', movement: null },
  { name: 'Hanging Leg Raise',  muscle: 'core', equipment: 'Bodyweight', type: 'reps_only',   movement: null },
  { name: 'Ab Wheel Rollout',   muscle: 'core', equipment: 'Bodyweight', type: 'reps_only',   movement: null },
]

// Exercise type labels
export const TYPE_LABELS = {
  weight_reps: 'Weight + Reps',
  bw_reps: 'BW ± kg',
  reps_only: 'Reps only',
  time_only: 'Time',
  distance_time: 'Distance + Time',
}

// Get movement label for display
export function getMovementLabel(exercise) {
  if (exercise.movement === 'push') return 'Push'
  if (exercise.movement === 'pull') return 'Pull'
  if (exercise.muscle === 'core') return 'Core'
  return ''
}

// Get body region
export function getBodyRegion(exercise) {
  const mg = MUSCLE_GROUPS[exercise.muscle]
  return mg ? mg.body : 'upper'
}

// Filter exercises by criteria
export function filterExercises(allExercises, { search = '', movement = 'all', muscles = [], equipment = 'all', myOnly = false }) {
  return allExercises.filter(ex => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false
    if (myOnly && !ex.isCustom) return false
    if (movement !== 'all') {
      if (movement === 'push' && ex.movement !== 'push') return false
      if (movement === 'pull' && ex.movement !== 'pull') return false
      if (movement === 'upper' && getBodyRegion(ex) !== 'upper') return false
      if (movement === 'lower' && getBodyRegion(ex) !== 'lower') return false
    }
    if (muscles.length > 0 && !muscles.includes(ex.muscle)) return false
    if (equipment !== 'all' && ex.equipment !== equipment) return false
    return true
  })
}

// Group exercises by muscle
export function groupByMuscle(exercises) {
  const groups = {}
  const order = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']
  for (const m of order) groups[m] = []
  for (const ex of exercises) {
    if (!groups[ex.muscle]) groups[ex.muscle] = []
    groups[ex.muscle].push(ex)
  }
  return Object.entries(groups).filter(([, exs]) => exs.length > 0)
}
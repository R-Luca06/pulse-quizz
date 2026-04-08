let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function unlockAudio() {
  getCtx()
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.18,
) {
  const context = getCtx()
  if (!context) return
  try {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.connect(gain)
    gain.connect(context.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
    osc.start()
    osc.stop(context.currentTime + duration)
  } catch {
    // ignore
  }
}

export function playCorrect() {
  beep(523, 0.1, 'sine', 0.15)
  setTimeout(() => beep(783, 0.18, 'sine', 0.12), 80)
}

export function playWrong() {
  beep(220, 0.18, 'sawtooth', 0.12)
}

export function playTimeout() {
  beep(180, 0.22, 'triangle', 0.1)
}

export function playTick() {
  beep(900, 0.04, 'square', 0.06)
}

// ---------------------------------------------------------------------------
// Ambient background music — Am pentatonic arpeggio
// ---------------------------------------------------------------------------

const AMBIENT_NOTES = [220, 261, 330, 392, 440] // A3 C4 E4 G4 A4
const NOTE_DURATION  = 0.42  // seconds (oscillator lifetime)
const NOTE_INTERVAL  = 520   // ms between note starts
const AMBIENT_VOLUME = 0.06

let ambientGain: GainNode | null = null
let ambientTimer: ReturnType<typeof setTimeout> | null = null
let ambientNoteIndex = 0
let ambientRunning = false

function getAmbientGain(): GainNode | null {
  const context = getCtx()
  if (!context) return null
  if (!ambientGain) {
    ambientGain = context.createGain()
    ambientGain.gain.value = 0
    ambientGain.connect(context.destination)
  }
  return ambientGain
}

function scheduleNote() {
  if (!ambientRunning) return
  const context = getCtx()
  const master = getAmbientGain()
  if (!context || !master) return

  const freq = AMBIENT_NOTES[ambientNoteIndex % AMBIENT_NOTES.length]
  ambientNoteIndex++

  try {
    const osc  = context.createOscillator()
    const gain = context.createGain()
    osc.connect(gain)
    gain.connect(master)
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = context.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(1, t + 0.03)          // attack
    gain.gain.setValueAtTime(1, t + NOTE_DURATION - 0.18)
    gain.gain.linearRampToValueAtTime(0, t + NOTE_DURATION) // release
    osc.start(t)
    osc.stop(t + NOTE_DURATION)
  } catch { /* ignore */ }

  ambientTimer = setTimeout(scheduleNote, NOTE_INTERVAL)
}

export function startAmbient() {
  if (ambientRunning) return
  ambientRunning = true
  const context = getCtx()
  const master  = getAmbientGain()
  if (context && master) {
    const t = context.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(AMBIENT_VOLUME, t + 0.6)
  }
  scheduleNote()
}

export function stopAmbient() {
  ambientRunning = false
  if (ambientTimer) { clearTimeout(ambientTimer); ambientTimer = null }
  const context = getCtx()
  const master  = getAmbientGain()
  if (context && master) {
    const t = context.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(0, t + 0.3)
  }
}

export function setAmbientVolume(vol: number, durationSec = 0.6) {
  const context = getCtx()
  const master  = getAmbientGain()
  if (!context || !master) return
  const t = context.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(vol, t + durationSec)
}

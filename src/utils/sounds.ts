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

// Call once on any user gesture to unlock the shared AudioContext
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

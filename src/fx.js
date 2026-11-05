// Tiny shared state between the DOM UI and the 3D scene (read every frame, no re-renders).
export const fx = {
  energy: 0,     // 0..1 — rises while the user types
  error: 0,      // 1 on a failed attempt, decays
  success: 0,    // 1 on success, decays
  mode: 'auth',  // 'auth' | 'dashboard'
  pointer: { x: 0, y: 0 },
  muted: (() => { try { return localStorage.getItem('lava.muted') === '1' } catch { return false } })(),
}

export const pulse = (kind, amount = 1) => { fx[kind] = Math.min(1, fx[kind] + amount) }

// Synth sound effects with WebAudio (no assets needed)
let ctx
function tone(freq, dur = 0.08, type = 'sine', gain = 0.04, slide = 0) {
  if (fx.muted) return
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t); o.stop(t + dur)
  } catch { /* audio unavailable */ }
}
export const sfx = {
  key: () => tone(900 + Math.random() * 400, 0.03, 'triangle', 0.015),
  click: () => tone(520, 0.07, 'square', 0.02, 1.6),
  error: () => { tone(220, 0.18, 'sawtooth', 0.03, 0.5) },
  success: () => { tone(523, 0.12, 'sine', 0.05); setTimeout(() => tone(784, 0.14, 'sine', 0.05), 90); setTimeout(() => tone(1046, 0.3, 'sine', 0.05), 190) },
  whoosh: () => tone(300, 0.25, 'sine', 0.03, 3),
}

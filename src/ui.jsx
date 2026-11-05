import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { fx, pulse, sfx } from './fx'

/** Card that tilts in 3D toward the cursor with a moving glare highlight. */
export function TiltCard({ children, className = '' }) {
  const ref = useRef()
  const mx = useMotionValue(0.5), my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [9, -9]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(mx, [0, 1], [-11, 11]), { stiffness: 150, damping: 18 })
  const gx = useTransform(mx, (v) => `${v * 100}%`), gy = useTransform(my, (v) => `${v * 100}%`)
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height)
  }
  const reset = () => { mx.set(0.5); my.set(0.5) }
  return (
    <motion.div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={reset}
      style={{ rotateX: rx, rotateY: ry, '--gx': gx, '--gy': gy }}>
      <div className="glare" />
      {children}
    </motion.div>
  )
}

/** Floating-label input with glow focus, optional right-side adornment. */
export function Field({ label, icon, type = 'text', value, onChange, right, hint, hintTone, autoComplete, name, onKeyUp, autoFocus }) {
  const [focus, setFocus] = useState(false)
  const filled = value?.length > 0
  return (
    <div className={`field ${focus ? 'focus' : ''} ${filled ? 'filled' : ''}`}>
      <span className="field-icon">{icon}</span>
      <input name={name} id={name} type={type} value={value} autoComplete={autoComplete} autoFocus={autoFocus}
        onChange={(e) => { onChange(e.target.value); pulse('energy', 0.12); sfx.key() }}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onKeyUp={onKeyUp}
        placeholder=" " spellCheck={false} />
      <label htmlFor={name}>{label}</label>
      {right && <span className="field-right">{right}</span>}
      <span className="field-line" />
      <AnimatePresence>
        {hint && (
          <motion.small key={hint} className={`hint ${hintTone || ''}`} initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>{hint}</motion.small>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PasswordField({ value, onChange, label = 'Password', name = 'password', autoComplete = 'current-password', hint, hintTone }) {
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  return (
    <Field name={name} label={label} type={show ? 'text' : 'password'} value={value} onChange={onChange}
      autoComplete={autoComplete} icon={<LockIcon />}
      onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock'))}
      hint={caps ? 'Caps Lock is on' : hint} hintTone={caps ? 'warn' : hintTone}
      right={
        <button type="button" className="eye" aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => { setShow((s) => !s); sfx.click() }}>
          <EyeIcon open={show} />
        </button>
      } />
  )
}

export function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(4, s)
}
const LABELS = ['Too weak', 'Weak', 'Okay', 'Strong', 'Molten 🔥']
export function StrengthMeter({ pw }) {
  const s = pw ? strength(pw) : -1
  return (
    <div className="meter" aria-label={`Password strength: ${s >= 0 ? LABELS[s] : 'none'}`}>
      <div className="meter-bars">
        {[0, 1, 2, 3].map((i) => (
          <motion.span key={i} animate={{ scaleX: s >= i ? 1 : 0, opacity: s >= i ? 1 : 0.2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.04 }}
            className={s >= 3 ? 'hot' : ''} />
        ))}
      </div>
      <small>{pw ? LABELS[s] : 'Use 8+ chars, mix cases, numbers & symbols'}</small>
    </div>
  )
}

/** Button with click ripple + magnetic hover. */
export function LavaButton({ children, loading, variant = 'primary', className = '', onClick, type = 'button', disabled }) {
  const [ripples, setRipples] = useState([])
  const ref = useRef()
  const x = useSpring(0, { stiffness: 200, damping: 15 }), y = useSpring(0, { stiffness: 200, damping: 15 })
  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.12); y.set((e.clientY - r.top - r.height / 2) * 0.25)
  }
  const click = (e) => {
    const r = ref.current.getBoundingClientRect()
    const id = Date.now()
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples((rs) => rs.filter((q) => q.id !== id)), 700)
    sfx.click()
    onClick?.(e)
  }
  return (
    <motion.button ref={ref} type={type} disabled={disabled || loading} onClick={click}
      onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0) }}
      whileTap={{ scale: 0.96 }} style={{ x, y }} className={`btn ${variant} ${className}`}>
      {ripples.map((r) => <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />)}
      <span className="btn-content">{loading ? <span className="spinner" /> : children}</span>
    </motion.button>
  )
}

export function Toasts({ toasts }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className={`toast ${t.tone}`} layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}>
            <span className="toast-dot" />{t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToasts() {
  const [toasts, set] = useState([])
  const push = (msg, tone = 'info') => {
    const id = Math.random()
    set((t) => [...t, { id, msg, tone }])
    setTimeout(() => set((t) => t.filter((x) => x.id !== id)), 4200)
  }
  return [toasts, push]
}

/** Custom cursor glow that follows the pointer and feeds the 3D scene. */
export function CursorGlow() {
  const x = useSpring(-100, { stiffness: 400, damping: 30 }), y = useSpring(-100, { stiffness: 400, damping: 30 })
  useEffect(() => {
    const m = (e) => {
      x.set(e.clientX); y.set(e.clientY)
      fx.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      fx.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('pointermove', m)
    return () => window.removeEventListener('pointermove', m)
  }, [x, y])
  return <motion.div className="cursor-glow" style={{ x, y }} aria-hidden />
}

/** Text that scrambles into place. */
export function Scramble({ text, className }) {
  const [out, setOut] = useState(text)
  useEffect(() => {
    const chars = '!<>-_\\/[]{}=+*^?#$%&01'
    let frame = 0
    const id = setInterval(() => {
      frame++
      setOut(text.split('').map((c, i) => (i < frame / 2 || c === ' ' ? c : chars[Math.floor(Math.random() * chars.length)])).join(''))
      if (frame / 2 > text.length) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [text])
  return <span className={className}>{out}</span>
}

// ---- icons (stroke = currentColor) ----
const I = (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p} />
export const UserIcon = () => <I><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></I>
export const MailIcon = () => <I><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></I>
export const LockIcon = () => <I><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></I>
export const AtIcon = () => <I><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></I>
export const EyeIcon = ({ open }) => <I>{open ? <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></> : <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1" /></>}</I>
export const SoundIcon = ({ on }) => <I><path d="M11 5 6 9H3v6h3l5 4z" />{on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6M21 9l-5 6" />}</I>
export const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="currentColor" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="currentColor" opacity=".75" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="currentColor" opacity=".9" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="currentColor" opacity=".6" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

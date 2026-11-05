import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { supabase } from './supabase'
import AuthCard from './AuthCard'
import Dashboard from './Dashboard'
import { Toasts, useToasts, CursorGlow, SoundIcon } from './ui'
import { fx, pulse, sfx } from './fx'

const Scene = lazy(() => import('./Scene'))

function burst() {
  const colors = ['#FF6A1A', '#FFD166']
  const end = Date.now() + 900
  ;(function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors, scalar: 1.1 })
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, scalar: 1.1 })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.55 }, colors, shapes: ['circle'] })
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [recovery, setRecovery] = useState(false)
  const [muted, setMuted] = useState(fx.muted)
  const [toasts, toast] = useToasts()
  const first = useRef(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); first.current = !data.session })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') { setRecovery(true); return }
      if (event === 'SIGNED_OUT') first.current = true
      // celebrate only on a real transition from signed-out to signed-in
      if (event === 'SIGNED_IN' && first.current && s) {
        first.current = false
        supabase.rpc('record_login')
        pulse('success'); sfx.success(); burst()
      }
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => { fx.mode = session && !recovery ? 'dashboard' : 'auth' }, [session, recovery])

  const toggleSound = () => {
    fx.muted = !fx.muted; setMuted(fx.muted)
    try { localStorage.setItem('lava.muted', fx.muted ? '1' : '0') } catch { /* ignore */ }
    sfx.click()
  }

  const showDash = session && !recovery

  return (
    <>
      <Suspense fallback={null}><Scene /></Suspense>
      <div className="grain" aria-hidden />
      <CursorGlow />
      <header className="top">
        <div className="top-logo"><span className="dot" /> LAVA</div>
        <button className="icon-btn" onClick={toggleSound} aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}><SoundIcon on={!muted} /></button>
      </header>

      <main className={`stage ${showDash ? 'dash-mode' : ''}`}>
        <motion.section className="hero" initial={{ opacity: 0, x: -40 }} animate={{ opacity: showDash ? 0 : 1, x: showDash ? -60 : 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} aria-hidden={showDash}>
          <div className="eyebrow">secure · animated · real-time</div>
          <h2 className="hero-title">Login that<br /><span className="melt">melts</span> the<br />boring away.</h2>
          <ul className="hero-points">
            <li>Google, email or username sign-in</li>
            <li>Saved details on trusted devices</li>
            <li>Every signup synced to Notion</li>
          </ul>
        </motion.section>

        <AnimatePresence mode="wait">
          {session === undefined ? (
            <motion.div key="load" className="loader" exit={{ opacity: 0 }}><span /></motion.div>
          ) : showDash ? (
            <Dashboard key="dash" session={session} toast={toast} />
          ) : (
            <motion.div key="auth" exit={{ opacity: 0, scale: 0.8, rotateX: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5 }}>
              <AuthCard toast={toast} recovery={recovery} onRecovered={() => setRecovery(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Toasts toasts={toasts} />
    </>
  )
}

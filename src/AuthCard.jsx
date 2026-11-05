import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { supabase, signInWithIdentifier, usernameAvailable, getRemember, setRemember, getSaved, setSaved } from './supabase'
import { TiltCard, Field, PasswordField, StrengthMeter, LavaButton, Scramble, strength,
  UserIcon, MailIcon, AtIcon, GoogleIcon } from './ui'
import { pulse, sfx } from './fx'

const flip = {
  initial: (dir) => ({ rotateY: dir * 90, opacity: 0, scale: 0.92 }),
  animate: { rotateY: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } },
  exit: (dir) => ({ rotateY: dir * -90, opacity: 0, scale: 0.92, transition: { duration: 0.22 } }),
}
const stagger = { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }
const item = { initial: { opacity: 0, y: 14, filter: 'blur(6px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' } }

export default function AuthCard({ toast, recovery, onRecovered }) {
  const [view, setView] = useState(recovery ? 'recovery' : 'signin')
  const [dir, setDir] = useState(1)
  const shake = useAnimationControls()
  const go = (v, d = 1) => { setDir(d); setView(v); sfx.whoosh() }

  useEffect(() => { if (recovery) setView('recovery') }, [recovery])

  const fail = (msg) => {
    pulse('error'); sfx.error(); toast(msg, 'error')
    shake.start({ x: [0, -14, 12, -8, 6, -3, 0], transition: { duration: 0.5 } })
  }

  return (
    <motion.div animate={shake} className="card-wrap">
      <TiltCard className="card">
        <div className="card-border" />
        <Brand />
        {['signin', 'signup'].includes(view) && (
          <div className="tabs" role="tablist">
            {['signin', 'signup'].map((t) => (
              <button key={t} role="tab" aria-selected={view === t} className={view === t ? 'on' : ''}
                onClick={() => view !== t && go(t, t === 'signup' ? 1 : -1)}>
                {view === t && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                <span>{t === 'signin' ? 'Sign in' : 'Create account'}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flip-stage">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={view} custom={dir} variants={flip} initial="initial" animate="animate" exit="exit" className="face">
              {view === 'signin' && <SignIn go={go} fail={fail} toast={toast} />}
              {view === 'signup' && <SignUp go={go} fail={fail} toast={toast} />}
              {view === 'forgot' && <Forgot go={go} fail={fail} toast={toast} />}
              {view === 'magic' && <Magic go={go} fail={fail} toast={toast} />}
              {view === 'sent' && <Sent go={go} />}
              {view === 'recovery' && <Recovery fail={fail} toast={toast} onDone={onRecovered} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </TiltCard>
    </motion.div>
  )
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-orb"><span /></div>
      <div>
        <Scramble text="LAVA" className="brand-name" />
        <div className="brand-sub">identity forge</div>
      </div>
    </div>
  )
}

function GoogleButton({ fail }) {
  const [loading, setLoading] = useState(false)
  const go = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) { setLoading(false); fail(error.message.includes('not enabled') ? 'Google sign-in is not enabled yet (see README)' : error.message) }
  }
  return <LavaButton variant="ghost" className="google" loading={loading} onClick={go}><GoogleIcon /> Continue with Google</LavaButton>
}

function Divider() { return <motion.div variants={item} className="divider"><span>or</span></motion.div> }

function Remember({ checked, onChange }) {
  return (
    <label className="remember">
      <input type="checkbox" checked={checked} onChange={(e) => { onChange(e.target.checked); sfx.click() }} />
      <span className="box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      Save my details
    </label>
  )
}

function SignIn({ go, fail, toast }) {
  const saved = getSaved()
  const [id, setId] = useState(saved?.identifier || '')
  const [pw, setPw] = useState('')
  const [remember, setRem] = useState(getRemember())
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!id || !pw) return fail('Enter your username/email and password')
    setLoading(true)
    setRemember(remember)
    try {
      await signInWithIdentifier(id, pw)
      setSaved(remember ? { identifier: id.trim() } : null)
    } catch (err) { fail(err.message); setLoading(false) }
  }

  return (
    <motion.form variants={stagger} initial="initial" animate="animate" onSubmit={submit} className="form">
      <motion.h1 variants={item}>{saved?.identifier ? <>Welcome back, <em>{saved.identifier.split('@')[0]}</em></> : <>Step into the <em>heat</em></>}</motion.h1>
      <motion.p variants={item} className="muted">Sign in with your username or email.</motion.p>
      <motion.div variants={item}><GoogleButton fail={fail} /></motion.div>
      <Divider />
      <motion.div variants={item}>
        <Field name="identifier" label="Username or email" value={id} onChange={setId} icon={id.includes('@') ? <MailIcon /> : <UserIcon />} autoComplete="username" />
      </motion.div>
      <motion.div variants={item}><PasswordField value={pw} onChange={setPw} /></motion.div>
      <motion.div variants={item} className="row">
        <Remember checked={remember} onChange={setRem} />
        <button type="button" className="link" onClick={() => go('forgot')}>Forgot password?</button>
      </motion.div>
      <motion.div variants={item}><LavaButton type="submit" loading={loading} className="wide">Ignite session →</LavaButton></motion.div>
      <motion.div variants={item} className="foot">
        <button type="button" className="link" onClick={() => go('magic')}>✦ Email me a magic link instead</button>
      </motion.div>
    </motion.form>
  )
}

function SignUp({ go, fail, toast }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [remember, setRem] = useState(true)
  const [avail, setAvail] = useState(null) // null | 'checking' | true | false
  const [loading, setLoading] = useState(false)
  const uname = username.trim().toLowerCase()
  const validU = /^[a-z0-9_]{3,20}$/.test(uname)

  useEffect(() => {
    if (!validU) { setAvail(null); return }
    setAvail('checking')
    const t = setTimeout(async () => setAvail(await usernameAvailable(uname)), 400)
    return () => clearTimeout(t)
  }, [uname, validU])

  const uHint = !username ? '3–20 chars: letters, numbers, underscore'
    : !validU ? 'Only a–z, 0–9 and _ (3–20 chars)'
    : avail === 'checking' ? 'Checking…' : avail === true ? `@${uname} is yours to claim` : avail === false ? 'That username is taken' : ''
  const uTone = !username ? '' : !validU || avail === false ? 'bad' : avail === true ? 'good' : ''

  const submit = async (e) => {
    e.preventDefault()
    if (!validU) return fail('Pick a valid username')
    if (avail === false) return fail('That username is taken')
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email')
    if (strength(pw) < 2 || pw.length < 8) return fail('Make your password stronger (8+ chars)')
    if (pw !== pw2) return fail("Passwords don't match")
    setLoading(true)
    setRemember(remember)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password: pw,
      options: { data: { username: uname }, emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) return fail(error.message)
    if (data.user && data.user.identities?.length === 0) return fail('An account with this email already exists')
    setSaved(remember ? { identifier: uname } : null)
    if (!data.session) { sfx.success(); toast('Account forged! Confirm your email to log in.', 'good'); go('sent') }
  }

  return (
    <motion.form variants={stagger} initial="initial" animate="animate" onSubmit={submit} className="form">
      <motion.h1 variants={item}>Forge your <em>identity</em></motion.h1>
      <motion.div variants={item}><GoogleButton fail={fail} /></motion.div>
      <Divider />
      <motion.div variants={item}>
        <Field name="username" label="Username" value={username} onChange={(v) => setUsername(v.toLowerCase())} icon={<AtIcon />}
          autoComplete="username" hint={uHint} hintTone={uTone}
          right={avail === true && validU ? <span className="ok">✓</span> : avail === false ? <span className="no">✕</span> : null} />
      </motion.div>
      <motion.div variants={item}><Field name="email" type="email" label="Email" value={email} onChange={setEmail} icon={<MailIcon />} autoComplete="email" /></motion.div>
      <motion.div variants={item}><PasswordField name="new-password" value={pw} onChange={setPw} autoComplete="new-password" /></motion.div>
      <motion.div variants={item}><StrengthMeter pw={pw} /></motion.div>
      <motion.div variants={item}>
        <PasswordField name="confirm-password" label="Confirm password" value={pw2} onChange={setPw2} autoComplete="new-password"
          hint={pw2 && pw !== pw2 ? "Doesn't match yet" : pw2 && pw === pw2 ? 'Matches' : ''} hintTone={pw2 && pw !== pw2 ? 'bad' : 'good'} />
      </motion.div>
      <motion.div variants={item} className="row"><Remember checked={remember} onChange={setRem} /></motion.div>
      <motion.div variants={item}><LavaButton type="submit" loading={loading} className="wide">Create account →</LavaButton></motion.div>
    </motion.form>
  )
}

function Forgot({ go, fail, toast }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter the email on your account')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
    setLoading(false)
    if (error) return fail(error.message)
    toast('Reset link sent — check your inbox', 'good'); go('sent')
  }
  return (
    <motion.form variants={stagger} initial="initial" animate="animate" onSubmit={submit} className="form">
      <motion.h1 variants={item}>Lost the <em>key?</em></motion.h1>
      <motion.p variants={item} className="muted">We'll email you a link to set a new password.</motion.p>
      <motion.div variants={item}><Field name="email" type="email" label="Email" value={email} onChange={setEmail} icon={<MailIcon />} autoComplete="email" autoFocus /></motion.div>
      <motion.div variants={item}><LavaButton type="submit" loading={loading} className="wide">Send reset link</LavaButton></motion.div>
      <motion.div variants={item} className="foot"><button type="button" className="link" onClick={() => go('signin', -1)}>← Back to sign in</button></motion.div>
    </motion.form>
  )
}

function Magic({ go, fail, toast }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (error) return fail(error.message.includes('Signups not allowed') ? 'No account with that email yet' : error.message)
    toast('Magic link on its way ✦', 'good'); go('sent')
  }
  return (
    <motion.form variants={stagger} initial="initial" animate="animate" onSubmit={submit} className="form">
      <motion.h1 variants={item}>Password-free <em>magic</em></motion.h1>
      <motion.p variants={item} className="muted">One click from your inbox and you're in.</motion.p>
      <motion.div variants={item}><Field name="email" type="email" label="Email" value={email} onChange={setEmail} icon={<MailIcon />} autoComplete="email" autoFocus /></motion.div>
      <motion.div variants={item}><LavaButton type="submit" loading={loading} className="wide">Send magic link ✦</LavaButton></motion.div>
      <motion.div variants={item} className="foot"><button type="button" className="link" onClick={() => go('signin', -1)}>← Back to sign in</button></motion.div>
    </motion.form>
  )
}

function Sent({ go }) {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="form center">
      <motion.div variants={item} className="envelope">
        <motion.div className="env-body" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}>
          <MailIcon />
        </motion.div>
        {[0, 1, 2].map((i) => <motion.span key={i} className="env-ring" initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }} transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.8 }} />)}
      </motion.div>
      <motion.h1 variants={item}>Check your <em>inbox</em></motion.h1>
      <motion.p variants={item} className="muted">We sent you a link. Open it on this device to continue — then sign in with your username or email.</motion.p>
      <motion.div variants={item}><LavaButton className="wide" onClick={() => go('signin', -1)}>Back to sign in</LavaButton></motion.div>
    </motion.div>
  )
}

function Recovery({ fail, toast, onDone }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (strength(pw) < 2 || pw.length < 8) return fail('Make your password stronger (8+ chars)')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) return fail(error.message)
    toast('Password updated 🔥', 'good'); onDone?.()
  }
  return (
    <motion.form variants={stagger} initial="initial" animate="animate" onSubmit={submit} className="form">
      <motion.h1 variants={item}>Set a new <em>password</em></motion.h1>
      <motion.div variants={item}><PasswordField name="new-password" label="New password" value={pw} onChange={setPw} autoComplete="new-password" /></motion.div>
      <motion.div variants={item}><StrengthMeter pw={pw} /></motion.div>
      <motion.div variants={item}><LavaButton type="submit" loading={loading} className="wide">Save password</LavaButton></motion.div>
    </motion.form>
  )
}

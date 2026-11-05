import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { supabase, setSaved } from './supabase'
import { TiltCard, LavaButton, Scramble, Field, UserIcon } from './ui'
import { sfx } from './fx'

function Counter({ to }) {
  const [v, setV] = useState(0)
  useEffect(() => { const c = animate(0, to, { duration: 1.4, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) }); return c.stop }, [to])
  return <>{v}</>
}

const fmt = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const ago = (d) => {
  if (!d) return '—'
  const days = Math.floor((Date.now() - new Date(d)) / 864e5)
  return days <= 0 ? 'today' : days === 1 ? '1 day' : `${days} days`
}

export default function Dashboard({ session, toast }) {
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const user = session.user

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setName(data.full_name || '') }
    })
  }, [user.id])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() || null }).eq('id', user.id)
    setSaving(false)
    if (error) toast(error.message, 'error'); else { toast('Profile saved', 'good'); setProfile((p) => ({ ...p, full_name: name.trim() })) }
  }
  const signOut = async () => { sfx.whoosh(); await supabase.auth.signOut() }
  const forget = async () => { setSaved(null); toast('Saved details cleared from this device', 'info') }

  const display = profile?.full_name || profile?.username || user.email
  const initials = (display || '?').slice(0, 2).toUpperCase()

  return (
    <motion.div className="dash" initial={{ opacity: 0, y: 40, rotateX: 20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16 }}>
      <TiltCard className="card dash-card">
        <div className="card-border" />
        <div className="dash-head">
          <div className="avatar">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" /> : <span>{initials}</span>}
            <i className="avatar-ring" />
          </div>
          <div>
            <div className="muted small">You're in. Welcome,</div>
            <h1 className="dash-name"><Scramble text={display || ''} /></h1>
            {profile && <div className="tag">@{profile.username} · {profile.provider}</div>}
          </div>
        </div>

        <div className="stats">
          <div className="stat"><b><Counter to={profile?.login_count || 1} /></b><span>sign-ins</span></div>
          <div className="stat"><b>{ago(profile?.created_at)}</b><span>member for</span></div>
          <div className="stat"><b>{profile?.notion_synced ? '✓' : '…'}</b><span>logged to Notion</span></div>
        </div>

        <div className="info">
          <div><span>Email</span><b>{user.email}</b></div>
          <div><span>Member since</span><b>{fmt(profile?.created_at)}</b></div>
          <div><span>Last sign-in</span><b>{fmt(profile?.last_login_at)}</b></div>
        </div>

        <div className="edit">
          <Field name="full_name" label="Display name" value={name} onChange={setName} icon={<UserIcon />} autoComplete="name" />
          <LavaButton variant="ghost" loading={saving} onClick={save}>Save</LavaButton>
        </div>

        <div className="dash-actions">
          <LavaButton className="wide" onClick={signOut}>Sign out</LavaButton>
          <button className="link" onClick={forget}>Forget saved details on this device</button>
        </div>
      </TiltCard>
    </motion.div>
  )
}

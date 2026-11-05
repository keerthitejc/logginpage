import { createClient } from '@supabase/supabase-js'

const REMEMBER_KEY = 'lava.remember'

/** "Remember me": session lives in localStorage (survives restarts) or sessionStorage (cleared when tab closes). */
const safe = (fn, fallback = null) => { try { return fn() } catch { return fallback } }
export const getRemember = () => safe(() => localStorage.getItem(REMEMBER_KEY) !== '0', true)
export const setRemember = (on) => safe(() => localStorage.setItem(REMEMBER_KEY, on ? '1' : '0'))

const rememberStorage = {
  getItem: (k) => safe(() => localStorage.getItem(k) ?? sessionStorage.getItem(k)),
  setItem: (k, v) => safe(() => {
    if (getRemember()) { localStorage.setItem(k, v); sessionStorage.removeItem(k) }
    else { sessionStorage.setItem(k, v); localStorage.removeItem(k) }
  }),
  removeItem: (k) => safe(() => { localStorage.removeItem(k); sessionStorage.removeItem(k) }),
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storage: rememberStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)

/** Saved login details (identifier only — never the password; browsers' password managers handle that). */
const SAVED_KEY = 'lava.saved'
export const getSaved = () => safe(() => JSON.parse(localStorage.getItem(SAVED_KEY)) || null)
export const setSaved = (v) => safe(() => v ? localStorage.setItem(SAVED_KEY, JSON.stringify(v)) : localStorage.removeItem(SAVED_KEY))

export async function signInWithIdentifier(identifier, password) {
  const id = identifier.trim()
  if (id.includes('@')) {
    const { error } = await supabase.auth.signInWithPassword({ email: id, password })
    if (error) throw new Error(error.message.includes('confirm') ? 'Please confirm your email first' : 'Invalid email or password')
    return
  }
  const { data, error } = await supabase.functions.invoke('login-username', { body: { username: id, password } })
  if (error) {
    let msg = 'Invalid username or password'
    try { msg = (await error.context.json()).error || msg } catch { /* keep default */ }
    throw new Error(msg)
  }
  const { error: e2 } = await supabase.auth.setSession(data)
  if (e2) throw new Error(e2.message)
}

export async function usernameAvailable(name) {
  const { data, error } = await supabase.rpc('username_available', { name })
  if (error) return null
  return data
}

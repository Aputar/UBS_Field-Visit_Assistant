import { supabase } from './supabase'

// ── USERS ──────────────────────────────────────────────────
export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) throw error
  return data
}

export async function loginUser(name, password) {
  // Fetch by name (case-insensitive), then check password manually
  // This avoids issues with .eq() being case-sensitive on some Supabase configs
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('name', `%${name.trim()}%`)
    .limit(20)
  if (error) throw error
  if (!data || data.length === 0) return null
  // Find exact password match
  const user = data.find(u => u.password === password.trim())
  return user || null
}

export async function createUser(user) {
  const { data, error } = await supabase.from('users').insert([user]).select().single()
  if (error) throw error
  return data
}

export async function deleteUser(id) {
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
}

// ── DEALERS ────────────────────────────────────────────────
export async function getDealers() {
  const { data, error } = await supabase.from('dealers').select('*').order('name')
  if (error) throw error
  return data
}

export async function createDealer(dealer) {
  const { data, error } = await supabase.from('dealers').insert([dealer]).select().single()
  if (error) throw error
  return data
}

export async function deleteDealer(id) {
  const { error } = await supabase.from('dealers').delete().eq('id', id)
  if (error) throw error
}

// ── TRHS ───────────────────────────────────────────────────
export async function getTRHs() {
  const { data, error } = await supabase.from('trhs').select('*').order('name')
  if (error) throw error
  return data
}

export async function createTRH(trh) {
  const { data, error } = await supabase.from('trhs').insert([trh]).select().single()
  if (error) throw error
  return data
}

export async function deleteTRH(id) {
  const { error } = await supabase.from('trhs').delete().eq('id', id)
  if (error) throw error
}

// ── REs ────────────────────────────────────────────────────
export async function getREs() {
  const { data, error } = await supabase.from('res').select('*').order('name')
  if (error) throw error
  return data
}

export async function createRE(re) {
  const { data, error } = await supabase.from('res').insert([re]).select().single()
  if (error) throw error
  return data
}

export async function deleteRE(id) {
  const { error } = await supabase.from('res').delete().eq('id', id)
  if (error) throw error
}

// ── VISITS ─────────────────────────────────────────────────
export async function getVisits() {
  const { data, error } = await supabase.from('visits').select('*').order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function createVisit(visit) {
  const { data, error } = await supabase.from('visits').insert([visit]).select().single()
  if (error) throw error
  return data
}

// ── ACTIONS ────────────────────────────────────────────────
export async function getActions() {
  const { data, error } = await supabase.from('actions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAction(action) {
  const { data, error } = await supabase.from('actions').insert([action]).select().single()
  if (error) throw error
  return data
}

export async function updateAction(id, updates) {
  const { data, error } = await supabase.from('actions').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAction(id) {
  const { error } = await supabase.from('actions').delete().eq('id', id)
  if (error) throw error
}

// ── CATEGORIES ─────────────────────────────────────────────
export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data?.map(c => c.name) || []
}

export async function createCategory(name) {
  const { data, error } = await supabase.from('categories').insert([{ name }]).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(name) {
  const { error } = await supabase.from('categories').delete().eq('name', name)
  if (error) throw error
}

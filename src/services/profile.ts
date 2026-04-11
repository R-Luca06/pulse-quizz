import { supabase } from './supabase'
import { AppError } from './errors'

export async function updatePassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new AppError('validation_error', 'Le mot de passe doit contenir au moins 8 caractères')
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new AppError('auth_error', error.message)
}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_user')
  if (error) throw new AppError('auth_error', error.message)
}

export async function updateEmail(newEmail: string): Promise<void> {
  const trimmed = newEmail.trim().toLowerCase()
  if (!trimmed.includes('@') || trimmed.length < 5) {
    throw new AppError('validation_error', 'Adresse email invalide')
  }
  const { error } = await supabase.auth.updateUser({ email: trimmed })
  if (error) throw new AppError('auth_error', error.message)
}

export async function updateUsername(userId: string, username: string): Promise<void> {
  const trimmed = username.trim()
  if (trimmed.length < 3 || trimmed.length > 20) {
    throw new AppError('validation_error', 'Le pseudo doit contenir entre 3 et 20 caractères')
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    throw new AppError('validation_error', 'Le pseudo ne peut contenir que des lettres, chiffres et underscores')
  }
  // Vérification unicité insensible à la casse (exclut l'utilisateur courant)
  const { data: conflict } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', trimmed)
    .neq('id', userId)
    .maybeSingle()
  if (conflict) throw new AppError('validation_error', 'Ce pseudo est déjà utilisé')

  const { error } = await supabase
    .from('profiles')
    .update({ username: trimmed })
    .eq('id', userId)
  if (error) {
    const msg = error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('unique')
      ? 'Ce pseudo est déjà utilisé'
      : error.message
    throw new AppError('db_error', msg)
  }

  // Synchroniser le pseudo dans toutes les entrées leaderboard de l'utilisateur
  const { error: lbError } = await supabase
    .from('leaderboard')
    .update({ username: trimmed })
    .eq('user_id', userId)
  if (lbError) throw new AppError('db_error', lbError.message)
}

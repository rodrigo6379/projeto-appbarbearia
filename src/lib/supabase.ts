import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

export type Service = {
  id: string
  client_name: string
  description: string
  amount: number
  service_date: string
  service_time: string
  posted_to_finance: boolean
  transaction_id: string | null
  created_at: string
}

export type Transaction = {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  transaction_date: string
  source: 'manual' | 'service'
  service_id: string | null
  created_at: string
}

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'posted_to_finance' | 'transaction_id'>
export type TransactionInsert = Omit<Transaction, 'id' | 'created_at'>

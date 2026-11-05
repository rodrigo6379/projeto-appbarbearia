import { vi } from 'vitest'

export type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
  catch: ReturnType<typeof vi.fn>
}

export function createMockQuery(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'gte', 'lte', 'ilike', 'single', 'maybeSingle']

  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation(() => chain)
  }

  // Terminal methods that resolve to the result
  chain.single = vi.fn().mockResolvedValue(result)
  chain.maybeSingle = vi.fn().mockResolvedValue(result)

  // Make the chain itself thenable (so `await query` works)
  chain.then = vi.fn((resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve))
  chain.catch = vi.fn((reject: (e: unknown) => unknown) => Promise.resolve(result).catch(reject))

  return chain
}

export function createMockSupabase(tables: Record<string, { data?: unknown; error?: unknown }>) {
  const from = vi.fn((table: string) => {
    const entry = tables[table] ?? { data: [], error: null }
    return createMockQuery({ data: entry.data, error: entry.error })
  })

  return { from }
}

export function mockSupabaseModule(mockClient: ReturnType<typeof createMockSupabase>) {
  vi.mock('../lib/supabase', () => ({
    supabase: mockClient,
  }))
}

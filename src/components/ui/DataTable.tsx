import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  width?: string
  sortable?: boolean
  render?: (row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  emptyMessage?: string
  loading?: boolean
  className?: string
  selectedIds?: Set<string>
  onSelectChange?: (ids: Set<string>) => void
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  pageSize = 15,
  searchable,
  searchPlaceholder = 'Filter results...',
  searchKeys = [],
  emptyMessage = 'No records found',
  loading,
  className,
  selectedIds,
  onSelectChange,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query || searchKeys.length === 0) return data
    const q = query.toLowerCase()
    return data.filter(row =>
      searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q))
    )
  }, [data, query, searchKeys])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const va = String((a as any)[sortKey] ?? '')
      const vb = String((b as any)[sortKey] ?? '')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  function handleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const allSelected = paginated.length > 0 && paginated.every(r => selectedIds?.has(keyExtractor(r)))

  function toggleAll() {
    if (!onSelectChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (allSelected) paginated.forEach(r => next.delete(keyExtractor(r)))
    else paginated.forEach(r => next.add(keyExtractor(r)))
    onSelectChange(next)
  }

  function toggleRow(id: string) {
    if (!onSelectChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectChange(next)
  }

  if (loading) {
    return (
      <div className={cn('panel overflow-hidden', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 px-3 py-2.5 border-b border-bg-border">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-3 bg-bg-border rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      {searchable && (
        <div className="px-3 py-2 border-b border-bg-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              className="input pl-7"
              placeholder={searchPlaceholder}
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
            />
          </div>
        </div>
      )}

      <div className="overflow-auto flex-1">
        <table className="data-table w-full min-w-max">
          <thead>
            <tr>
              {onSelectChange && (
                <th className="w-8 text-center">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-amber-500 w-3 h-3" />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}
                  className={cn(col.sortable && 'cursor-pointer select-none hover:text-text-primary')}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectChange ? 1 : 0)} className="text-center py-12 text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : paginated.map((row, i) => {
              const id = keyExtractor(row)
              const selected = selectedIds?.has(id)
              return (
                <tr key={id} onClick={() => onRowClick?.(row)}
                  className={cn(selected && 'bg-amber-500/5', onRowClick && 'cursor-pointer')}>
                  {onSelectChange && (
                    <td className="text-center" onClick={e => { e.stopPropagation(); toggleRow(id) }}>
                      <input type="checkbox" checked={!!selected} onChange={() => toggleRow(id)} className="accent-amber-500 w-3 h-3" />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row, i) : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 border-t border-bg-border text-xs text-text-muted">
          <span className="text-2xs sm:text-xs">{sorted.length} records — Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost px-2 py-1 disabled:opacity-40">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('px-2 py-0.5 rounded text-xs', p === page ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-bg-hover text-text-muted')}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn-ghost px-2 py-1 disabled:opacity-40">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

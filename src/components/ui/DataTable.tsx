import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
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
  searchPlaceholder = 'Filter telemetry records...',
  searchKeys = [],
  emptyMessage = 'No records found matching criteria',
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
      <div className={cn('panel overflow-hidden p-4', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-bg-border/40">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 bg-bg-border/60 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col min-w-0', className)}>
      {/* Search Filter Header */}
      {searchable && (
        <div className="p-3 border-b border-bg-border/70 flex items-center justify-between gap-3 bg-bg-secondary/40">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 bg-bg-card/80 border border-bg-border rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors font-mono"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-400 shrink-0">
            {filtered.length} telemetry records
          </div>
        </div>
      )}

      {/* Responsive Table Container with Touch Scroll */}
      <div className="sm:hidden px-3 py-1 bg-sky-500/5 text-sky-400/80 text-[10px] font-mono border-b border-bg-border/40 flex items-center justify-between">
        <span>↔ Swipe table horizontally to view telemetry fields</span>
      </div>
      <div className="overflow-x-auto scrollbar-thin touch-pan-x">
        <table className="w-full min-w-[760px] text-left border-collapse data-table">
          <thead>
            <tr>
              {onSelectChange && (
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-slate-700 bg-bg-card text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn(
                    'select-none',
                    col.sortable && 'cursor-pointer hover:text-sky-300'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
                        : <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectChange ? 1 : 0)}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => {
                const id = keyExtractor(row)
                const isSelected = selectedIds?.has(id)
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      isSelected && 'bg-sky-500/[0.08]'
                    )}
                  >
                    {onSelectChange && (
                      <td
                        className="px-4 py-3"
                        onClick={e => { e.stopPropagation(); toggleRow(id) }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-700 bg-bg-card text-sky-500 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(row, idx) : String((row as any)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-bg-border/70 flex items-center justify-between gap-2 text-xs font-mono text-slate-400 bg-bg-secondary/40">
          <div>
            Page <span className="font-bold text-slate-200">{page}</span> of <span className="font-bold text-slate-200">{totalPages}</span>
            <span className="text-[11px] ml-2 text-slate-500 hidden sm:inline">
              ({sorted.length} total)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

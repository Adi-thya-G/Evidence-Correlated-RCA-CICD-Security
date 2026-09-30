import { useMemo, useState } from 'react'
import { DATA } from './data'
import type { FindingItem, View } from './types'

export function useFindings() {
  const [tool, setTool] = useState('all')
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<FindingItem | null>(null)

  const items = useMemo(
    () => (tool === 'all' ? DATA : DATA.filter((f) => f.tool === tool)),
    [tool],
  )
  const count = (t: string) => (t === 'all' ? DATA.length : DATA.filter((f) => f.tool === t).length)

  return { tool, setTool, view, setView, selected, setSelected, items, count }
}
import {
  useCallback,
  useState,
  type DragEvent as ReactDragEvent,
  type DOMAttributes,
} from 'react'

export type DragState = { dragging: boolean; before: boolean; after: boolean }

export type DndItemProps = { draggable: boolean } & Pick<
  DOMAttributes<HTMLElement>,
  'onDragStart' | 'onDragOver' | 'onDrop' | 'onDragEnd'
>

/**
 * Drag-to-reorder for a flat list. Native HTML5 drag costs no extra JS and
 * works with a trackpad; touch users get explicit move buttons (and the arrow
 * keys do the same thing), so nobody needs a long-press gesture to nudge an
 * order on a phone.
 */
export function useListDnd(count: number, onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [over, setOver] = useState<{ index: number; after: boolean } | null>(null)

  const itemProps = useCallback(
    (index: number): DndItemProps => ({
      draggable: count > 1,
      onDragStart: (event: ReactDragEvent<HTMLElement>) => {
        event.dataTransfer.effectAllowed = 'move'
        try {
          event.dataTransfer.setData('text/plain', String(index))
        } catch {
          /* older Safari throws if data is set before the drag settles */
        }
        setDragIndex(index)
      },
      onDragOver: (event: ReactDragEvent<HTMLElement>) => {
        if (dragIndex === null) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        const rect = event.currentTarget.getBoundingClientRect()
        const after = rect.width > 0 ? event.clientX > rect.left + rect.width / 2 : false
        setOver({ index, after })
      },
      onDrop: (event: ReactDragEvent<HTMLElement>) => {
        event.preventDefault()
        const raw = Number(event.dataTransfer.getData('text/plain'))
        const from = Number.isFinite(raw) && raw >= 0 ? raw : dragIndex
        if (from !== null && over) {
          let target = over.index + (over.after ? 1 : 0)
          if (target > from) target -= 1
          if (target !== from && target >= 0 && target < count) onReorder(from, target)
        }
        setDragIndex(null)
        setOver(null)
      },
      onDragEnd: () => {
        setDragIndex(null)
        setOver(null)
      },
    }),
    [count, dragIndex, over, onReorder],
  )

  const stateFor = (index: number): DragState => ({
    dragging: dragIndex === index,
    before: Boolean(over && over.index === index && !over.after && dragIndex !== index),
    after: Boolean(over && over.index === index && over.after && dragIndex !== index),
  })

  return { itemProps, stateFor, isDragging: dragIndex !== null }
}

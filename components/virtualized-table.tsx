"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface VirtualizedTableProps<T> {
  data: T[]
  columns: {
    key: keyof T
    header: string
    width?: string
    render?: (value: T[keyof T], item: T) => React.ReactNode
  }[]
  rowHeight?: number
  visibleRows?: number
  className?: string
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 48,
  visibleRows = 20,
  className
}: VirtualizedTableProps<T>) {
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(visibleRows)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = data.length * rowHeight
  const visibleData = data.slice(startIndex, endIndex)
  const offsetY = startIndex * rowHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    
    const newStartIndex = Math.floor(scrollTop / rowHeight)
    const newEndIndex = Math.min(newStartIndex + visibleRows + 2, data.length) // +2 for buffer
    
    if (newStartIndex !== startIndex) {
      setStartIndex(newStartIndex)
      setEndIndex(newEndIndex)
    }
  }, [data.length, rowHeight, visibleRows, startIndex])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollTop
    }
  }, [scrollTop])

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className={`overflow-auto ${className || ''}`}
        style={{ height: visibleRows * rowHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={String(column.key)}
                    className={column.width || ''}
                    style={{ minWidth: column.width }}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleData.map((item, index) => (
                <TableRow 
                  key={startIndex + index}
                  style={{ height: rowHeight }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={String(column.key)}
                      className={column.width || ''}
                      style={{ 
                        minWidth: column.width,
                        height: rowHeight,
                        padding: '8px 16px'
                      }}
                    >
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="text-xs text-muted-foreground mt-2">
        Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} items
      </div>
    </div>
  )
}
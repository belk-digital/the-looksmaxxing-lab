'use client'

import React, { useEffect, useState } from 'react'

export default function TimeAgoCell({ rowData }: { rowData: any }) {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    if (!rowData?.createdAt) return

    const date = new Date(rowData.createdAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) {
      setTimeStr(`${diffMins} min${diffMins !== 1 ? 's' : ''} ago`)
    } else if (diffHours < 24) {
      setTimeStr(`${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`)
    } else {
      setTimeStr(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))
    }
  }, [rowData])

  return <span>{timeStr}</span>
}

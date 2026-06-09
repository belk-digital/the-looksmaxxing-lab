'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export const RestoreTrashButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRestore = async () => {
    if (!id) return
    
    if (!confirm('Are you sure you want to restore this document to its original collection?')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/trash/${id}/restore`, { method: 'POST' })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to restore document')
      }
      
      const data = await res.json()
      toast.success('Document restored successfully! It has been removed from the trash.')
      
      // Redirect to the original collection view
      if (data.collectionSlug && data.restoredId) {
        router.push(`/admin/collections/${data.collectionSlug}/${data.restoredId}`)
      } else {
        router.push('/admin/collections/trash')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error restoring document.')
    } finally {
      setLoading(false)
    }
  }

  if (!id) return null

  return (
    <div style={{ paddingBottom: '2rem', paddingTop: '1rem' }}>
      <button
        type="button"
        onClick={handleRestore}
        disabled={loading}
        style={{
          background: '#5984c4',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        {loading ? 'Restoring...' : 'Restore to Original Collection'}
      </button>
    </div>
  )
}

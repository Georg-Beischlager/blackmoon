'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@payloadcms/ui'

const MediaFilterTabs: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'all' | 'hex' | 'regular'>('all')

  useEffect(() => {
    // Check URL params to set initial tab
    const where = searchParams.get('where')
    if (where) {
      try {
        const parsed = JSON.parse(decodeURIComponent(where))
        if (parsed.isHexImage?.equals === true) {
          setActiveTab('hex')
        } else if (parsed.isHexImage?.equals === false) {
          setActiveTab('regular')
        }
      } catch {
        setActiveTab('all')
      }
    }
  }, [searchParams])

  const handleTabChange = (tab: 'all' | 'hex' | 'regular') => {
    setActiveTab(tab)

    const params = new URLSearchParams(searchParams.toString())

    if (tab === 'all') {
      params.delete('where')
    } else {
      const where = JSON.stringify({
        isHexImage: { equals: tab === 'hex' },
      })
      params.set('where', where)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '16px',
        borderBottom: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <Button
        onClick={() => handleTabChange('all')}
        buttonStyle={activeTab === 'all' ? 'primary' : 'secondary'}
      >
        All Media
      </Button>
      <Button
        onClick={() => handleTabChange('regular')}
        buttonStyle={activeTab === 'regular' ? 'primary' : 'secondary'}
      >
        Regular Images
      </Button>
      <Button
        onClick={() => handleTabChange('hex')}
        buttonStyle={activeTab === 'hex' ? 'primary' : 'secondary'}
      >
        Hex Images
      </Button>
    </div>
  )
}

export default MediaFilterTabs

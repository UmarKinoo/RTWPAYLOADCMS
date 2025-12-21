'use client'
import { getClientSideURL } from '@/utilities/getURL'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  const serverURL = getClientSideURL()
  
  // Ensure we always have a valid URL for the LivePreview component
  const validServerURL = serverURL || (typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:3000')
  
  return <PayloadLivePreview refresh={router.refresh} serverURL={validServerURL} />
}

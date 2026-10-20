'use client'

import { useEffect, useCallback, useState } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

interface UsePushNotifications {
  permission: PermissionState
  isSubscribed: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

/**
 * Hook to manage Web Push notification subscription lifecycle.
 * Registers the service worker, requests permission, and persists
 * the PushSubscription to the backend.
 */
export function usePushNotifications(): UsePushNotifications {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PermissionState)

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (registration) => {
        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          setIsSubscribed(true)
          setSubscription(existing)
        }
      })
      .catch(console.error)
  }, [])

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return

    const registration = await navigator.serviceWorker.ready

    const perm = await Notification.requestPermission()
    setPermission(perm as PermissionState)
    if (perm !== 'granted') return

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      setSubscription(sub)
      setIsSubscribed(true)

      // Persist to backend
      const json = sub.toJSON()
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? '',
            auth: json.keys?.auth ?? '',
          },
        }),
      })
    } catch (err) {
      console.error('[push] Subscribe error:', err)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return

    try {
      await subscription.unsubscribe()

      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      setSubscription(null)
      setIsSubscribed(false)
    } catch (err) {
      console.error('[push] Unsubscribe error:', err)
    }
  }, [subscription])

  return { permission, isSubscribed, subscribe, unsubscribe }
}

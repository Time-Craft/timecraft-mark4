
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
  createdAt: string
  read: boolean
  user_id: string
}

type NotificationPayload = RealtimePostgresChangesPayload<{
  [key: string]: any
}> & {
  new: Notification
  old: Notification
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })

      if (data) {
        setNotifications(data.map(notification => ({
          ...notification,
          createdAt: notification.created_at
        })) as Notification[])
      }
    }

    loadNotifications()
  }, [])

  // Setup real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        async (payload: NotificationPayload) => {
          const { data: user } = await supabase.auth.getUser()
          if (!user.user) return

          if (payload.new && payload.new.user_id === user.user.id) {
            const notification = payload.new
            
            setNotifications(prev => [notification, ...prev])
            
            // Show toast for new notifications
            toast({
              title: notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
              description: notification.message,
            })

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['offers'] })
            queryClient.invalidateQueries({ queryKey: ['pending-offers'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-stats'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [toast, queryClient])

  const markAsRead = async (notificationId: string) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.user.id)

    if (!error) {
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      )
    }
  }

  return {
    notifications,
    markAsRead,
    unreadCount: notifications.length
  }
}


import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'

export const useApplicationManagement = (offerId?: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase
      .channel('application-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_applications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['offer-applications'] })
          queryClient.invalidateQueries({ queryKey: ['user-application'] })
          queryClient.invalidateQueries({ queryKey: ['user-applications'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['offer-applications', offerId],
    queryFn: async () => {
      if (!offerId) return []
      
      const { data, error } = await supabase
        .from('offer_applications')
        .select(`
          *,
          profiles:applicant_id (
            username,
            avatar_url
          )
        `)
        .eq('offer_id', offerId)
      
      if (error) throw error
      return data
    },
    enabled: !!offerId
  })

  const { data: userApplication } = useQuery({
    queryKey: ['user-application', offerId],
    queryFn: async () => {
      if (!offerId) return null
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('offer_applications')
        .select('*')
        .eq('offer_id', offerId)
        .eq('applicant_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!offerId
  })

  // Get all applications for the current user
  const { data: userApplications } = useQuery({
    queryKey: ['user-applications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('offer_applications')
        .select('*')
        .eq('applicant_id', user.id)
      
      if (error) throw error
      return data
    }
  })

  const applyToOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('offer_applications')
        .insert({
          offer_id: offerId,
          applicant_id: user.id,
          status: 'pending'
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application submitted successfully",
      })
      queryClient.invalidateQueries({ queryKey: ['offer-applications'] })
      queryClient.invalidateQueries({ queryKey: ['user-application'] })
      queryClient.invalidateQueries({ queryKey: ['user-applications'] })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to submit application: " + error.message,
        variant: "destructive",
      })
    }
  })

  const updateApplicationStatus = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string, status: 'accepted' | 'rejected' }) => {
      // First, update the application status
      const { error: applicationError } = await supabase
        .from('offer_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
      
      if (applicationError) throw applicationError

      // If the application is accepted, update the offer status to 'booked'
      if (status === 'accepted') {
        // Get the offer_id from the application
        const { data: application, error: fetchError } = await supabase
          .from('offer_applications')
          .select('offer_id')
          .eq('id', applicationId)
          .single()

        if (fetchError) throw fetchError
        
        if (application && application.offer_id) {
          // Check the valid status values for the offers table
          const { data: offerData, error: offerFetchError } = await supabase
            .from('offers')
            .select('status')
            .eq('id', application.offer_id)
            .single()
            
          if (offerFetchError) throw offerFetchError

          // Update the offer status - make sure we're using a valid status value
          const { error: offerError } = await supabase
            .from('offers')
            .update({ 
              status: 'booked',  // Using 'booked' which should be a valid status
              updated_at: new Date().toISOString()
            })
            .eq('id', application.offer_id)

          if (offerError) {
            console.error("Error updating offer status:", offerError);
            throw new Error(`Failed to update offer status: ${offerError.message}`);
          }
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application status updated successfully",
      })
      queryClient.invalidateQueries({ queryKey: ['offer-applications'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['user-applications'] })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update application status: " + error.message,
        variant: "destructive",
      })
    }
  })

  return {
    applications,
    userApplication,
    userApplications,
    isLoadingApplications,
    applyToOffer: applyToOffer.mutate,
    updateApplicationStatus: updateApplicationStatus.mutate,
    isApplying: applyToOffer.isPending,
    isUpdating: updateApplicationStatus.isPending
  }
}

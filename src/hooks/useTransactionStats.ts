
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface TransactionStats {
  totalHours: number
  completedExchanges: number
  averageRating: number
  topService: string
}

export const useTransactionStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
      
      if (error) throw error

      // Calculate statistics from raw transaction data
      const totalHours = data.reduce((sum, tx) => sum + tx.hours, 0)
      const completedExchanges = data.length
      const averageRating = data.reduce((sum, tx) => sum + (tx.rating || 0), 0) / completedExchanges
      
      // Get most frequent service type
      const services = data.map(tx => tx.service)
      const topService = services.sort((a, b) =>
        services.filter(v => v === a).length - services.filter(v => v === b).length
      ).pop() || ''

      return {
        totalHours,
        completedExchanges,
        averageRating,
        topService
      } as TransactionStats
    }
  })

  return {
    stats,
    isLoading
  }
}

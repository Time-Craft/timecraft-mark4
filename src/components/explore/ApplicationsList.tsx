
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface ApplicationsListProps {
  applications: Array<{
    id: string
    status: string
    profiles?: {
      username: string
    }
  }>
  onUpdateStatus: (applicationId: string, status: 'accepted' | 'rejected') => void
  isUpdating: boolean
}

const ApplicationsList = ({ 
  applications, 
  onUpdateStatus,
  isUpdating
}: ApplicationsListProps) => {
  if (!applications || applications.length === 0) {
    return null
  }

  return (
    <div className="mt-4 border-t border-mint/20 pt-4">
      <h4 className="font-semibold mb-2 text-navy">Applications</h4>
      <div className="space-y-2">
        {applications.map((application) => (
          <div 
            key={application.id} 
            className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-mint/10 p-3 rounded-lg"
          >
            <span className="text-navy">{application.profiles?.username || 'Unknown User'}</span>
            {application.status === 'pending' && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => onUpdateStatus(application.id, 'accepted')}
                  disabled={isUpdating}
                  className="bg-teal hover:bg-teal/90 text-cream"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onUpdateStatus(application.id, 'rejected')}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {application.status !== 'pending' && (
              <span className={`capitalize ${
                application.status === 'accepted' ? 'text-green-500' : 'text-red-500'
              }`}>
                {application.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ApplicationsList

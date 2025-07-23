import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from './button'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  details?: string
  type?: 'error' | 'warning' | 'info'
  actionButton?: {
    text: string
    onClick: () => void
    variant?: 'default' | 'outline'
  }
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  type = 'error',
  actionButton
}: ErrorModalProps) {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          iconColor: 'text-red-500',
          accent: 'border-red-200',
          bgAccent: 'bg-red-50'
        }
      case 'warning':
        return {
          iconColor: 'text-yellow-500',
          accent: 'border-yellow-200',
          bgAccent: 'bg-yellow-50'
        }
      case 'info':
        return {
          iconColor: 'text-blue-500',
          accent: 'border-blue-200',
          bgAccent: 'bg-blue-50'
        }
      default:
        return {
          iconColor: 'text-red-500',
          accent: 'border-red-200',
          bgAccent: 'bg-red-50'
        }
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-6 h-6" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />
      case 'info':
        return <Info className="w-6 h-6" />
      default:
        return <AlertCircle className="w-6 h-6" />
    }
  }

  const styles = getTypeStyles()

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${styles.accent}`}>
          <div className="flex items-center space-x-3">
            <div className={`${styles.iconColor}`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">BMO Budget App</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            {message}
          </p>
          
          {details && (
            <div className={`${styles.bgAccent} border ${styles.accent} rounded-md p-4`}>
              <p className="text-sm text-gray-600">
                <strong>💡 Tip:</strong> {details}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {actionButton && (
            <Button
              onClick={() => {
                actionButton.onClick()
                onClose()
              }}
              variant={actionButton.variant || 'outline'}
              className="mr-auto"
            >
              {actionButton.text}
            </Button>
          )}
          <Button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
} 
import React, { useEffect } from 'react'
import { Check } from 'lucide-react'

interface CopyPopupProps {
  show: boolean
  onHide: () => void
  text?: string
}

const CopyPopup: React.FC<CopyPopupProps> = ({ show, onHide, text = "Copied!" }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [show, onHide])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-from-top">
      <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">{text}</span>
      </div>
    </div>
  )
}

export default CopyPopup
import React, { useState, useEffect, useRef } from 'react'
import { Keyboard, X } from 'lucide-react'

interface HotkeyInputProps {
  value: string
  onChange: (hotkey: string) => void
  placeholder?: string
  className?: string
}

const HotkeyInput: React.FC<HotkeyInputProps> = ({
  value,
  onChange,
  placeholder = "Click to set hotkey",
  className = ""
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])
  const inputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Handle ESC to cancel recording
      if (e.key === 'Escape') {
        setIsRecording(false)
        setRecordedKeys([])
        inputRef.current?.blur()
        return
      }

      // Collect modifier keys
      const modifiers: string[] = []
      if (e.ctrlKey) modifiers.push('Ctrl')
      if (e.altKey) modifiers.push('Alt')
      if (e.shiftKey) modifiers.push('Shift')
      if (e.metaKey) modifiers.push('Super') // Windows key

      // Get the main key (non-modifier)
      let mainKey = ''
      
      // Handle special keys and regular keys
      if (!['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key)) {
        // Handle function keys
        if (e.key.startsWith('F') && e.key.length <= 3) {
          mainKey = e.key
        }
        // Handle arrow keys
        else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          mainKey = e.key.replace('Arrow', '')
        }
        // Handle other special keys
        else if (['Enter', 'Space', 'Tab', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
          mainKey = e.key
        }
        // Handle regular character keys
        else if (e.key.length === 1) {
          mainKey = e.key.toUpperCase()
        }
        // Handle other keys
        else {
          mainKey = e.key
        }
      }

      // If we have a main key, complete the recording
      if (mainKey) {
        const hotkey = [...modifiers, mainKey].join('+')
        onChange(hotkey)
        setIsRecording(false)
        setRecordedKeys([])
        inputRef.current?.blur()
      } else {
        // Just show current modifiers
        setRecordedKeys(modifiers)
      }
    }

    // Also listen for keyup to handle cases where modifier is released
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isRecording) return
      
      // If only modifiers were pressed and released without a main key
      if (['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key)) {
        // Reset if no main key was pressed
        setTimeout(() => {
          if (isRecording) {
            setRecordedKeys([])
          }
        }, 100)
      } else {
        // Update modifier keys when released
        const keys: string[] = []
        if (e.ctrlKey) keys.push('Ctrl')
        if (e.altKey) keys.push('Alt')
        if (e.shiftKey) keys.push('Shift')
        if (e.metaKey) keys.push('Super')
        
        setRecordedKeys(keys)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [isRecording, onChange])

  const handleClick = () => {
    setIsRecording(true)
    setRecordedKeys([])
    inputRef.current?.focus()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const displayValue = isRecording 
    ? (recordedKeys.length > 0 ? recordedKeys.join('+') + '+...' : 'Press keys...')
    : value || placeholder

  return (
    <div className={`relative ${className}`}>
      <div
        ref={inputRef}
        onClick={handleClick}
        tabIndex={0}
        className={`
          input cursor-pointer flex items-center justify-between
          ${isRecording ? 'ring-2 ring-primary-500 border-primary-500' : ''}
          ${!value && !isRecording ? 'text-gray-500 dark:text-gray-400' : ''}
        `}
      >
        <div className="flex items-center space-x-2">
          <Keyboard className="h-4 w-4 text-gray-400" />
          <span className={isRecording ? 'text-primary-600 dark:text-primary-400' : ''}>
            {displayValue}
          </span>
        </div>
        
        {value && !isRecording && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Clear hotkey"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>
      
      {isRecording && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded text-xs text-primary-700 dark:text-primary-300">
          Press your desired key combination or ESC to cancel
        </div>
      )}
    </div>
  )
}

export default HotkeyInput
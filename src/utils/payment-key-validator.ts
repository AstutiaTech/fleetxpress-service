// Utility functions for payment key validation and masking

export const validatePaystackKey = (key: string, type: 'secret' | 'public'): boolean => {
  if (!key) return false
  if (type === 'secret') {
    return /^sk_(test|live)_[a-zA-Z0-9]{40,}$/.test(key)
  } else {
    return /^pk_(test|live)_[a-zA-Z0-9]{40,}$/.test(key)
  }
}

export const maskKey = (key: string | undefined): string => {
  if (!key || key.length < 8) return '***'
  return `${key.substring(0, 4)}${'*'.repeat(Math.max(0, key.length - 8))}${key.substring(key.length - 4)}`
}

export const getKeyPreview = (key: string | undefined, showFull: boolean = false): string => {
  if (!key) return ''
  if (showFull) return key
  return maskKey(key)
}


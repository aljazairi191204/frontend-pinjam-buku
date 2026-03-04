export function useBase64() {
  function guessMimeFromBase64(b64) {
    if (typeof b64 !== 'string') return 'image/png'
    if (b64.startsWith('iVBORw0')) return 'image/png'
    if (b64.startsWith('/9j/')) return 'image/jpeg'
    if (b64.startsWith('R0lGOD')) return 'image/gif'
    return 'image/png'
  }

  function b64ToDataUrl(raw) {
    if (!raw) return ''
    const mime = guessMimeFromBase64(raw)
    return `data:${mime};base64,${raw}`
  }

  function fileToBase64Raw(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return { b64ToDataUrl, fileToBase64Raw }
}
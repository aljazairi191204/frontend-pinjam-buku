export function useDateTime() {
  function fmtDateTime(d) {
    if (!d) return '-'
    const x = new Date(d)
    if (Number.isNaN(x.getTime())) return '-'
    return x.toLocaleString('id-ID', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return { fmtDateTime }
}
export const errorText = err => err?.response?.data?.error || err?.message || 'Something went wrong.'
export const dateTime = value => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value)) : '—'
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
export const initials = name => (name || 'U').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()

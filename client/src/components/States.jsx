export function Loading({ label = 'Loading your workspace…' }) { return <div className="state"><span className="spinner" />{label}</div> }
export function ErrorState({ message, retry }) { return <div className="state error-state"><span>{message}</span>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div> }
export function Empty({ title = 'Nothing here yet', detail = 'Your records will appear here.' }) { return <div className="empty"><span className="empty-mark">✳</span><strong>{title}</strong><p>{detail}</p></div> }

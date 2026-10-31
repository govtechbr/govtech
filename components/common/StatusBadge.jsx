export default function StatusBadge({ status = 'default', children }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {children}
    </span>
  )
}
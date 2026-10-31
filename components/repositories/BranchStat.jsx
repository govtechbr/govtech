export default function BranchStat({
  label,
  value,
  color = 'var(--text)',
}) {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '8px',
        background: 'var(--bg-alt)',
        textAlign: 'center',
      }}
    >
      <strong
        style={{
          display: 'block',
          color,
          fontSize: '24px',
        }}
      >
        {value}
      </strong>

      <small style={{ color: 'var(--muted)' }}>{label}</small>
    </div>
  )
}
export default function Brand({ compact = false }) {
  return (
    <a className={`brand ${compact ? 'brand-compact' : ''}`} href="/" aria-label="GovTech início">
      <span className="brand-mark">GT</span>

      <span className="brand-copy">
        <strong>GovTech</strong>

        {!compact && <small>IT GOVERNANCE PLATFORM</small>}
      </span>
    </a>
  )
}

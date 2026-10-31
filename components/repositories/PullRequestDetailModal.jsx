import ModalShell from '../common/ModalShell'

export default function PullRequestDetailModal({ pullRequest, onClose }) {
  return (
    <ModalShell
      onClose={onClose}
      title={`#${pullRequest.id} · ${pullRequest.title}`}
      subtitle="DETALHE DA PULL REQUEST"
      maxWidth="560px"
    >
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        {pullRequest.description}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '18px',
        }}
      >
        <div>
          <small style={{ color: 'var(--muted)' }}>Autor</small>
          <strong style={{ display: 'block', marginTop: '4px' }}>
            {pullRequest.author}
          </strong>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Repositório</small>
          <strong style={{ display: 'block', marginTop: '4px' }}>
            {pullRequest.repository}
          </strong>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Commits</small>
          <strong style={{ display: 'block', marginTop: '4px' }}>
            {pullRequest.commits}
          </strong>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Reviewers</small>
          <strong style={{ display: 'block', marginTop: '4px' }}>
            {pullRequest.reviewers.length}
          </strong>
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <small
          style={{
            display: 'block',
            marginBottom: '8px',
            color: 'var(--muted)',
          }}
        >
          LABELS
        </small>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '7px',
          }}
        >
          {pullRequest.labels.map((label) => (
            <span
              key={label}
              style={{
                padding: '5px 9px',
                borderRadius: '20px',
                background: 'var(--bg-alt)',
                fontSize: '12px',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '22px',
        }}
      >
        <button className="secondary-button small" onClick={onClose}>
          Fechar
        </button>
      </div>
    </ModalShell>
  )
}
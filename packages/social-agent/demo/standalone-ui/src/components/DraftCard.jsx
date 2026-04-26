import { Badge } from './Badge.jsx';
import { Icon } from './Icon.jsx';

export function DraftCard({ draft }) {
  const isLinkedIn = draft.tone === 'linkedin';

  return (
    <article className={`draft-card ${draft.tone}`}>
      <div className="draft-card-accent" />
      <div className="draft-card-body">
        <div className="draft-card-head">
          <div className="platform-title">
            <div className={isLinkedIn ? 'linkedin-mark' : 'x-mark'}>{draft.icon}</div>
            <div>
              <h3>{draft.platform}</h3>
              <p>
                {draft.wordCount} - {draft.readingTime}
              </p>
            </div>
          </div>
          <div className="badges">
            <Badge tone="success">{draft.risk}</Badge>
            <Badge tone="warning">{draft.status}</Badge>
          </div>
        </div>

        <div className={isLinkedIn ? 'draft-layout' : 'draft-layout compact'}>
          <div className="copy-stack">
            <section className="copy-block hook">
              <span>Hook</span>
              <p>{draft.hook}</p>
            </section>

            <section className="copy-block">
              <span>Body</span>
              {draft.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>

            <section className="copy-block cta">
              <span>Call to Action</span>
              <p>{draft.cta}</p>
              <p>{draft.hashtags}</p>
            </section>
          </div>

          {isLinkedIn ? (
            <aside className="asset-brief">
              <div className="asset-head">
                <span>Asset Brief</span>
                <Icon name="edit" />
              </div>
              <div className="asset-preview">
                <Icon name="image" />
                <span>Image generated from brief</span>
              </div>
              <p>A clean dashboard-style visual showing review gates, intake routing, and a human approval checkpoint.</p>
            </aside>
          ) : null}
        </div>
      </div>

      <footer className="draft-actions">
        <button type="button">Edit Directly</button>
        <button type="button">Approve Variation</button>
      </footer>
    </article>
  );
}

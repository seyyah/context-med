import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { Panel } from '../components/Panel.jsx';
import { metrics, reviewItems } from '../data/mockData.js';

const flow = [
  ['Workspace', 'Source context and comments enter the package.'],
  ['Plan', 'Platform schedule and review status are prepared.'],
  ['Drafts', 'LinkedIn and X copy is adapted for each channel.'],
  ['Moderation', 'Privacy, clinical, crisis, and spam signals are triaged.'],
  ['Review', 'Risky outputs wait for approval before export.']
];

export function OverviewPage() {
  return (
    <div className="page overview-page">
      <header className="page-header">
        <div>
          <span className="kicker">Social-Agent Standalone Demo</span>
          <h1>Overview</h1>
          <p>One workspace for source-backed social planning, platform drafts, moderation, review, and package export.</p>
        </div>
        <div className="page-actions">
          <button type="button">
            <Icon name="refresh" />
            Regenerate
          </button>
          <button className="primary" type="button">
            <Icon name="send" />
            Send to Review
          </button>
        </div>
      </header>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="overview-grid">
        <Panel kicker="Workflow" title="Package flow">
          <div className="flow-list">
            {flow.map(([title, description], index) => (
              <article className="flow-step" key={title}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel kicker="Current State" title="Review pressure">
          <div className="status-stack">
            <article>
              <Badge tone="danger">High Risk</Badge>
              <h3>Clinical and privacy guardrails</h3>
              <p>Questions about diagnosis, private patient details, and crisis signals are routed for human review.</p>
            </article>
            <article>
              <Badge tone="success">Ready</Badge>
              <h3>Platform adaptation</h3>
              <p>LinkedIn receives a professional narrative, while X receives a shorter post with direct framing.</p>
            </article>
            <article>
              <Badge tone="neutral">Local Package</Badge>
              <h3>Export boundary</h3>
              <p>The standalone demo prepares package output without direct publishing or writeback.</p>
            </article>
          </div>
        </Panel>
      </section>

      <Panel kicker="Queue Preview" title="Items waiting for decision">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Channel</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Quote</th>
              </tr>
            </thead>
            <tbody>
              {reviewItems.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td>{item.source}</td>
                  <td>{item.channel}</td>
                  <td>
                    <Badge tone={item.risk === 'High' ? 'danger' : 'warning'}>{item.risk}</Badge>
                  </td>
                  <td>{item.status}</td>
                  <td>{item.quote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

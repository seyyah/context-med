import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { Panel } from '../components/Panel.jsx';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

export function OverviewPage() {
  const { workflowState } = useWorkflowStore();
  const { contentPlans, drafts, packages, reviewQueueItems } = workflowState.snapshot;
  const allPlanSlots = contentPlans.flatMap((content) =>
    content.slots.map((slot) => ({
      ...slot,
      contentTitle: content.title
    }))
  );
  const platforms = [...new Set(contentPlans.flatMap((content) => content.platforms))];
  const highRiskSlots = allPlanSlots.filter((slot) => slot.risk === 'High');
  const highRiskReviews = reviewQueueItems.filter((item) => item.risk === 'High');
  const pendingReviewCount = reviewQueueItems.filter((item) => !['Approved', 'Closed'].includes(item.status)).length;
  const overviewMetrics = [
    { label: 'Content plans', value: String(contentPlans.length), detail: 'Loaded from workflow store' },
    { label: 'Draft slots', value: String(drafts.length || allPlanSlots.length), detail: `${platforms.join(' and ')} schedule outputs` },
    { label: 'Needs review', value: String(pendingReviewCount), detail: 'Plans, drafts, and review items' },
    { label: 'Package status', value: packages.length ? 'Ready' : 'Pending', detail: 'Store-backed export manifest' }
  ];
  const flow = [
    ['Workspace', `${workflowState.snapshot.workspaceRuns.length} source-backed workspace run is stored.`],
    ['Plan', `${allPlanSlots.length} scheduled platform slots are prepared across ${platforms.join(' and ')}.`],
    ['Drafts', `${drafts.length || allPlanSlots.length} editable platform drafts are available from stored plan slots.`],
    ['Review Queue', `${reviewQueueItems.length} review artifacts are available for manual approval decisions.`],
    ['Packages', `${packages.length} package manifest is prepared from stored workflow artifacts.`]
  ];
  const queuePreviewItems = [
    ...allPlanSlots
      .filter((slot) => slot.status !== 'Draft' || slot.risk === 'High')
      .slice(0, 4)
      .map((slot) => ({
        id: slot.id,
        source: 'Plan',
        channel: slot.platform,
        risk: slot.risk,
        status: slot.status,
        quote: `${slot.contentTitle}: ${slot.cta}`
      })),
    ...reviewQueueItems.slice(0, 3).map((item) => ({
      id: item.id,
      source: item.source,
      channel: item.platform,
      risk: item.risk,
      status: item.status,
      quote: item.reason
    }))
  ];

  return (
    <div className="page overview-page">
      <header className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Read-only summary connected to Workspace output, Plan queue, Drafts, Moderation, Review Queue, and package handoff.</p>
        </div>
      </header>

      <section className="metrics-grid">
        {overviewMetrics.map((metric) => (
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
              <p>{highRiskSlots.length + highRiskReviews.length} high-risk plan or review items are routed for human review.</p>
            </article>
            <article>
              <Badge tone="success">Ready</Badge>
              <h3>Platform adaptation</h3>
              <p>{platforms.join(' and ')} outputs are available from the shared Plan queue and Drafts workflow.</p>
            </article>
            <article>
              <Badge tone="neutral">Local Package</Badge>
              <h3>Export boundary</h3>
              <p>Packages are prepared locally; Writeback remains disabled until an integration target is selected.</p>
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
              {queuePreviewItems.slice(0, 6).map((item) => (
                <tr key={item.id}>
                  <td>{item.source}</td>
                  <td>{item.channel}</td>
                  <td>
                    <Badge tone={item.risk === 'High' ? 'danger' : item.risk === 'Low' ? 'success' : 'warning'}>{item.risk}</Badge>
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

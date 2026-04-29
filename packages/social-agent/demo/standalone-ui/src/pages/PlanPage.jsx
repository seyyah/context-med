import { useRef } from 'react';
import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { riskTone } from '../data/workflowData.js';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

function PlatformMark({ platform }) {
  const isLinkedIn = platform === 'LinkedIn';
  return <span className={isLinkedIn ? 'platform-mark linkedin-mark-small' : 'platform-mark x-mark-small'}>{isLinkedIn ? 'in' : 'X'}</span>;
}

export function PlanPage({ onNavigate }) {
  const { updateDrafts, updatePlan, workflowState } = useWorkflowStore();
  const contentQueueRef = useRef(null);
  const contentCardRefs = useRef({});
  const {
    selectedWeek,
    selectedPlatform,
    selectedContentId,
    selectedSlotId,
    regeneratedContentIds
  } = workflowState.plan;
  const contentPlans = workflowState.snapshot.contentPlans;
  const fallbackContent = contentPlans[0];
  const filteredContentPlans = contentPlans.filter((content) =>
    selectedPlatform === 'all' ? true : content.platforms.map((platform) => platform.toLowerCase()).includes(selectedPlatform)
  );
  const selectedContent = filteredContentPlans.find((content) => content.id === selectedContentId) || filteredContentPlans[0] || fallbackContent;
  const selectedPlan = selectedContent?.slots.find((slot) => slot.id === selectedSlotId) || selectedContent?.slots[0];

  if (!contentPlans.length || !selectedContent || !selectedPlan) {
    return (
      <div className="page plan-page original-plan-page">
        <div className="plan-title-row">
          <div>
            <h1>Weekly Content Plan</h1>
            <p>Generate Workspace output to create source-backed weekly plan records.</p>
          </div>
        </div>
        <section className="empty-workflow-state">
          <Icon name="calendar_today" />
          <h2>No stored content plans</h2>
          <p>Use Workspace to generate output. The pipeline will store content plans, draft slots, review items, and package manifests here.</p>
        </section>
      </div>
    );
  }

  function selectContent(contentId) {
    const nextContent = contentPlans.find((content) => content.id === contentId) || fallbackContent;

    updatePlan({
      selectedContentId: contentId,
      selectedSlotId: nextContent.slots[0].id
    });

    const container = contentQueueRef.current;
    const card = contentCardRefs.current[contentId];

    if (!container || !card) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const centeredLeft = container.scrollLeft + cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;

    container.scrollTo({
      behavior: 'smooth',
      left: Math.max(0, centeredLeft)
    });
  }

  function selectSlot(slotId) {
    updatePlan({ selectedSlotId: slotId });
  }

  function selectSlotWithKeyboard(event, slotId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectSlot(slotId);
    }
  }

  function changePlatform(event) {
    const nextPlatform = event.target.value;
    const nextContentPlans = contentPlans.filter((content) =>
      nextPlatform === 'all' ? true : content.platforms.map((platform) => platform.toLowerCase()).includes(nextPlatform)
    );
    const nextContent = nextContentPlans.find((content) => content.id === selectedContentId) || nextContentPlans[0] || fallbackContent;

    updatePlan({
      selectedPlatform: nextPlatform,
      selectedContentId: nextContent.id,
      selectedSlotId: nextContent.slots[0].id
    });
  }

  function regeneratePlan() {
    updatePlan((currentPlan) => ({
      ...currentPlan,
      regeneratedContentIds: currentPlan.regeneratedContentIds.includes(selectedContent.id)
        ? currentPlan.regeneratedContentIds
        : [...currentPlan.regeneratedContentIds, selectedContent.id],
      selectedSlotId: selectedContent.slots[0].id
    }));
  }

  function openDraft(slot = selectedPlan) {
    updatePlan({ selectedSlotId: slot.id });
    updateDrafts({
      selectedPlanId: selectedContent.id,
      selectedSlotId: slot.id
    });
    onNavigate?.('drafts');
  }

  return (
    <div className="page plan-page original-plan-page">
      <div className="plan-title-row">
        <div>
          <h1>Weekly Content Plan</h1>
          <p>Select a source content item, then review its weekly channel schedule.</p>
        </div>
        <div className="plan-filter-row">
          <label>
            <Icon name="calendar_today" />
            <select aria-label="Plan week" value={selectedWeek} onChange={(event) => updatePlan({ selectedWeek: event.target.value })}>
              <option value="current">Current Week</option>
              <option value="next">Next Week</option>
              <option value="backlog">Backlog</option>
            </select>
            <Icon name="arrow_drop_down" />
          </label>
          <label>
            <Icon name="filter_list" />
            <select aria-label="Plan platform" value={selectedPlatform} onChange={changePlatform}>
              <option value="all">Platform: All</option>
              <option value="linkedin">Platform: LinkedIn</option>
              <option value="x">Platform: X</option>
            </select>
            <Icon name="arrow_drop_down" />
          </label>
          <button className="primary" onClick={regeneratePlan} type="button">
            <Icon name="refresh" filled />
            Regenerate Plan
          </button>
        </div>
      </div>

      <section className="content-plan-panel">
        <header>
          <div>
            <span className="kicker">Content Queue</span>
            <h2>Source content ready for scheduling</h2>
          </div>
          <span>{filteredContentPlans.length} content items</span>
        </header>
        <div className="content-plan-grid" ref={contentQueueRef}>
          {filteredContentPlans.map((content) => (
            <button
              className={content.id === selectedContent.id ? 'content-plan-card selected' : 'content-plan-card'}
              key={content.id}
              onClick={() => selectContent(content.id)}
              ref={(node) => {
                contentCardRefs.current[content.id] = node;
              }}
              type="button"
            >
              <div className="content-plan-card-top">
                <span>{content.source}</span>
                <Badge tone={riskTone(content.risk)}>{content.risk} Risk</Badge>
              </div>
              <h3>{content.title}</h3>
              <p>{content.summary}</p>
              <footer>
                <strong>{content.priority}</strong>
                <span>{content.slots.length} scheduled slots</span>
              </footer>
            </button>
          ))}
        </div>
      </section>

      <div className="plan-workspace-grid">
        <section className="plan-table-card">
          <header className="weekly-plan-header">
            <div>
              <span className="kicker">Weekly Schedule</span>
              <h2>{selectedContent.title}</h2>
              <p>{selectedContent.summary}</p>
            </div>
            <div className="weekly-platform-list">
              {regeneratedContentIds.includes(selectedContent.id) ? <span className="regenerated-plan-badge">Regenerated</span> : null}
            </div>
          </header>
          <div className="table-wrap">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Publish Day</th>
                  <th>Channel</th>
                  <th>Content Pillar</th>
                  <th>Message Focus</th>
                  <th>Review Gate</th>
                  <th>Draft Package</th>
                </tr>
              </thead>
              <tbody>
                {selectedContent.slots.map((item, index) => (
                  <tr
                    aria-label={`Show rationale for ${item.day} ${item.platform}`}
                    className={item.id === selectedPlan.id ? 'selected-row' : ''}
                    key={item.id}
                    onClick={() => selectSlot(item.id)}
                    onKeyDown={(event) => selectSlotWithKeyboard(event, item.id)}
                    tabIndex={0}
                  >
                    <td>{item.day}</td>
                    <td>
                      <span className="platform-cell">
                        <PlatformMark platform={item.platform} />
                        {item.platform}
                      </span>
                    </td>
                    <td>
                      <strong>{item.pillar}</strong>
                      <span>{item.objective}</span>
                    </td>
                    <td>{item.focus} {item.cta}</td>
                    <td>
                      <div className="risk-stack">
                        <Badge tone={riskTone(item.risk)}>{item.risk} Risk</Badge>
                        {item.status !== 'Draft' ? <Badge>Review Req</Badge> : null}
                      </div>
                    </td>
                    <td>
                      <button
                        className="output-link"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDraft(item);
                        }}
                        type="button"
                      >
                        <Icon name="code" />
                        {selectedContent.id}_{item.platform.toLowerCase()}_{index + 1}.json
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="table-footer">
            <span>Showing {selectedContent.slots.length} scheduled draft slots for this content item</span>
            <div>
              <button type="button">
                <Icon name="chevron_left" />
              </button>
              <button type="button">
                <Icon name="chevron_right" />
              </button>
            </div>
          </footer>
        </section>

        <aside className="rationale-panel">
          <div>
            <div className="rationale-meta">
              <Badge tone="neutral">{selectedPlan.day}</Badge>
              <span>{selectedPlan.platform}</span>
            </div>
            <h2>Plan Rationale</h2>
            <p>Why this scheduled slot belongs on {selectedPlan.day} for {selectedPlan.platform}.</p>
          </div>

          <div className="rationale-stack">
            <article>
              <h3>
                <Icon name="insights" />
                Why this idea now?
              </h3>
              <p>{selectedPlan.focus} The planned CTA is: {selectedPlan.cta}</p>
            </article>
            <article>
              <h3>
                <Icon name="source" />
                Source context used
              </h3>
              <ul>
                <li>
                  <Icon name="description" />
                  {selectedContent.title}
                </li>
                <li>
                  <Icon name="hub" />
                  {selectedPlan.platform} adaptation for {selectedPlan.objective.toLowerCase()}
                </li>
                <li>
                  <Icon name="category" />
                  {selectedPlan.pillar}
                </li>
              </ul>
            </article>
            <article>
              <h3>
                <Icon name="format_paint" />
                Suggested format
              </h3>
              <p>{selectedPlan.platform === 'LinkedIn' ? 'Use a more explanatory professional narrative with source-backed context and a visible review boundary.' : 'Use a compact short-form version with one direct question and the highest-risk boundary kept visible.'} This row should hand off to Drafts as its own platform-specific package.</p>
            </article>
            <article className="risk-explanation">
              <h3>
                <Icon name="warning" />
                Risk explanation
              </h3>
              <p>{selectedPlan.risk === 'High' ? 'Review is required because this slot carries safety, privacy, trust, or clinical-boundary risk.' : selectedPlan.risk === 'Medium' ? 'Review is recommended because this slot still affects public messaging and channel fit.' : 'This is lower risk, but the final copy should still stay aligned with the source.'} Current status: {selectedPlan.status}.</p>
              <button onClick={() => openDraft(selectedPlan)} type="button">
                <Icon name="edit_note" />
                Open in Drafts
              </button>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}

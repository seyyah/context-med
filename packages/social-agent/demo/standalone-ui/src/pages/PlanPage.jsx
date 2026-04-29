import { useRef, useState } from 'react';
import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';

export const contentPlans = [
  {
    id: 'patient-intake',
    title: 'Patient intake dashboard update',
    source: 'Workspace output',
    summary: 'Operational visibility, faster routing, privacy-safe review, and human escalation boundaries.',
    priority: 'High priority',
    risk: 'High',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'patient-linkedin-01',
        platform: 'LinkedIn',
        day: 'Monday',
        pillar: 'Operational Visibility',
        objective: 'Engagement',
        focus: 'Frame the dashboard as workflow support for care coordination teams.',
        cta: 'Which review step creates the most friction for care coordination teams?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'patient-x-01',
        platform: 'X',
        day: 'Tuesday',
        pillar: 'Escalation Paths',
        objective: 'Awareness',
        focus: 'Condense privacy-safe intake review into a short guardrail-first post.',
        cta: 'What should teams check before posting intake workflow updates?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'patient-linkedin-02',
        platform: 'LinkedIn',
        day: 'Wednesday',
        pillar: 'Human Review',
        objective: 'Trust',
        focus: 'Explain why sensitive cases and unclear medical questions stay under human review.',
        cta: 'How do you keep operational automation under human oversight?',
        risk: 'High',
        status: 'Draft'
      },
      {
        id: 'patient-x-02',
        platform: 'X',
        day: 'Thursday',
        pillar: 'Care Operations',
        objective: 'Awareness',
        focus: 'Summarize faster routing without making clinical claims.',
        cta: 'Where should automation stop and review begin?',
        risk: 'High',
        status: 'Needs Review'
      }
    ]
  },
  {
    id: 'review-queue',
    title: 'Human review guardrails',
    source: 'Workspace output',
    summary: 'A follow-up angle from the same source focused on what stays under human review before publishing.',
    priority: 'Medium priority',
    risk: 'Medium',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'review-linkedin-01',
        platform: 'LinkedIn',
        day: 'Monday',
        pillar: 'Human Review',
        objective: 'Education',
        focus: 'Explain why sensitive cases, unclear medical questions, and crisis signals need visible human review.',
        cta: 'Which intake signals should never skip review?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'review-x-01',
        platform: 'X',
        day: 'Wednesday',
        pillar: 'Approval Workflow',
        objective: 'Engagement',
        focus: 'Turn human review into a short boundary-setting takeaway.',
        cta: 'What should always stay under human review?',
        risk: 'Medium',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'community-recap',
    title: 'Privacy-safe intake review',
    source: 'Workspace output',
    summary: 'A second Workspace-derived content angle focused on private patient details and safe public communication.',
    priority: 'Later this week',
    risk: 'Medium',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'community-linkedin-01',
        platform: 'LinkedIn',
        day: 'Friday',
        pillar: 'Privacy-Safe Review',
        objective: 'Trust',
        focus: 'Explain how private patient details stay out of public replies while teams still move faster.',
        cta: 'What privacy check should happen before an intake update is posted?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'community-x-01',
        platform: 'X',
        day: 'Friday',
        pillar: 'Privacy Boundaries',
        objective: 'Engagement',
        focus: 'Ask a short question about keeping private details out of public social replies.',
        cta: 'What should never appear in a public reply?',
        risk: 'Medium',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'care-team-tip',
    title: 'Faster routing for care teams',
    source: 'Workspace output',
    summary: 'A practical Workspace-derived post about reducing manual sorting while preserving escalation paths.',
    priority: 'Next week candidate',
    risk: 'Low',
    platforms: ['LinkedIn'],
    slots: [
      {
        id: 'care-tip-linkedin-01',
        platform: 'LinkedIn',
        day: 'Thursday',
        pillar: 'Care Operations',
        objective: 'Education',
        focus: 'Share one operational tip for routing intake messages without over-automating review.',
        cta: 'Where does manual review still matter most in intake work?',
        risk: 'Low',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'escalation-paths',
    title: 'Clear escalation paths',
    source: 'Workspace output',
    summary: 'A Workspace-derived angle about routing sensitive or unclear intake cases to the right internal workflow.',
    priority: 'Next week candidate',
    risk: 'High',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'escalation-linkedin-01',
        platform: 'LinkedIn',
        day: 'Tuesday',
        pillar: 'Escalation Paths',
        objective: 'Trust',
        focus: 'Explain how clear escalation paths help teams respond without over-claiming automation capability.',
        cta: 'Where should escalation be visible in an intake workflow?',
        risk: 'High',
        status: 'Needs Review'
      },
      {
        id: 'escalation-x-01',
        platform: 'X',
        day: 'Wednesday',
        pillar: 'Safety Workflow',
        objective: 'Awareness',
        focus: 'Summarize the need for escalation paths when intake messages include sensitive signals.',
        cta: 'What should trigger human escalation?',
        risk: 'High',
        status: 'Needs Review'
      }
    ]
  },
  {
    id: 'manual-sorting',
    title: 'Reduced manual sorting',
    source: 'Workspace output',
    summary: 'A practical content angle about reducing repetitive intake sorting while keeping review accountability intact.',
    priority: 'Backlog',
    risk: 'Low',
    platforms: ['LinkedIn'],
    slots: [
      {
        id: 'sorting-linkedin-01',
        platform: 'LinkedIn',
        day: 'Monday',
        pillar: 'Operational Efficiency',
        objective: 'Education',
        focus: 'Position reduced manual sorting as an operations improvement rather than a clinical decision system.',
        cta: 'Which intake sorting task creates the most repeated work?',
        risk: 'Low',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'privacy-checklist',
    title: 'Privacy review checklist',
    source: 'Workspace output',
    summary: 'A checklist-style content idea for keeping private patient details out of public social replies.',
    priority: 'Backlog',
    risk: 'Medium',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'privacy-checklist-linkedin-01',
        platform: 'LinkedIn',
        day: 'Thursday',
        pillar: 'Privacy-Safe Review',
        objective: 'Education',
        focus: 'Turn the source boundary into a short checklist for public social content review.',
        cta: 'What privacy check belongs in every social approval flow?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'privacy-checklist-x-01',
        platform: 'X',
        day: 'Friday',
        pillar: 'Privacy Boundaries',
        objective: 'Engagement',
        focus: 'Ask one direct question about privacy checks before posting public replies.',
        cta: 'What should be removed before a public reply goes live?',
        risk: 'Medium',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'not-a-diagnosis',
    title: 'Not a diagnosis message',
    source: 'Workspace output',
    summary: 'A boundary-setting content angle that makes clear the dashboard supports intake operations, not clinical judgment.',
    priority: 'Backlog',
    risk: 'High',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'diagnosis-linkedin-01',
        platform: 'LinkedIn',
        day: 'Tuesday',
        pillar: 'Clinical Boundaries',
        objective: 'Trust',
        focus: 'Clarify the difference between operational intake support and clinical diagnosis.',
        cta: 'How do you communicate automation boundaries clearly?',
        risk: 'High',
        status: 'Needs Review'
      },
      {
        id: 'diagnosis-x-01',
        platform: 'X',
        day: 'Thursday',
        pillar: 'Clinical Boundaries',
        objective: 'Awareness',
        focus: 'State the no-diagnosis boundary in a short post with a human-review reminder.',
        cta: 'What should automation never claim?',
        risk: 'High',
        status: 'Needs Review'
      }
    ]
  }
];

function PlatformMark({ platform }) {
  const isLinkedIn = platform === 'LinkedIn';
  return <span className={isLinkedIn ? 'platform-mark linkedin-mark-small' : 'platform-mark x-mark-small'}>{isLinkedIn ? 'in' : 'X'}</span>;
}

function riskTone(risk) {
  if (risk === 'High') {
    return 'danger';
  }

  if (risk === 'Medium') {
    return 'warning';
  }

  return 'success';
}

export function PlanPage() {
  const contentQueueRef = useRef(null);
  const contentCardRefs = useRef({});
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedContentId, setSelectedContentId] = useState(contentPlans[0].id);
  const [selectedSlotId, setSelectedSlotId] = useState(contentPlans[0].slots[0].id);
  const [regeneratedContentIds, setRegeneratedContentIds] = useState([]);
  const filteredContentPlans = contentPlans.filter((content) =>
    selectedPlatform === 'all' ? true : content.platforms.map((platform) => platform.toLowerCase()).includes(selectedPlatform)
  );
  const selectedContent = filteredContentPlans.find((content) => content.id === selectedContentId) || filteredContentPlans[0] || contentPlans[0];
  const selectedPlan = selectedContent.slots.find((slot) => slot.id === selectedSlotId) || selectedContent.slots[0];

  function selectContent(contentId) {
    const nextContent = contentPlans.find((content) => content.id === contentId) || contentPlans[0];

    setSelectedContentId(contentId);
    setSelectedSlotId(nextContent.slots[0].id);

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
    setSelectedSlotId(slotId);
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
    const nextContent = nextContentPlans.find((content) => content.id === selectedContentId) || nextContentPlans[0] || contentPlans[0];

    setSelectedPlatform(nextPlatform);
    setSelectedContentId(nextContent.id);
    setSelectedSlotId(nextContent.slots[0].id);
  }

  function regeneratePlan() {
    setRegeneratedContentIds((currentIds) =>
      currentIds.includes(selectedContent.id) ? currentIds : [...currentIds, selectedContent.id]
    );
    setSelectedSlotId(selectedContent.slots[0].id);
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
            <select aria-label="Plan week" value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)}>
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
                      <a className="output-link" href="#">
                        <Icon name="code" />
                        {selectedContent.id}_{item.platform.toLowerCase()}_{index + 1}.json
                      </a>
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
              <button type="button">
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

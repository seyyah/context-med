import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

function providerTone(provider) {
  if (provider?.live_api_calls_enabled) {
    return 'success';
  }

  if (provider?.fallback_reason) {
    return 'warning';
  }

  return provider?.provider === 'mock' ? 'neutral' : 'warning';
}

function keyStatus(config) {
  return [
    ['Gemini', config?.geminiApiKeyConfigured],
    ['Groq', config?.groqApiKeyConfigured],
    ['OpenRouter', config?.openRouterApiKeyConfigured]
  ];
}

export function SettingsPage() {
  const {
    providerStatus,
    refreshProviderStatus,
    resetWorkflow,
    storageStatus,
    workflowState
  } = useWorkflowStore();
  const provider = providerStatus?.provider || {};
  const requested = providerStatus?.requested || {};
  const storage = providerStatus?.storage || {};
  const counts = providerStatus?.workflow_counts || {};
  const metrics = workflowState.snapshot.metrics || {};

  return (
    <div className="settings-reference-page">
      <header className="settings-reference-header">
        <h1>Configuration</h1>
        <p>Inspect the active provider, SQLite store, workflow counts, and reset controls used by the standalone UI.</p>
      </header>

      <div className="settings-reference-grid">
        <div className="settings-form-column">
          <section className="settings-section-card">
            <header>
              <Icon name="api" />
              <h2>Provider Status</h2>
            </header>
            <div className="runtime-mode-grid">
              <article className="runtime-mode-card active">
                <Icon name="radio_button_checked" filled />
                <h3>{provider.label || 'Mock provider'}</h3>
                <p>
                  Active: <strong>{provider.provider || 'mock'}</strong> / requested:{' '}
                  <strong>{provider.requested_provider || requested.provider || 'mock'}</strong>
                </p>
                <Badge tone={providerTone(provider)}>
                  {provider.live_api_calls_enabled ? 'Live API ready' : provider.fallback_reason ? 'Fallback active' : 'Mock ready'}
                </Badge>
              </article>
              <article className="runtime-mode-card">
                <Icon name="memory" />
                <h3>{provider.model || requested.model || 'mock-deterministic-social-agent'}</h3>
                <p>
                  {provider.fallback_reason
                    ? `Fallback reason: ${provider.fallback_reason}.`
                    : provider.live_api_calls_enabled
                      ? 'API key is configured and live calls are enabled.'
                      : 'No API key is required for mock generation.'}
                </p>
              </article>
            </div>
          </section>

          <section className="settings-section-card">
            <header>
              <Icon name="vpn_key" />
              <h2>API Key Readiness</h2>
            </header>
            <div className="settings-status-grid">
              {keyStatus(requested).map(([label, configured]) => (
                <article key={label}>
                  <span>{label}</span>
                  <Badge tone={configured ? 'success' : 'neutral'}>{configured ? 'configured' : 'missing key'}</Badge>
                </article>
              ))}
            </div>
          </section>

          <section className="settings-section-card">
            <header>
              <Icon name="database" />
              <h2>Storage</h2>
            </header>
            <div className="settings-field-stack">
              <label>
                <span>SQLite Path</span>
                <div className="settings-input-with-icon">
                  <Icon name="folder" />
                  <input readOnly type="text" value={storage.dbPath || 'SQLite path unavailable'} />
                </div>
                <small>{storageStatus.message}</small>
              </label>
            </div>
          </section>

          <section className="settings-section-card">
            <header>
              <Icon name="schema" />
              <h2>Workflow Counts</h2>
            </header>
            <div className="settings-status-grid workflow-count-grid">
              <article>
                <span>Runs</span>
                <strong>{counts.workspaceRuns ?? workflowState.snapshot.workspaceRuns.length}</strong>
              </article>
              <article>
                <span>Plans</span>
                <strong>{counts.contentPlans ?? metrics.contentPlans ?? 0}</strong>
              </article>
              <article>
                <span>Drafts</span>
                <strong>{counts.drafts ?? metrics.draftSlots ?? 0}</strong>
              </article>
              <article>
                <span>Versions</span>
                <strong>{counts.draftVersions ?? metrics.draftVersions ?? 0}</strong>
              </article>
              <article>
                <span>Review Items</span>
                <strong>{counts.reviewItems ?? metrics.reviewItems ?? 0}</strong>
              </article>
              <article>
                <span>Packages</span>
                <strong>{metrics.packages ?? workflowState.snapshot.packages.length}</strong>
              </article>
            </div>
          </section>
        </div>

        <aside className="integration-status-card">
          <h2>Runtime Controls</h2>
          <ul>
            <li>
              <span className="integration-icon success">
                <Icon name="check" />
              </span>
              <div>
                <h3>Standalone CLI Mode</h3>
                <p>The UI reads and writes through the local social-agent server when it is running.</p>
              </div>
            </li>
            <li>
              <span className={`integration-icon ${provider.live_api_calls_enabled ? 'success' : 'primary'}`}>
                <Icon name="api" />
              </span>
              <div>
                <h3>{provider.live_api_calls_enabled ? 'Live provider ready' : 'Mock fallback available'}</h3>
                <p>AI integration can change providers without changing the UI data flow.</p>
              </div>
            </li>
            <li>
              <span className="integration-icon primary">
                <Icon name="storage" />
              </span>
              <div>
                <h3>{storage.backend || storageStatus.backend}</h3>
                <p>Workflow records are stored as workspace runs, plans, drafts, draft versions, and review items.</p>
              </div>
            </li>
          </ul>
          <footer>
            <button onClick={refreshProviderStatus} type="button">
              <Icon name="refresh" />
              Refresh Status
            </button>
            <button className="primary danger-button" onClick={resetWorkflow} type="button">
              <Icon name="delete_sweep" />
              Reset Stored Workflow
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}

import { Icon } from '../components/Icon.jsx';

const integrationItems = [
  ['check', 'CLI callable', 'System environment mapped to social-agent executable.', 'success'],
  ['check', 'JSON artifact output', 'Schema validation passing for package handoff.', 'success'],
  ['api', 'Future integration-ready', 'API hooks planned for a later connected workflow.', 'primary']
];

export function SettingsPage() {
  return (
    <div className="settings-reference-page">
      <header className="settings-reference-header">
        <h1>Configuration</h1>
        <p>Manage runtime behavior, knowledge sources, and output formatting for the standalone React UI.</p>
      </header>

      <div className="settings-reference-grid">
        <div className="settings-form-column">
          <section className="settings-section-card">
            <header>
              <Icon name="terminal" />
              <h2>Runtime Mode</h2>
            </header>
            <div className="runtime-mode-grid">
              <article className="runtime-mode-card active">
                <Icon name="radio_button_checked" filled />
                <h3>Standalone CLI</h3>
                <p>Execute social-agent locally through package scripts for testing, generation, and demo handoff.</p>
              </article>
              <article className="runtime-mode-card disabled">
                <Icon name="radio_button_unchecked" />
                <h3>Future Cerebra</h3>
                <p>Enterprise integration mode. Currently disabled until a connected system boundary is approved.</p>
                <span>Coming Soon</span>
              </article>
            </div>
          </section>

          <section className="settings-section-card">
            <header>
              <Icon name="menu_book" />
              <h2>Knowledge Source</h2>
            </header>
            <div className="settings-field-stack">
              <label>
                <span>Primary Corpus Path</span>
                <div className="settings-input-row">
                  <div className="settings-input-with-icon">
                    <Icon name="folder" />
                    <input readOnly type="text" value="packages/social-agent/demo/social-agent-source.md" />
                  </div>
                  <button type="button">Browse</button>
                </div>
                <small>Agent output should stay grounded in local source context and approved package documents.</small>
              </label>
            </div>
          </section>

          <section className="settings-section-card">
            <header>
              <Icon name="data_object" />
              <h2>Output &amp; Review Pipeline</h2>
            </header>
            <div className="settings-select-grid">
              <label>
                <span>Artifact Output Format</span>
                <div className="settings-select-wrap">
                  <select defaultValue="json">
                    <option value="json">Strict JSON Structure</option>
                    <option value="markdown">Markdown Document</option>
                    <option value="hybrid">JSON with Markdown payload</option>
                  </select>
                  <Icon name="expand_more" />
                </div>
              </label>
              <label>
                <span>Review Policy</span>
                <div className="settings-select-wrap">
                  <select defaultValue="risk-based">
                    <option value="risk-based">Risk-based automatic scoring</option>
                    <option value="manual">Manual approval queue</option>
                    <option value="bypass">Bypass for development only</option>
                  </select>
                  <Icon name="expand_more" />
                </div>
              </label>
              <label>
                <span>Generation Provider</span>
                <div className="settings-select-wrap">
                  <select defaultValue="local">
                    <option value="local">Local deterministic fallback</option>
                    <option value="gemini">Gemini API when configured</option>
                  </select>
                  <Icon name="expand_more" />
                </div>
              </label>
              <label>
                <span>Publishing Boundary</span>
                <div className="settings-select-wrap">
                  <select defaultValue="manual">
                    <option value="manual">Manual package handoff only</option>
                    <option value="direct" disabled>Direct publishing disabled</option>
                  </select>
                  <Icon name="expand_more" />
                </div>
              </label>
            </div>
          </section>
        </div>

        <aside className="integration-status-card">
          <h2>Integration Status</h2>
          <ul>
            {integrationItems.map(([icon, title, description, tone]) => (
              <li key={title}>
                <span className={`integration-icon ${tone}`}>
                  <Icon name={icon} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
          <footer>
            <button className="primary" type="button">
              <Icon name="save" />
              Save Configuration
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}

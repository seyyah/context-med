import { Icon } from './Icon.jsx';
import { PAGES } from '../data/navigation.js';

function Sidebar({ activePage, onPageChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="hub" filled />
        </div>
        <div>
          <h1>Social-Agent</h1>
          <p>CLI Operations</p>
        </div>
      </div>

      <nav className="nav-list" aria-label="Standalone UI sections">
        {PAGES.map((page) => (
          <button
            className={activePage === page.id ? 'nav-item active' : 'nav-item'}
            key={page.id}
            onClick={() => onPageChange(page.id)}
            type="button"
          >
            <Icon name={page.icon} filled={activePage === page.id} />
            <span>{page.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">A</div>
        <div>
          <p>Admin User</p>
          <span>System Access</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <label className="search">
        <Icon name="search" />
        <input placeholder="Search operations, drafts, or items..." />
      </label>

      <div className="topbar-status">
        <div>
          <span>Mode</span>
          <strong>Standalone CLI Mode</strong>
        </div>
        <div>
          <span>Status</span>
          <strong className="status-ready">
            <i />
            Integration-ready
          </strong>
        </div>
      </div>
    </header>
  );
}

export function Shell({ activePage, onPageChange, children }) {
  return (
    <>
      <Sidebar activePage={activePage} onPageChange={onPageChange} />
      <Topbar />
      <main className="app-content">{children}</main>
    </>
  );
}

import { useState } from 'react';
import { Shell } from './components/Shell.jsx';
import { OverviewPage } from './pages/OverviewPage.jsx';
import { WorkspacePage } from './pages/WorkspacePage.jsx';
import { PlanPage } from './pages/PlanPage.jsx';
import { DraftsPage } from './pages/DraftsPage.jsx';
import { ModerationPage } from './pages/ModerationPage.jsx';
import { ReviewQueuePage } from './pages/ReviewQueuePage.jsx';
import { PackagesPage } from './pages/PackagesPage.jsx';
import { WritebackPage } from './pages/WritebackPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { WorkflowStoreProvider } from './state/WorkflowStoreContext.jsx';

const pageComponents = {
  overview: OverviewPage,
  workspace: WorkspacePage,
  plan: PlanPage,
  drafts: DraftsPage,
  moderation: ModerationPage,
  reviewQueue: ReviewQueuePage,
  packages: PackagesPage,
  writeback: WritebackPage,
  settings: SettingsPage
};

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const ActivePage = pageComponents[activePage] ?? OverviewPage;

  return (
    <WorkflowStoreProvider>
      <Shell activePage={activePage} onPageChange={setActivePage}>
        <ActivePage onNavigate={setActivePage} />
      </Shell>
    </WorkflowStoreProvider>
  );
}

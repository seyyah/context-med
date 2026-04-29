import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { contentPlans, reviewQueueItems, sourceContext } from '../data/workflowData.js';
import {
  loadProviderStatus,
  loadWorkflowSnapshot,
  loadWorkflowState,
  resetWorkflowItems,
  saveWorkflowItem,
  saveWorkflowState
} from '../services/workflowStorageClient.js';

const defaultSelectedPlatforms = ['linkedin', 'x'];
const firstContent = contentPlans[0];
const firstSlot = firstContent.slots[0];

function createEmptyWorkspaceRun(sourceText = sourceContext, platforms = defaultSelectedPlatforms) {
  return {
    sourcePreview: sourceText.slice(0, 140),
    source: {
      text: sourceText,
      platforms
    },
    generation: {
      provider: 'mock',
      model: 'mock-deterministic-social-agent',
      status: 'not_run'
    },
    adaptations: [],
    planSeeds: [],
    draftSeeds: [],
    reviewItems: []
  };
}

function createPackagesFromContentPlans(plans) {
  return plans.map((plan, index) => ({
    id: `PKG-FALLBACK-${String(index + 1).padStart(2, '0')}`,
    task: `${plan.title} package`,
    platforms: plan.platforms.map((platform) => (platform === 'LinkedIn' ? 'in' : platform)),
    status: plan.risk === 'High' ? 'High Risk' : 'Ready',
    tone: plan.risk === 'High' ? 'danger' : 'success',
    manifest: {
      packageId: `PKG-FALLBACK-${String(index + 1).padStart(2, '0')}`,
      taskType: 'SOCIAL_AGENT_WORKFLOW',
      status: plan.risk === 'High' ? 'REVIEW_REQUIRED' : 'READY_FOR_HANDOFF',
      riskLevel: plan.risk.toLowerCase(),
      platforms: plan.platforms.map((platform) => platform.toUpperCase()),
      artifacts: [
        { type: 'CONTENT_PLAN', id: plan.id },
        ...plan.slots.map((slot) => ({ type: 'PLAN_SLOT', id: slot.id }))
      ],
      directPublishing: false
    }
  }));
}

function createFallbackSnapshot() {
  return {
    workspaceRuns: [],
    latestRun: null,
    contentPlans,
    drafts: [],
    draftVersions: [],
    reviewQueueItems,
    packages: createPackagesFromContentPlans(contentPlans),
    metrics: {
      contentPlans: contentPlans.length,
      draftSlots: contentPlans.reduce((total, plan) => total + plan.slots.length, 0),
      draftVersions: 0,
      reviewItems: reviewQueueItems.length,
      packages: contentPlans.length
    }
  };
}

function createEmptySnapshot() {
  return {
    workspaceRuns: [],
    latestRun: null,
    contentPlans: [],
    drafts: [],
    draftVersions: [],
    reviewQueueItems: [],
    packages: [],
    metrics: {
      contentPlans: 0,
      draftSlots: 0,
      draftVersions: 0,
      reviewItems: 0,
      packages: 0
    }
  };
}

function createDefaultWorkflowState() {
  return {
    snapshot: createFallbackSnapshot(),
    workspace: {
      source: sourceContext,
      selectedPlatforms: defaultSelectedPlatforms,
      run: createEmptyWorkspaceRun()
    },
    plan: {
      selectedWeek: 'current',
      selectedPlatform: 'all',
      selectedContentId: firstContent.id,
      selectedSlotId: firstSlot.id,
      regeneratedContentIds: []
    },
    drafts: {
      selectedPlanId: firstContent.id,
      selectedSlotId: firstSlot.id,
      draftEdits: {},
      statusBySlot: {}
    }
  };
}

function mergeWorkflowState(defaultState, storedState) {
  if (!storedState || typeof storedState !== 'object') {
    return defaultState;
  }

  return {
    ...defaultState,
    ...storedState,
    snapshot: defaultState.snapshot,
    workspace: {
      ...defaultState.workspace,
      ...storedState.workspace,
      selectedPlatforms: Array.isArray(storedState.workspace?.selectedPlatforms)
        ? storedState.workspace.selectedPlatforms
        : defaultState.workspace.selectedPlatforms,
      run: storedState.workspace?.run || defaultState.workspace.run
    },
    plan: {
      ...defaultState.plan,
      ...storedState.plan,
      regeneratedContentIds: Array.isArray(storedState.plan?.regeneratedContentIds)
        ? storedState.plan.regeneratedContentIds
        : defaultState.plan.regeneratedContentIds
    },
    drafts: {
      ...defaultState.drafts,
      ...storedState.drafts,
      draftEdits: storedState.drafts?.draftEdits || defaultState.drafts.draftEdits,
      statusBySlot: storedState.drafts?.statusBySlot || defaultState.drafts.statusBySlot
    }
  };
}

const WorkflowStoreContext = createContext(null);

export function WorkflowStoreProvider({ children }) {
  const [workflowState, setWorkflowState] = useState(createDefaultWorkflowState);
  const [storageStatus, setStorageStatus] = useState({
    backend: 'loading',
    message: 'Loading workflow storage.'
  });
  const [providerStatus, setProviderStatus] = useState(null);
  const loadedRef = useRef(false);

  const refreshProviderStatus = useCallback(async () => {
    const result = await loadProviderStatus();
    setProviderStatus(result.status);
    return result;
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const [result] = await Promise.all([
      loadWorkflowSnapshot(),
      refreshProviderStatus()
    ]);

    if (result.snapshot) {
      setWorkflowState((current) => ({
        ...current,
        snapshot: result.snapshot
      }));
    }

    setStorageStatus({
      backend: result.backend,
      message: result.message
    });

    return result;
  }, [refreshProviderStatus]);

  const persistWorkflowItem = useCallback(async (item) => {
    try {
      await saveWorkflowItem(item);
      await refreshSnapshot();
      return true;
    } catch (_error) {
      setStorageStatus({
        backend: 'browser',
        message: 'SQLite item API unavailable; item was not persisted.'
      });
      return false;
    }
  }, [refreshSnapshot]);

  const resetWorkflow = useCallback(async () => {
    const result = await resetWorkflowItems();
    await refreshProviderStatus();

    setWorkflowState((current) => ({
      ...current,
      snapshot: createEmptySnapshot(),
      workspace: {
        ...current.workspace,
        run: createEmptyWorkspaceRun(current.workspace.source, current.workspace.selectedPlatforms)
      },
      plan: {
        ...current.plan,
        selectedContentId: '',
        selectedSlotId: '',
        regeneratedContentIds: []
      },
      drafts: {
        ...current.drafts,
        selectedPlanId: '',
        selectedSlotId: '',
        draftEdits: {},
        statusBySlot: {}
      }
    }));
    setStorageStatus({
      backend: result.backend,
      message: result.message
    });

    return result;
  }, [refreshProviderStatus]);

  useEffect(() => {
    let active = true;

    async function loadStoredState() {
      const [snapshotResult, stateResult, providerResult] = await Promise.all([
        loadWorkflowSnapshot(),
        loadWorkflowState(),
        loadProviderStatus()
      ]);

      if (!active) {
        return;
      }

      setWorkflowState((current) => {
        const merged = stateResult.payload ? mergeWorkflowState(current, stateResult.payload) : current;

        return {
          ...merged,
          snapshot: snapshotResult.snapshot || merged.snapshot
        };
      });
      setStorageStatus({
        backend: snapshotResult.backend === 'sqlite' ? 'sqlite' : stateResult.backend,
        message: snapshotResult.snapshot ? snapshotResult.message : stateResult.message
      });
      setProviderStatus(providerResult.status);
      loadedRef.current = true;
    }

    loadStoredState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      const { snapshot: _snapshot, ...persistableState } = workflowState;
      const result = await saveWorkflowState(persistableState);
      setStorageStatus({
        backend: result.backend,
        message: result.message
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [workflowState]);

  const updateWorkspace = useCallback((updater) => {
    setWorkflowState((current) => ({
      ...current,
      workspace: typeof updater === 'function' ? updater(current.workspace) : { ...current.workspace, ...updater }
    }));
  }, []);

  const updatePlan = useCallback((updater) => {
    setWorkflowState((current) => ({
      ...current,
      plan: typeof updater === 'function' ? updater(current.plan) : { ...current.plan, ...updater }
    }));
  }, []);

  const updateDrafts = useCallback((updater) => {
    setWorkflowState((current) => ({
      ...current,
      drafts: typeof updater === 'function' ? updater(current.drafts) : { ...current.drafts, ...updater }
    }));
  }, []);

  const value = useMemo(
    () => ({
      persistWorkflowItem,
      refreshSnapshot,
      resetWorkflow,
      refreshProviderStatus,
      workflowState,
      storageStatus,
      providerStatus,
      updateWorkspace,
      updatePlan,
      updateDrafts
    }),
    [persistWorkflowItem, providerStatus, refreshProviderStatus, refreshSnapshot, resetWorkflow, storageStatus, updateDrafts, updatePlan, updateWorkspace, workflowState]
  );

  return <WorkflowStoreContext.Provider value={value}>{children}</WorkflowStoreContext.Provider>;
}

export function useWorkflowStore() {
  const context = useContext(WorkflowStoreContext);

  if (!context) {
    throw new Error('useWorkflowStore must be used within WorkflowStoreProvider.');
  }

  return context;
}

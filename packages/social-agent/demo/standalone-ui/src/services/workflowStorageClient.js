const WORKFLOW_STATE_ID = 'standalone-ui-workflow-state';
const LOCAL_STORAGE_KEY = 'social-agent.workflow-state';
const API_BASE = import.meta.env.VITE_SOCIAL_AGENT_API_BASE || '/api';

async function readJson(response) {
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Workflow storage request failed with ${response.status}`);
  }

  return response.json();
}

function loadLocalWorkflowState() {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (_error) {
    return null;
  }
}

function saveLocalWorkflowState(payload) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // Browser storage can be unavailable in private or restricted contexts.
  }
}

function clearLocalWorkflowState() {
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (_error) {
    // Browser storage can be unavailable in private or restricted contexts.
  }
}

export async function loadWorkflowState() {
  try {
    const response = await fetch(`${API_BASE}/workflow-items/${encodeURIComponent(WORKFLOW_STATE_ID)}`, {
      headers: { accept: 'application/json' }
    });
    const data = await readJson(response);

    if (!data) {
      return {
        backend: 'sqlite',
        found: false,
        payload: null,
        message: 'SQLite store is ready; no saved UI state yet.'
      };
    }

    return {
      backend: 'sqlite',
      found: true,
      payload: data.item.payload,
      message: 'Loaded from SQLite workflow store.'
    };
  } catch (_error) {
    return {
      backend: 'browser',
      found: Boolean(loadLocalWorkflowState()),
      payload: loadLocalWorkflowState(),
      message: 'SQLite API unavailable; using browser session fallback.'
    };
  }
}

export async function saveWorkflowState(payload) {
  const item = {
    id: WORKFLOW_STATE_ID,
    type: 'workflow_state',
    title: 'Standalone UI workflow state',
    status: 'active',
    payload
  };

  try {
    const response = await fetch(`${API_BASE}/workflow-items`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    await readJson(response);

    return {
      backend: 'sqlite',
      message: 'Saved to SQLite workflow store.'
    };
  } catch (_error) {
    saveLocalWorkflowState(payload);

    return {
      backend: 'browser',
      message: 'SQLite API unavailable; saved to browser session fallback.'
    };
  }
}

export async function loadWorkflowSnapshot() {
  try {
    const response = await fetch(`${API_BASE}/workflow-snapshot`, {
      headers: { accept: 'application/json' }
    });
    const data = await readJson(response);

    return {
      backend: 'sqlite',
      snapshot: data.snapshot,
      message: 'Loaded workflow snapshot from SQLite.'
    };
  } catch (_error) {
    return {
      backend: 'browser',
      snapshot: null,
      message: 'SQLite snapshot API unavailable; using browser fallback data.'
    };
  }
}

export async function loadProviderStatus() {
  try {
    const response = await fetch(`${API_BASE}/provider-status`, {
      headers: { accept: 'application/json' }
    });
    const data = await readJson(response);

    return {
      backend: 'sqlite',
      status: data,
      message: 'Loaded provider status from the local social-agent server.'
    };
  } catch (_error) {
    return {
      backend: 'browser',
      status: {
        type: 'provider_status',
        provider: {
          provider: 'mock',
          requested_provider: 'mock',
          label: 'Mock provider',
          model: 'mock-deterministic-social-agent',
          status: 'browser_fallback',
          fallback_reason: 'provider_status_api_unavailable',
          requires_api_key: false,
          api_key_configured: false,
          live_api_calls_enabled: false
        },
        requested: {
          provider: 'mock',
          model: '',
          geminiApiKeyConfigured: false,
          groqApiKeyConfigured: false,
          openRouterApiKeyConfigured: false
        },
        storage: {
          backend: 'browser',
          dbPath: 'Unavailable until the CLI server is running.'
        },
        workflow_counts: {
          workspaceRuns: 0,
          contentPlans: 0,
          drafts: 0,
          draftVersions: 0,
          reviewItems: 0,
          workflowState: 0
        }
      },
      message: 'Provider status API unavailable; showing mock browser fallback.'
    };
  }
}

export async function saveWorkflowItem(item) {
  const response = await fetch(`${API_BASE}/workflow-items`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify(item)
  });
  return readJson(response);
}

export async function resetWorkflowItems() {
  try {
    const response = await fetch(`${API_BASE}/workflow-items?scope=workflow`, {
      method: 'DELETE',
      headers: { accept: 'application/json' }
    });
    const data = await readJson(response);

    return {
      backend: 'sqlite',
      payload: data,
      message: 'Workflow records cleared from SQLite.'
    };
  } catch (_error) {
    clearLocalWorkflowState();

    return {
      backend: 'browser',
      payload: null,
      message: 'SQLite API unavailable; cleared browser workflow fallback.'
    };
  }
}

import { generateWorkspaceRun } from './mockWorkspaceGenerator.js';

const API_BASE = import.meta.env.VITE_SOCIAL_AGENT_API_BASE || '/api';

export async function runWorkspacePipeline({ sourceText, platforms }) {
  try {
    const response = await fetch(`${API_BASE}/workspace-runs`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sourceText,
        platforms
      })
    });

    if (!response.ok) {
      throw new Error(`Workspace pipeline request failed with ${response.status}`);
    }

    const payload = await response.json();

    return {
      backend: 'api',
      run: payload.run,
      message: 'Workspace pipeline generated and saved through SQLite API.'
    };
  } catch (_error) {
    return {
      backend: 'browser',
      run: generateWorkspaceRun({ sourceText, platforms }),
      message: 'Workspace pipeline API unavailable; generated with browser mock fallback.'
    };
  }
}

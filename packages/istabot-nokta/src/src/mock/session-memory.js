/**
 * Mock Session Memory — ISTABOT'un project-level persistent memory simülasyonu.
 * Gerçek entegrasyonda PostgreSQL + Redis'e yazılır/okunur.
 *
 * In-memory Map kullanır — process yeniden başladığında sıfırlanır.
 * Demo ve test için yeterlidir.
 */

const store = new Map();

/**
 * @param {string} projectId
 * @returns {Session}
 */
export function getSession(projectId) {
  if (!store.has(projectId)) {
    store.set(projectId, createEmptySession(projectId));
  }
  return store.get(projectId);
}

/**
 * @param {string} projectId
 * @param {Partial<Session>} updates
 * @returns {Session}
 */
export function updateSession(projectId, updates) {
  const session = getSession(projectId);
  const updated = deepMerge(session, updates);
  updated.updatedAt = new Date().toISOString();
  store.set(projectId, updated);
  return updated;
}

/**
 * Konuşma geçmişine mesaj ekle
 *
 * @param {string} projectId
 * @param {"user"|"nokta"} role
 * @param {string} content
 */
export function addMessage(projectId, role, content) {
  const session = getSession(projectId);
  session.conversationHistory.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  session.updatedAt = new Date().toISOString();
  store.set(projectId, session);
  return session;
}

/**
 * Faz tamamlandı olarak işaretle
 *
 * @param {string} projectId
 * @param {"DISCOVER"|"DESIGN"|"EXECUTE"|"PUBLISH"} phase
 * @param {object} artifact - Fazın çıktısı
 */
export function completePhase(projectId, phase, artifact) {
  const session = getSession(projectId);
  const milestone = session.milestones.find((m) => m.phase === phase);
  if (milestone) {
    milestone.status = "completed";
    milestone.completedAt = new Date().toISOString();
    milestone.artifact = artifact;
  }
  session.currentPhase = nextPhase(phase);
  session.updatedAt = new Date().toISOString();
  store.set(projectId, session);
  return session;
}

/**
 * Tüm session'ları listele (debug için)
 */
export function listSessions() {
  return Array.from(store.values());
}

/**
 * Session'ı sıfırla
 */
export function clearSession(projectId) {
  store.delete(projectId);
}

// --- Helpers ---

function createEmptySession(projectId) {
  return {
    projectId,
    title: null,
    currentPhase: "DISCOVER",
    persona: null,
    domain: null,
    conversationHistory: [],
    artifacts: {
      discover: null,
      design: null,
      execute: null,
      publish: null,
    },
    decisions: {
      sampleSize: null,
      selectedScales: [],
      statisticalTest: null,
      targetJournal: null,
    },
    milestones: [
      { phase: "DISCOVER", status: "pending", completedAt: null, artifact: null },
      { phase: "DESIGN",   status: "pending", completedAt: null, artifact: null },
      { phase: "EXECUTE",  status: "pending", completedAt: null, artifact: null },
      { phase: "PUBLISH",  status: "pending", completedAt: null, artifact: null },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function nextPhase(current) {
  const order = ["DISCOVER", "DESIGN", "EXECUTE", "PUBLISH"];
  const idx = order.indexOf(current);
  return order[idx + 1] ?? "PUBLISH";
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

import { loadEnv } from "./env.js";
loadEnv();

export { discover } from "./phases/discover.js";
export { design } from "./phases/design.js";
export { execute } from "./phases/execute.js";
export { publish } from "./phases/publish.js";
export { pipeline } from "./pipeline.js";

// Mock services — demo ve entegrasyon öncesi için
export { searchLiterature } from "./mock/acavibe.js";
export { getScales, getScaleById } from "./mock/scale-module.js";
export { powerAnalysis, logisticRegression, descriptiveStats } from "./mock/r-engine.js";
export { getSession, updateSession, addMessage, completePhase, listSessions, clearSession } from "./mock/session-memory.js";

import { SCALES } from "../data/scales.js";

/**
 * Mock Scale Module — ISTABOT'un valideli ölçek kataloğu.
 * Gerçek entegrasyonda PostgreSQL'den çekilir.
 *
 * @param {string} domain - Klinik alan
 * @param {object} options
 * @param {boolean} [options.validatedTrOnly=true] - Sadece Türkçe validasyonu olanlar
 * @param {number} [options.maxItems] - Maksimum madde sayısı filtresi
 * @returns {{ scales: Scale[], recommended: Scale[] }}
 */
export function getScales(domain, options = {}) {
  const { validatedTrOnly = true, maxItems } = options;

  const filtered = SCALES
    .filter((s) => s.domain.includes(domain))
    .filter((s) => !validatedTrOnly || s.validatedTr)
    .filter((s) => !maxItems || s.items <= maxItems);

  return {
    scales: filtered,
    recommended: filtered.filter((s) => s.recommended),
    totalAvailable: filtered.length,
  };
}

/**
 * @param {string} id - Ölçek ID'si (örn. "ohip-14")
 * @returns {Scale|null}
 */
export function getScaleById(id) {
  return SCALES.find((s) => s.id === id) ?? null;
}

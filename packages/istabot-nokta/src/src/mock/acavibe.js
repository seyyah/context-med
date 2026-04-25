import { PAPERS } from "../data/papers.js";

/**
 * Mock AcaVibe — PubMed / Semantic Scholar tarama simülasyonu.
 * Gerçek AcaVibe entegrasyonunda bu fonksiyon PubMed API'ye istek atar.
 *
 * @param {string[]} keywords - Arama terimleri
 * @param {object} options
 * @param {string} [options.domain] - Klinik alan filtresi
 * @param {number} [options.limit=5] - Maksimum sonuç sayısı
 * @param {number} [options.minYear=2020] - Minimum yayın yılı
 * @param {number} [options.minIF=0] - Minimum impact factor
 * @returns {{ papers: Paper[], gap: string, totalFound: number }}
 */
export function searchLiterature(keywords = [], options = {}) {
  const { domain, limit = 5, minYear = 2020, minIF = 0 } = options;

  const normalizedKeywords = keywords.map((k) => k.toLowerCase().trim());

  const scored = PAPERS
    .filter((p) => p.year >= minYear && p.impactFactor >= minIF)
    .filter((p) => !domain || p.domain.includes(domain))
    .map((p) => {
      const text = `${p.title} ${p.keywords.join(" ")} ${p.abstract}`.toLowerCase();
      const score = normalizedKeywords.reduce(
        (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
        0
      );
      return { ...p, _score: score };
    })
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score || b.citedBy - a.citedBy)
    .slice(0, limit)
    .map(({ _score, ...p }) => p);

  const gaps = [...new Set(scored.map((p) => p.gap))].filter(Boolean);
  const primaryGap = gaps[0] ?? "Bu alanda Türk popülasyonunda kapsamlı çalışma bulunmamaktadır.";

  return {
    papers: scored,
    gap: primaryGap,
    totalFound: scored.length,
    searchedAt: new Date().toISOString(),
  };
}

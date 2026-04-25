import { searchLiterature } from "../../src/mock/acavibe.js";

describe("searchLiterature (mock AcaVibe)", () => {
  it("returns papers matching keywords", () => {
    const result = searchLiterature(["diabetes", "implant"]);
    expect(result.papers.length).toBeGreaterThan(0);
    expect(result.totalFound).toBeGreaterThan(0);
    expect(result.gap).toBeTruthy();
    expect(result.searchedAt).toBeTruthy();
  });

  it("filters by domain", () => {
    const result = searchLiterature(["anxiety"], { domain: "psychiatry" });
    result.papers.forEach((p) => expect(p.domain).toContain("psychiatry"));
  });

  it("respects limit option", () => {
    const result = searchLiterature(["diabetes"], { limit: 2 });
    expect(result.papers.length).toBeLessThanOrEqual(2);
  });

  it("returns empty when no keywords match", () => {
    const result = searchLiterature(["xyznonexistentterm123"]);
    expect(result.papers.length).toBe(0);
    expect(result.gap).toBeTruthy(); // fallback gap mesajı
  });

  it("sorts by relevance score then citedBy", () => {
    const result = searchLiterature(["diabetes", "implant", "smoking"]);
    const citedBys = result.papers.map((p) => p.citedBy);
    expect(citedBys[0]).toBeGreaterThanOrEqual(citedBys[citedBys.length - 1]);
  });
});

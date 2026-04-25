/**
 * Structured context'ten her IMRAD bölümü için kaynak direktifi üretir.
 * context yoksa boş string döner (backward-compatible).
 */
function buildContextBlock(context) {
  if (!context) return "";

  const lines = [];

  const d = context.discover;
  if (d) {
    lines.push("## DISCOVER fazından gelen veriler");
    if (d.researchQuestion) lines.push(`- Araştırma sorusu: ${d.researchQuestion}`);
    if (d.literatureGap)    lines.push(`- Literatür boşluğu: ${d.literatureGap}`);
    if (d.methodology)      lines.push(`- Önerilen metodoloji: ${d.methodology}`);
    if (d.pico) {
      const { P, I, C, O } = d.pico;
      lines.push(`- PICO: P="${P}" I="${I}" C="${C}" O="${O}"`);
    }
  }

  const de = context.design;
  if (de) {
    lines.push("## DESIGN fazından gelen veriler");
    if (de.studyDesign?.type)               lines.push(`- Çalışma tipi: ${de.studyDesign.type}`);
    if (de.studyDesign?.inclusionCriteria)  lines.push(`- Dahil kriterleri: ${de.studyDesign.inclusionCriteria}`);
    if (de.studyDesign?.exclusionCriteria)  lines.push(`- Dışlama kriterleri: ${de.studyDesign.exclusionCriteria}`);
    if (de.powerAnalysis) {
      const pa = de.powerAnalysis;
      lines.push(`- Örneklem: min ${pa.minimumN}, hedef ${pa.targetN} (α=${pa.alpha}, power=${pa.power})`);
    }
    if (de.scales?.length) {
      const names = de.scales.map(s => s.name).join(", ");
      lines.push(`- Kullanılan ölçekler: ${names}`);
    }
    if (de.dataCollection?.method) lines.push(`- Veri toplama yöntemi: ${de.dataCollection.method}`);
  }

  const ex = context.execute;
  if (ex) {
    lines.push("## EXECUTE fazından gelen veriler");
    if (ex.testSelection?.primaryTest) lines.push(`- Kullanılan test: ${ex.testSelection.primaryTest}`);
    if (ex.testSelection?.rationale)   lines.push(`- Test gerekçesi: ${ex.testSelection.rationale}`);
    if (ex.dataDiagnostics?.distributionType) lines.push(`- Dağılım tipi: ${ex.dataDiagnostics.distributionType}`);
    if (ex.analysisplan?.dependentVariable)   lines.push(`- Bağımlı değişken: ${ex.analysisplan.dependentVariable}`);
    if (ex.analysisplan?.independentVariables?.length) {
      lines.push(`- Bağımsız değişkenler: ${ex.analysisplan.independentVariables.join(", ")}`);
    }
    if (ex.interpretationGuide?.limitations) lines.push(`- Sınırlılıklar: ${ex.interpretationGuide.limitations}`);
  }

  if (!lines.length) return "";

  return `
Aşağıda önceki fazlardan gelen yapılandırılmış veriler var. IMRAD bölümlerini yazarken bu verileri doğrudan kullan:

${lines.join("\n")}

Direktifler:
- Introduction → DISCOVER fazındaki literatür boşluğunu ve PICO'yu kullan
- Methods → DESIGN fazındaki çalışma tipi, örneklem büyüklüğü ve ölçekleri kullan
- Results → EXECUTE fazındaki test adını ve analiz planını referans al
- Discussion → EXECUTE'taki sınırlılıkları ve DISCOVER'daki metodoloji önerisini kullan
`;
}

export function buildPublishPrompt({ language = "tr", context = null }) {
  const langInstruction =
    language === "tr" ? "Yanıtını Türkçe ver." : "Respond in English.";

  const contextBlock = buildContextBlock(context);

  return `Sen NOKTA'sın — MRLC PUBLISH fazı uzmanısın.

${langInstruction}
${contextBlock}
Kullanıcı sana araştırmasının bağlamını verecek. Buna göre şunları üret:

1. **IMRAD Taslağı**
   - Introduction: literatür boşluğu ve araştırma gerekçesi
   - Methods: çalışma tasarımı, örneklem, ölçekler, analiz yöntemi
   - Results: temel bulgular (sayısal değerler dahil)
   - Discussion: bulguların yorumu, literatürle karşılaştırma, sınırlılıklar

2. **Referans Listesi**
   - 6-10 adet akademik kaynak, APA 7 formatında
   - Her kaynak için: yazarlar, yıl, başlık, dergi, cilt/sayı/sayfa, DOI (varsa)
   - Kaynaklar metin içinde atıflarla tutarlı olmalı

3. **Dergi Önerisi**
   - 2-3 hedef dergi: isim, impact factor, kapsam uyum skoru (0-100), submission notu

4. **Başlık Önerisi**
   - 2 alternatif manuscript başlığı

Yanıtını aşağıdaki JSON formatında ver (başka hiçbir şey ekleme, sadece JSON):

{
  "manuscript": {
    "title": "...",
    "introduction": "...",
    "methods": "...",
    "results": "...",
    "discussion": "..."
  },
  "references": [
    {
      "authors": "Soyadı A, Soyadı B",
      "year": 2023,
      "title": "Makale başlığı",
      "journal": "Journal Name",
      "volume": "12",
      "issue": "3",
      "pages": "45-58",
      "doi": "10.xxxx/xxxxx"
    }
  ],
  "titleAlternatives": ["...", "..."],
  "journalRecommendations": [
    {
      "name": "...",
      "impactFactor": 0.0,
      "scopeMatchScore": 85,
      "submissionNote": "..."
    }
  ]
}`;
}

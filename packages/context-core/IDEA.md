# context-core

*Ham kaynaktan (PDF, URL, ses, tez planı) context-wiki derleme, intent sınıflandırma ve çıktı modüllerine (context-va, context-paper, context-slides ve ekosistem eklentilerine) yönlendirme zincirinin paylaşılan altyapısı ve koordinatörü.*

> Bu belge IDEA standardını takip eder. Alt-sistemlerin içeriğini tekrar etmez; yalnızca aralarındaki bağı, paylaşılan altyapıyı ve orkestrasyon mantığını tanımlar. context-va, context-paper, context-slides ve context-wiki detayları kendi dosyalarında yaşar — buraya referans verilir, kopyalanmaz.

---

## 1. Tez (Thesis)

context-va, context-paper ve context-slides üçü de aynı soruyu farklı biçimlerde çözer: ham araştırma girdisini belirli bir çıktı formatına dönüştür. Üçü de aynı alt-katmana ihtiyaç duyar:

1. Kaynak güvenilir biçimde ingest edilmeli
2. Bilgi bir micro-wiki'de derlenmeli (rag-wiki örüntüsü)
3. Kullanıcının ne istediği sınıflandırılmalı
4. Doğru jeneratöre yönlendirilmeli

Bu dört adım hiçbir alt-sistemin kendi dosyasında tanımlanmamıştır. Nexus bu dört adımı tanımlar. Geri kalan her şey kendi dosyasında yaşar.

**Temel değer önermesi:** Araştırmacı kaynağı yükler, ne istediğini söyler; context-core doğru modülü çalıştırır ve zinciri koordine eder. context-va, context-paper ve context-slides, context-core olmadan da çalışır — ama context-core olmadan kaynak ingest, wiki derleme ve zincir koordinasyonu her biri için ayrı ayrı yeniden kurulur.

---

## 2. Paylaşılan Altyapı

context-med'un altyapısı soldan sağa dört katmandan oluşur. Her katmanın ayrı bir dosyası vardır; burada yalnızca sınırları ve sırası tanımlanır:

```
Ham Kaynak
  └─► [1] context-shield  — PII maskeleme, edge-AI, sıfır güven
        └─► [2] context-gate — SWOT, HITL, provenans manifest → raw/
              └─► [3] context-wiki — micro-wiki derleme, operational-schema
                    └─► [4] context-core — sınıflandırma + modül route
```

### 2.0 Privacy Envelope — bp-privacy Entegrasyonu

Hassas alan kullanımlarında (context-paper / klinik tez, hukuki analiz, finansal rapor) kaynak pipeline'a girmeden önce `context-shield` katmanı çalışır. Detaylar `bp-privacy.md`'de tanımlıdır; context-core'un bilmesi gereken tek şey:

```
raw_input → context-shield.mask(PII) → masked_input → context-gate
```

context-shield'ın iki çıktısı vardır: (1) maskelenmiş metin — context-gate'e gider, (2) yerel session map (`KİŞİ_1 = Ahmet`) — context-core'un de-mask adımında kullanılır.

**Bu katman isteğe bağlıdır.** Düşük-risk kaynaklarda (kamuya açık makale, resmi kılavuz) context-shield atlanır; context-gate direkt çalışır. Yüksek-risk alanlarda (hasta verisi, ticari sır) zorunludur.

context-shield'ın çözdüğü ve context-core'un tekrar etmediği problemler: Türkçe morfolojik NER (sondan eklemeli yapı), Fuzzy De-masking (LLM yanıtındaki token mutasyonları), DOM enjeksiyonu. Bunlar `bp-privacy.md`'de yaşar.

### 2.1 Ingest Gate — source-curator Entegrasyonu

context-core, kaynağı doğrudan wiki'ye yazamaz. Her kaynak önce `context-gate` pipeline'ından geçer. Detaylar `context-gate.md`'de tanımlıdır; context-core'un bilmesi gereken tek şey:

```
masked_input → context-gate.curate() → raw/ + provenance-manifest → context-wiki
```

context-gate'in context-core'a sağladığı çıktı ikidir: (1) ayıklanmış, HITL onaylı metin — `raw/` klasörüne teslim edilir, (2) provenans manifesti — her kaynak için değişmez YAML kaydı, context-core'un veri kontratına `provenance` alanını besler.

**context-core, context-gate'in iç pipeline'ını bilmez.** 7 aşamalı süreç (INTAKE → PROFİLLEME → SWOT → AYIKLAMA → İÇGÖRÜ → REFİNEMENT → HAM INGEST), risk stratifikasyonu, HITL checkpoint'leri — bunlar `context-gate.md`'de yaşar.

context-core'un ingest tipleri tablosu, context-gate adaptörlerinin kabul ettiği format listesidir:

| Tip | Örnek | source-curator Risk |
|-----|-------|---------------------|
| `pdf` | Makale, tez, kılavuz | Orta |
| `url` | PubMed, dergi sayfası | Orta |
| `structured` | AutoVA JSON, istabot CSV | Düşük |
| `plan` | Tez planı Markdown | Düşük |

Risk seviyesi düşükse context-gate HITL checkpoint'lerini azaltır; bu kararı context-gate alır, context-core değil.

### 2.2 Wiki Derleme — context-wiki Entegrasyonu

context-core, kaynak ingest ettikten sonra context-wiki örüntüsünü tetikler. Detaylar `rag-wiki.md`'de tanımlıdır; context-core yalnızca şunu bilir:

```
ingest(source) → compile(micro-wiki) → operational-schema
```

Her proje için bir `micro-wiki/` dizini açılır. context-va, context-paper ve context-slides hepsi aynı `micro-wiki/`'den okur. Writeback de aynı dizine döner. Wiki bir kez derlenir, üç modül paylaşır.

### 2.3 Intent Sınıflandırma

Kullanıcı çıktı tipini açıkça belirtebilir ya da belirtmeyebilir. context-core şu beş intent'i tanır:

| Intent | Modül | Girdi Koşulu |
|--------|-------|-------------|
| `graphical-abstract` | context-va (Infographic/SVG) | PDF manuscript mevcut |
| `manuscript` | context-paper (Executive Summary/Report) | Grafik özet veya tez planı mevcut |
| `presentation` | context-slides (PPTX Destesi) | context-va JSON veya manuscript mevcut |
| `education-kit` | context-edu (Quiz, FAQ, Worksheet) | Herhangi bir micro-wiki mevcut |
| `media-script` | context-audio (Podcast/Audio-Script) | Herhangi bir micro-wiki mevcut |
| `qa` | context-wiki runtime | Herhangi bir micro-wiki mevcut |
| `chain` | context-va → context-paper → context-slides | PDF manuscript, hedef format = "tam zincir" |

Intent belirsizse context-core sınıflandırmayı kullanıcıya açıkça sorar; sessizce tahmin etmez.

---

## 3. Zincir Koordinasyonu

context-va, context-paper ve context-slides birbirinin çıktısını girdi olarak kullanabilir. Bu zincir context-core'un koordine ettiği tek yapıdır:

```
PDF Manuscript
  └─► context-va     → VisualAbstract JSON
        └─► context-paper  → IMRaD Manuscript + istabot analiz
              └─► context-slides → Slayt Destesi
```

Zincirin herhangi bir noktasından başlanabilir:

- Sadece grafik özet isteniyor → `context-va` çalışır, durur.
- Manuscript var, slide isteniyor → `context-slides` direkt çalışır, context-va atlanır.
- Tam zincir → sırayla, her adım bir öncekinin doğrulanmış çıktısını bekler.

**Önemli:** Zincir içinde hiçbir adım diğerinin logic'ini kopyalamaz. context-slides, context-va'nın JSON formatını okur ama nasıl üretildiğini bilmez; context-paper, context-slides'ın konfigürasyonunu bilmez. Aralarındaki tek bağ veri kontratıdır.

---

## 4. Çalışma Zamanı Motoru (Runtime Engine): Generator / Critic Döngüsü

Ham kaynaktan hedef formata (slide, va, paper, quiz vb.) dönüşüm basit bir LLM çağrısı değildir. `context-med`'in ilkel MVP'sinden (`studio-agent`) elde edilen içgörüyle, tüm çıktı modülleri tek bir standart çalışma zamanı motorunu (Runtime Engine) paylaşır:

**Generator / Critic Pipeline (Derleyici Mimarisi):**
Her veri transformasyonu veya artefakt üretimi şu disiplinle çalışır:

`[Micro-Wiki / Girdi JSON] → Generator(LLM) → Critic(LLM) → [Reviser(LLM)] → Schema Validation → Render → Write(Provenance)`

1. **Sıkı Şema (Strict Schema) Kontratları:** Her çıktı formatının kendine ait bir JSON Schema'sı veya YAML config'i vardır. Jeneratör yapılandırılmış çıktı verir, regex tabanlı uydurmalar kullanılmaz.
2. **Kritik (Critic) ve Kontrol Geçitleri (Lint / Gate):** Jeneratörün ürettiği taslak doğrudan kullanıcıya verilmez. Çıktı, `knowledge-base` ile karşılaştırılarak bir **Critic** tarafından denetlenir. Halüsinasyon, kaynakta olmayan veri uydurma ve formata uymama durumlarında reddedilir. Yüksek riskli alanlarda (medikal) human-review (insan onayı) geçidi koşulmalıdır.
3. **Gerçek Artefakt Çıktıları:** Sistem HTML/JSON taklidi yapmaz. Hedef modül native formatı (örn. `.pptx`, `.svg`, native `.md`) üretmekle mükelleftir.
4. **Re-render ve Versiyonlama (Stale Detection):** Üretilen artefakt yalnızca bir dosya değil; "hangi kaynak hash'inden, hangi şemayla üretildiği" bilgisini (lineage/provenance) taşıyan bir build dosyasıdır. Kaynak PDF veya wiki değiştiğinde, artefakt "stale" (bayat) olur ve kontrollü olarak yeniden derlenir.
5. **Writeback (Geri Besleme):** Artefakt üretimi tek yönlü değildir. Sık başarısız olan üretimler (örn. sürekli kalitesiz çıkan discussion bölümleri), wiki'deki eksiklikleri tespit etmede bir teşhis aracıdır. Bu hatalar wiki'yi besler.

Bu motor, bir destek chatbot'undan ziyade, deterministik bir **artefakt derleyicisidir (artifact compiler)**. Kullanıcı "bana bunu açıkla" demez; sistemi "bunu çalışma kağıdına çevir", "bunu yönetici özetine çevir", "bunu grafik özete derle" şeklinde araç olarak kullanır. Kaynak veride değişiklik olduğunda tüm zincir yeniden derlenebilir.

---

## 5. Veri Kontratları (Interfaces)

Nexus'un tanımlaması gereken tek şey jeneratörler arası veri formatlarıdır. Her jeneratörün kendi iç formatı kendi dosyasında yaşar; burası yalnızca el sıkışma noktalarını tanımlar.

### context-va Çıktısı → context-paper / context-slides Girdisi

```json
{
  "visual_abstract": {
    "pico": { "population": "...", "intervention": "...", "comparison": "...", "outcome": "..." },
    "key_stats": [{ "label": "...", "value": "...", "unit": "..." }],
    "source_doi": "...",
    "journal_config": "jama.yaml",
    "provenance": { "model": "...", "extracted_at": "..." }
  }
}
```

### context-paper Çıktısı → context-slides Girdisi

```json
{
  "manuscript": {
    "imrad": { "intro": "...", "methods": "...", "results": "...", "discussion": "..." },
    "target_journal": "...",
    "stats_source": "istabot",
    "provenance": { "model": "...", "generated_at": "..." }
  }
}
```

Bu iki kontrat değişirse, değişiklik burada güncellenir. Modül dosyaları kontratın nasıl üretildiğini açıklar; context-core neyin transfer edildiğini açıklar.

---

## 6. Cerebra ile İlişki

`rag-wiki.md` dual-mode'u tanımlar (standalone / cerebra-composed). context-core aynı dual-mode'u miras alır:

- **Standalone:** Her proje kendi `micro-wiki/` + `operational-schema` dosyalarıyla çalışır. context-core dört adaptör + intent classifier + zincir koordinatöründen ibarettir.
- **Cerebra-composed:** context-core, cerebra substrate'indeki `human-in-loop-agent` ve provenance grafiğine bağlanır. Writeback'ler merkezi `core-wiki`'ye akar. Ratchet eval'lar framework'ten miras alınır.

Standalone çalışırken Cerebra bağımlılığı yoktur. Cerebra bağlanınca context-core hiç değişmez; yalnızca writeback ve eskalasyon hedefleri güncellenir.

---

## 7. Package Conformance

Cerebra ekosisteminde bir modül olarak Nexus şu kontratlara uymalıdır:

- `substrate/context-core/` dizin yapısı
- `operational-schema.yaml` — hangi ingest tiplerini, intent'leri ve zincir modlarını desteklediği
- `eval/context-core-eval.jsonl` — intent sınıflandırma doğruluğu için altın-standart örnekler
- Her veri transferi provenance metadata bloğu içerir (`source`, `model`, `timestamp`)

---

## Referanslar

Bu dosyanın açıklamadığı detaylar için:

| Katman | Ekosistem Adı | Dosya |
|--------|--------------|-------|
| [1] Privacy | context-shield | `bitirme-proje/bp-privacy.md` |
| [2] Ingest | context-gate | `context-gate.md` |
| [3] Wiki | context-wiki | `rag-wiki.md` |
| [4] Output | context-va | `context-va.md` |
| [4] Output | context-paper | `context-paper.md` |
| [4] Output | context-slides | `context-slides.md` |

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-core",
  "version": "0.1.0",
  "bin": { "context-core": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-core chain` | Run full pipeline chain (gate→wiki→module) | `--input`, `--output` | `--config`, `--format`, `--intent`, `--dry-run` |
| `context-core route` | Route input to appropriate module | `--input` | `--intent`, `--format`, `--verbose` |
| `context-core status` | Show pipeline status for active jobs | | `--format`, `--verbose` |
| `context-core health` | Health check all connected modules | | `--format`, `--verbose` |

### Additional Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--intent` | `string` | `auto` | Target module: `graphical-abstract` \| `manuscript` \| `presentation` \| `chain` \| `auto` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Full Chain

```bash
context-core chain \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/chain/ \
  --intent chain \
  --format json
```

**Input:** Raw thesis abstract.
**Expected Output:** gate profile + wiki page + VA + manuscript + slides in `output/chain/`.
**Exit Code:** `0`

#### Scenario 2 — Route to Module

```bash
context-core route \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --intent graphical-abstract
```

**Expected Output:** Detected intent and target module name.
**Exit Code:** `0`

#### Scenario 3 — Health Check

```bash
context-core health --format json
```

**Expected Output:** JSON status of each connected module (gate, wiki, va, paper, slides, shield).
**Exit Code:** `0` if all healthy, `3` if any module unreachable.

#### Scenario 4 — Missing Input (Error)

```bash
context-core chain --output output/chain/
```

**Expected:** `Error: required option '--input <path>' not specified`
**Exit Code:** `1`

#### Scenario 5 — Dry Run

```bash
context-core chain \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/chain/ \
  --dry-run
```

**Expected:** Prints pipeline execution plan (modules, order, estimated steps). No files written.
**Exit Code:** `0`


#### Scenario (Extension) — Invalid Config (Error)

```bash
context-core chain \
  --input fixtures/raw/sample-text.txt \
  --output output/error.json \
  --config fixtures/config/corrupt-config.yaml
```

**Expected:** `Error: Invalid YAML configuration in fixtures/config/corrupt-config.yaml`
**Exit Code:** `1`


#### Scenario (Extension) — Schema / Validation Check (Error)

```bash
context-core chain \
  --input fixtures/json/invalid-schema-sample.json \
  --output output/failed.json
```

**Expected:** `Error: Validation failed — schema mismatch or hallucination detected.`
**Exit Code:** `2`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Chain completed |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | Intent classification ambiguous |
| `3` | External dependency error | Module unreachable |

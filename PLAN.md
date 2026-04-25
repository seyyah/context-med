# Context-Med — Implementation Plan

> CLI önce, UI sonra. Her phase kendi CLI komutuyla tamamlanır. Phase bitmeden sonrakine geçilmez.

---

## Monorepo Yapısı

Monorepo + ayrı yayınlanabilir paketler: her modül bağımsız kurulabilir (`pip install context-gate`), ancak ortak tooling ve cross-cutting değişiklikler tek repoda kalır.

```
context-med/                          # monorepo root
├── packages/
│   ├── context-core/                 # pip install context-med-core
│   │   ├── src/context_core/
│   │   │   ├── __init__.py
│   │   │   ├── cli.py               # Typer entry point (tüm alt komutlar)
│   │   │   └── router.py            # intent → modül route
│   │   └── pyproject.toml
│   ├── context-gate/                 # pip install context-med-gate
│   │   ├── src/context_gate/
│   │   └── pyproject.toml
│   ├── context-wiki/                 # pip install context-med-wiki
│   │   ├── src/context_wiki/
│   │   └── pyproject.toml
│   ├── context-va/                   # pip install context-med-va
│   │   ├── src/context_va/
│   │   └── pyproject.toml
│   ├── context-paper/                # pip install context-med-paper
│   │   ├── src/context_paper/
│   │   └── pyproject.toml
│   ├── context-slides/               # pip install context-med-slides
│   │   ├── src/context_slides/
│   │   └── pyproject.toml
│   ├── context-narrate/              # pip install context-med-narrate
│   │   ├── src/context_narrate/
│   │   └── pyproject.toml
│   ├── context-shield/               # npm install @context-med/shield (browser edge-AI)
│   │   ├── src/
│   │   └── package.json
│   └── context-ui/                   # npm install @context-med/ui
│       ├── src/
│       └── package.json
├── configs/
│   └── jama.yaml                    # paylaşılan journal konfigürasyonları
├── pyproject.toml                   # uv workspace root (Python)
├── package.json                     # npm workspace root (JS)
└── README.md
```

**Bağımlılık bildirimi** her paketin `pyproject.toml`'unda semver ile tanımlanır:
```toml
# context-paper/pyproject.toml
dependencies = [
  "context-med-va>=1.0",
  "context-med-wiki>=1.0",
]
```

**Standalone kurulum** da desteklenir — sadece görsel özet üretmek isteyen kullanıcı:
```bash
pip install context-med-va
context-va run --input article.pdf
```

---

## Phase 0 — Monorepo İskeleti

**Hedef:** `context-med --help` komut listesini basar; her paket bağımsız kurulabilir.

- [ ] `pyproject.toml` (uv workspace root) + `package.json` (npm workspace root)
- [ ] `packages/` altında her modül için klasör + boş `__init__.py` ve `pyproject.toml`
- [ ] `context-core` Typer CLI entry point — tüm alt komutları `packages/*` den import eder
- [ ] `uv sync` ile workspace bağımlılıkları kurulur
- [ ] `pip install -e packages/context-core` çalışır

**Tamamlanma kriteri:** `context-med --help` tüm alt komutları listeler; `pip install context-med-va` tek başına kurulabilir.

---

## Phase 1 — context-va

**Hedef:** `context-med run va --input article.pdf` → JAMA standartlı PNG

En somut "aha" çıktısı. Bağımsız çalışır, veri kontratını ve Vision LLM entegrasyonunu erkenden test eder.

- [ ] PDF → Vision LLM → `VisualAbstract JSON` (PICO + key stats)
- [ ] `configs/jama.yaml` parser
- [ ] Playwright renderer → PNG
- [ ] Ratchet eval seti (10 makale, beklenen JSON)

**Tamamlanma kriteri:** 5 farklı JAMA makalesi için halüsinasyonsuz JSON + hatasız PNG.

**Veri kontratı çıktısı:**
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

---

## Phase 2 — context-gate

**Hedef:** `context-med ingest --input paper.pdf --notebook my-thesis` → `raw/` + provenance YAML

Phase 1'de PDF doğrudan alındı. Artık tüm modüllerin besleneceği gerçek ingest pipeline kurulur.

- [ ] PDF / URL / metin adaptörleri (PyMuPDF, requests)
- [ ] Provenance manifest (SHA-256 + YAML)
- [ ] SWOT analizi (Haiku)
- [ ] Terminal HITL: onay / ret / redaksiyon
- [ ] `raw/` klasörüne teslim + rag-wiki tetikleme

**MVP kısıtı:** Risk stratifikasyonu yok; tüm kaynaklar orta-risk işlenir.

**Tamamlanma kriteri:** İngest edilen PDF için değişmez provenance YAML üretilir; HITL onay olmadan `raw/` klasörüne hiçbir şey girmez.

---

## Phase 3 — context-wiki

**Hedef:**
```bash
context-med wiki build --notebook my-thesis
context-med qa --notebook my-thesis "PICO nedir?"
```

context-paper ve context-slides ikisi de wiki'den okur; wiki olmadan çalışamazlar.

- [ ] `raw/` → Karpathy derleme pipeline'ı → entity / concept / procedure sayfaları
- [ ] Sayfa embedding + retrieval (cosine; vektör DB opsiyonel)
- [ ] Guideline-in-the-loop runtime: soru → sayfalar → taslak → kılavuz denetimi → cevap
- [ ] Eskalasyon: eşik altında "bilmiyorum" + terminal bildirimi
- [ ] Writeback: insan kararları wiki'ye geri yazılır

**Tamamlanma kriteri:** Kapsam içi soru kaynaklı yanıt döner; kapsam dışı soru açıkça reddedilir.

---

## Phase 4 — context-paper

**Hedef:** `context-med run paper --input va.json --notebook my-thesis --journal jama`

- [ ] context-va JSON → IMRaD yapısı
- [ ] context-wiki'den literatür gap + methods bilgisi
- [ ] istabot CSV entegrasyonu (istatistik tabloları)
- [ ] Journal config'e göre format (kelime limiti, bölüm sırası)
- [ ] Halüsinasyon denetimi: her iddia wiki sayfasına atıflanmalı

**Veri kontratı çıktısı:**
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

**Tamamlanma kriteri:** Üretilen manuscript kelime sayısı ve bölüm yapısı journal config'e uyar; tüm istatistikler kaynaklıdır.

---

## Phase 5 — context-slides

**Hedef:** `context-med run slides --input manuscript.pdf --config conference-10min.yaml`

- [ ] `configs/conference-10min.yaml` parser (süre, izleyici, slayt sayısı)
- [ ] context-va JSON + context-paper IMRaD → slayt içerik haritası
- [ ] PPTX renderer (python-pptx)
- [ ] Konuşmacı notu üretimi
- [ ] Numerik tutarlılık kontrolü (manuscript p-value = slides p-value)

**Tamamlanma kriteri:** `context-med run all` Phase 5 sonunda uçtan uca çalışır.

---

## Phase 6 — context-narrate

**Hedef:** `context-med run narrate --input manuscript.pdf --voice formal`

context-va JSON veya manuscript PDF'den bağımsız çalışabilir; diğer modüllere bağımlılığı yoktur.

- [ ] Manuscript → narrasyon scripti (akademik ton)
- [ ] TTS entegrasyonu (ElevenLabs veya OpenAI TTS)
- [ ] MP3 çıktı

**Tamamlanma kriteri:** Üretilen ses dosyası manuscript'teki tüm sayısal değerleri doğru telaffuz eder.

---

## Phase 7 — context-shield

**Hedef:** `context-med ingest --input patient-data.pdf --shield on`

Geliştirme boyunca kamuya açık makaleler kullanılır, shield gerekmez. Production'a girmeden önce eklenir.

- [ ] Türkçe NER modeli (spaCy Türkçe veya Transformers.js)
- [ ] PII tespiti + token map üretimi (`KİŞİ_1 = Ahmet`)
- [ ] Fuzzy de-masking (Levenshtein — morfolojik mutasyon toleransı)
- [ ] context-gate'e pre-processing adımı olarak entegrasyon

**Tamamlanma kriteri:** Türkçe NER precision > %90, de-masking başarısı > %95.

---

## Phase 8 — REST API

**Hedef:** Her CLI komutu bir HTTP endpoint'e karşılık gelir; yeni logic yazılmaz.

| Endpoint | CLI Karşılığı |
|----------|--------------|
| `POST /gate/ingest` | `context-med ingest` |
| `GET /gate/status/:id` | upload progress |
| `POST /gate/approve/:id` | HITL onay |
| `POST /generate` | `context-med run va\|paper\|slides\|narrate` |
| `POST /qa` | `context-med qa` |
| `GET /notebooks` | notebook listesi |
| `POST /notebooks` | notebook oluştur |

- [ ] FastAPI scaffold
- [ ] Her CLI fonksiyonu endpoint'e wrap edilir
- [ ] OpenAPI dokümantasyonu otomatik üretilir

**Tamamlanma kriteri:** `curl` ile tüm CLI işlevleri erişilebilir.

---

## Phase 9 — context-ui

CLI + API çalışıyor, her modül test edildi. Thin shell kurulur.

- [ ] 3 panel layout: Sources / Notebook / Outputs
- [ ] Sources paneli: upload → context-gate API → progress → HITL inline onay kartı
- [ ] Notebook paneli: Q&A → context-wiki runtime → kaynaklı yanıt
- [ ] Outputs paneli: modül kartları → tetikleme → dosya indirme
- [ ] context-shield session map → sessionStorage (sayfa kapanınca sıfır)

> **Design Requirement:** context-ui geliştirilirken `DESIGN.md` kanonik UI tasarım dilimizdir. Agent'lar otomatik arayüz geliştirmelerinde (örn. layout ve bileşen üretiminde) **Google Stitch** ve **MCP**'yi (Antigravity üzerinden) varsayılan olarak kullanmalı ve `create_design_system` komutlarıyla `DESIGN.md` standartlarını Stitch'e öğretmelidir.

**Tamamlanma kriteri:** Tarayıcıdan PDF yükle → Q&A yap → visual abstract indir akışı CLI'a bağımlılık olmadan çalışır.


---

## Özet

| Phase | Modül | CLI Komutu | PyPI / npm Paketi | Bağımlılık |
|-------|-------|-----------|-------------------|------------|
| 0 | Monorepo İskeleti | `--help` | `context-med-core` | — |
| 1 | context-va | `run va` | `context-med-va` | — |
| 2 | context-gate | `ingest` | `context-med-gate` | — |
| 3 | context-wiki | `wiki build`, `qa` | `context-med-wiki` | gate |
| 4 | context-paper | `run paper` | `context-med-paper` | va, wiki |
| 5 | context-slides | `run slides` | `context-med-slides` | paper, va |
| 6 | context-narrate | `run narrate` | `context-med-narrate` | — |
| 7 | context-shield | `--shield on` | `@context-med/shield` (npm) | gate |
| 8 | REST API | — | `context-med-core` (FastAPI) | 1–7 |
| 9 | context-ui | — | `@context-med/ui` (npm) | API |

`context-med run all` → Phase 5 sonunda çalışır.

---

## YZ Ajan Geliştirmeleri (Antigravity)

**DevEx & CI/CD Altyapısı**
Antigravity tarafından depo root alanına aşağıdaki mekanizmalar uygulanmıştır:
- [x] **PR Template:** Checklist ve Gamification skor bilgilendirmesi.
- [x] **Workflow:** İzolasyon (Gate); `tests/` ya da root dışı alan editlendiğinde HITL etiketi.
- [x] **Workflow:** CI Test & Skoring; otomatik puan hesabı (Gamification).
- [x] **Workflow:** Merge durumunda paket-spesifik Semantic Version tag (minor bump) ve auto `CHANGELOG.md` güncelleyici.
Detaylar doğrudan depo içindeki `WALKTHROUGH.md` alanında okunabilir.

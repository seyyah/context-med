# context-ui

*Context ekosisteminin notebook-first, ince-shell web ve mobil arayüzü: kullanıcı kaynakları yönetir, Q&A yapar, çıktı üretir — tüm işlevsellik context-core API üzerinden sağlanır, UI'ın kendi mantığı yoktur.*

> Bu belge IDEA standardını takip eder. context-ui'ın ne olduğunu, neyi yapmadığını ve context-core ile sınırın nerede çizildiğini tanımlar. Ekosistem detayları kendi dosyalarında yaşar; buraya referans verilir, kopyalanmaz.

---

## 1. Tez (Thesis)

NotebookLM, araştırma iş akışını üç eyleme indirger: kaynak ekle, sor, çıktı al. Context ekosistemi bu üç eylemi teknik olarak çözmüştür — ama hepsi API düzeyinde. Kullanıcı bu API'lara doğrudan erişemez.

context-ui'ın tek görevi bu erişimi sağlamaktır. İşlevselliği icat etmez; var olan işlevselliği gösterir.

**Thin shell kısıtı kırılmaz bir tasarım kararıdır.** UI'ın kendi iş mantığı olamaz. "Hangi kaynak hangi micro-wiki'ye gider?" → context-core bilir. "Bu soru cevaplanabilir mi?" → context-wiki bilir. "Slayt kaç dakikalık olacak?" → context-slides bilir. context-ui bu kararların hiçbirini almaz; alınan kararları gösterir ve kullanıcının girdisini doğru API'a iletir.

**Temel değer önermesi:** Araştırmacı tarayıcıyı açar, kaynağı yükler, sorusunu sorar, çıktısını alır — tek bir arayüzden, arka planda hangi modülün çalıştığını bilmeden.

---

## 2. Üç Panel

context-ui üç sabit panelden oluşur. Her panel bir ekosistem katmanına karşılık gelir.

```
┌─────────────────┬──────────────────────────┬─────────────────┐
│   Sources       │      Notebook             │    Outputs      │
│   [1]           │      [2]                  │    [3]          │
│                 │                           │                 │
│  context-gate   │    context-wiki runtime   │  context-va     │
│  context-shield │    (soru-cevap, chat)     │  context-paper  │
│  (upload UI)    │                           │  context-slides │
│                 │                           │  context-narrate│
└─────────────────┴──────────────────────────┴─────────────────┘
         ↕                    ↕                       ↕
                      context-core API
```

### Panel 1 — Sources

Kullanıcının kaynakları yüklediği ve yönettiği alan.

- Dosya yükleme (PDF, URL, metin): context-shield PII maskelemeyi burada tetikler
- Upload progress: context-gate'in 7 aşamalı pipeline'ı adım adım gösterilir
- HITL onay noktaları: context-gate checkpoint'leri için inline onay UI'ı
- Kaynak listesi: yüklenmiş kaynaklar, her birinin provenans özeti, kabul/ret durumu
- Aktif notebook göstergesi: hangi `micro-wiki/` üzerinde çalışıldığı

Panel 1'in kendi mantığı yoktur. Upload → context-gate API → progress polling → sonuç gösterme.

### Panel 2 — Notebook

Kullanıcının aktif micro-wiki ile etkileştiği alan. NotebookLM'deki chat paneline karşılık gelir.

- Soru-cevap: context-wiki runtime'a mesaj gönderilir, kaynaklı yanıt gösterilir
- Kaynak atıfları: her yanıtın altında hangi wiki sayfasından geldiği
- Eskalasyon bildirimi: context-wiki emin değilse kullanıcıya açıkça bildirilir
- Geçmiş: o notebook'un önceki Q&A oturumları

Panel 2'nin kendi mantığı yoktur. Mesaj → context-core `/qa` endpoint → yanıt + kaynak referansları gösterme.

### Panel 3 — Outputs

Kullanıcının çıktı modüllerini tetiklediği alan.

- Her modül için ayrı kart: context-va, context-paper, context-slides, context-narrate
- Her kart: modülün ne ürettiğini tek cümleyle açıklar, tetikleme düğmesi, çıktı önizlemesi
- Zincir modu: "Tüm çıktıları üret" seçeneği context-core'un `chain` intent'ini tetikler
- İndirme: üretilen dosyalar (PNG, PDF, PPTX, MP3) doğrudan indirilir

Panel 3'ün kendi mantığı yoktur. Tetikleme → context-core `/generate` endpoint → çıktı dosyası gösterme.

---

## 3. context-ui'ın Kendi State'i

Thin shell olduğu için context-ui'ın yönettiği state minimal ve nettir:

| State | Nerede | Ömrü |
|-------|--------|------|
| Aktif notebook ID | localStorage | Oturum arası kalıcı |
| Upload progress | memory | O upload'un süresi |
| context-shield session map | sessionStorage | Sekme kapanana kadar |
| Panel layout tercihi | localStorage | Kalıcı |

context-shield session map — `KİŞİ_1 = Ahmet` gibi eşleştirmeler — kasıtlı olarak sessionStorage'da tutulur. Sekme kapandığında yok olur, sunucuya gitmez. Bu context-shield'ın sıfır-güven garantisinin UI düzeyindeki karşılığıdır.

Bunların dışında hiçbir iş state'i context-ui'da yaşamaz. Notebook içeriği, wiki sayfaları, çıktı dosyaları, provenans kayıtları — hepsi context-core tarafında.

---

## 4. API Sözleşmesi (context-core ile Sınır)

context-ui'ın kullandığı endpoint'ler. Her endpoint context-core'da tanımlanır; context-ui yalnızca çağırır.

| Eylem | Endpoint | Panel |
|-------|----------|-------|
| Kaynak yükle | `POST /gate/ingest` | Sources |
| Upload durumu | `GET /gate/status/:id` | Sources |
| HITL onay | `POST /gate/approve/:id` | Sources |
| Soru sor | `POST /qa` | Notebook |
| Çıktı üret | `POST /generate` | Outputs |
| Notebook listesi | `GET /notebooks` | Sources |
| Notebook oluştur | `POST /notebooks` | Sources |

context-ui bu endpoint'lerin nasıl çalıştığını bilmez; yalnızca request/response formatını bilir.

---

## 5. context-shield Entegrasyonu

context-shield, context-ui'ın Sources paneline entegre olur — ayrı bir katman değil, upload akışının bir adımı olarak:

```
Kullanıcı dosya seçer
  → context-shield.scan(file)         [browser içinde, edge-AI]
  → PII tespit edilirse: kullanıcıya göster, onay iste
  → masked_file + session_map üretilir
  → POST /gate/ingest(masked_file)     [context-core'a gider]
```

context-shield devre dışı bırakılabilir (düşük-risk kaynaklarda). Bu tercih Sources panelinde bir toggle olarak sunulur. Default: açık.

---

## 6. Notebook-First UX Kararları

Notebook-first tasarım birkaç somut UX kararı gerektirir:

**Notebook merkezdedir, modül değil.** Kullanıcı "context-va aç" demez; "bu notebook için grafik özet üret" der. Modül adları arka planda kalır; çıktı tipi öne çıkar.

**Kaynak eklemek ilk adımdır, zorunlu değil.** Boş notebook açılabilir; kullanıcı önce soru sorabilir (context-wiki boş notebook'ta kapsam dışı yanıt verir, bu beklenen davranıştır).

**Çıktılar notebook'a bağlıdır.** Üretilen her çıktı o notebook'un tarihinde görünür. Farklı notebook'un çıktısı farklı yerde.

**HITL adımları inline gösterilir.** context-gate bir checkpoint'e geldiğinde kullanıcı ayrı bir sayfaya yönlendirilmez; Sources panelinde inline onay kartı açılır.

---

## 7. Web ve Mobil

context-ui web-first geliştirilir; mobil responsive olarak başlar, sonra native uygulamaya taşınır.

| Platform | V1 | V2 |
|----------|----|----|
| Web | ✓ Full feature | — |
| Mobile web | ✓ Responsive | — |
| iOS / Android native | — | ✓ |

Mobil için en kritik uyum kararı: 3 panel → tab navigation. Sources / Notebook / Outputs üç tab olarak mobilde yan yana değil alt alta (tab bar) gösterilir.

---

## 8. Ne Yapmaz

- **İş mantığı barındırmaz.** Hangi kaynağın hangi modüle uygun olduğu, cevabın kalitesi, çıktının formatı — bunların hiçbiri UI'da hesaplanmaz.
- **Offline çalışmaz.** context-core API'a bağlantı yoksa context-ui boş bir shell'dir.
- **context-shield'ı bypass etmez.** Upload akışında shield toggle'ı kapatılabilir ama gizlenemez; her upload'da kullanıcı bilinçli olmalıdır.
- **Çıktı düzenlemez.** Üretilen PNG, PDF, PPTX UI içinde düzenlenmez; indirilir, harici araçta düzenlenir.

---

## 9. Cerebra ile İlişki

context-ui, Cerebra'nın kullanıcı yüzüdür. Cerebra-composed modda context-core'a bağlandığında, kullanıcı farkında olmadan Cerebra substrate'inin tüm yeteneklerine erişir:

- Notebook = Cerebra micro-wiki instance
- Q&A = Cerebra rag-wiki runtime
- Outputs = Cerebra modül zinciri
- HITL onaylar = Cerebra human-in-loop-agent

Standalone modda context-ui, context-core'un local API'ına bağlanır. Aynı arayüz, farklı backend.

---

## Referanslar

| Konu | Dosya |
|------|-------|
| Orchestration ve API endpoint tanımları | `context-core.md` |
| PII maskeleme, session map, edge-AI | `bitirme-proje/bp-privacy.md` |
| Kaynak kalite pipeline, HITL adımları | `context-gate.md` |
| Q&A motoru, wiki runtime | `rag-wiki.md` |
| Graphical abstract çıktısı | `context-va.md` |
| Manuscript çıktısı | `context-paper.md` |
| Sunum çıktısı | `context-slides.md` |

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-ui",
  "version": "0.1.0",
  "bin": { "context-ui": "./bin/cli.js" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-ui serve` | Start development server | | `--port`, `--verbose` |
| `context-ui build` | Build production bundle | `--output` | `--format`, `--verbose` |
| `context-ui lint` | Lint UI components and accessibility | `--input` | `--format`, `--verbose` |
| `context-ui status` | Check API backend connectivity | | `--format`, `--verbose` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Start Dev Server

```bash
context-ui serve --port 3000
```

**Expected:** Dev server starts on port 3000.
**Exit Code:** `0`

#### Scenario 2 — Build Production

```bash
context-ui build --output dist/
```

**Expected Output:** Optimized production bundle in `dist/`.
**Exit Code:** `0`

#### Scenario 3 — Lint Components

```bash
context-ui lint --input src/ --format json
```

**Expected Output:** JSON report with accessibility issues, unused components.
**Exit Code:** `0` if pass, `2` if violations.

#### Scenario 4 — Status Check

```bash
context-ui status --format json
```

**Expected Output:** JSON with backend API connectivity status for each context-med module.
**Exit Code:** `0`

#### Scenario 5 — Build Missing Output (Error)

```bash
context-ui build
```

**Expected:** `Error: required option '--output <path>' not specified`
**Exit Code:** `1`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Server started / build complete |
| `1` | General error | Missing argument, build failure |
| `2` | Validation error | Accessibility violations |
| `3` | External dependency error | Backend API unreachable |

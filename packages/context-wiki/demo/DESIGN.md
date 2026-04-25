# context-wiki Demo — Design Spec

## Genel Bakış

context-wiki'nin 3 temel özelliğini gösteren tek sayfalık web demo'su:
1. **Ingest** — Ham belge → wiki sayfası
2. **Query** — Wiki'ye soru sor, kaynaklı cevap al
3. **Autoresearch** — Experiment çalıştır, skor gör

## Renk Paleti (wiki/LLMs.txt'den)

- Primary:   #003CBD — butonlar, aktif state, sidebar
- Secondary: #19C480 — başarı, pozitif onay
- Surface:   #f5f5f4 — sayfa arkaplanı
- On-Surface:#18181b — ana metin
- Error:     #FD2C30 — hata durumu
- Border:    #e4e4e7 — ayırıcı çizgiler
- Muted:     #71717a — ikincil metin

## Tipografi

- Font: Inter (tüm metinler)
- Heading: 24px bold
- Sub-heading: 16px semibold
- Body: 14px regular
- Code/mono: 13px monospace

## Layout

```
┌─────────────────────────────────────────────┐
│  HEADER: context-wiki  [v0.1.0]             │
├──────────┬──────────────────────────────────┤
│  SIDEBAR │  MAIN CONTENT                    │
│          │                                  │
│ • Ingest │  [Aktif bölüm içeriği]           │
│ • Query  │                                  │
│ • Auto-  │                                  │
│   research│                                 │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

- Sidebar: 220px genişlik, #003CBD arkaplan, beyaz metin
- Main: kalan alan, #f5f5f4 arkaplan
- Header: 56px yükseklik, beyaz arkaplan, alt border

## Bölümler

### 1. Ingest

Girdi alanı: dosya adı (text input)
Çıktı önizleme: oluşturulan frontmatter (code block)

```
┌─────────────────────────────┐
│ Input File                  │
│ [sample-paper.txt        ]  │
│                             │
│ Output Directory            │
│ [./wiki                  ]  │
│                             │
│ Format: [md] [json]         │
│                             │
│ [  Run Ingest  ]            │
│                             │
│ Output:                     │
│ ┌─────────────────────────┐ │
│ │ ---                     │ │
│ │ title: Sample Paper     │ │
│ │ source: raw/sample...   │ │
│ │ source_hash: a3f9...    │ │
│ │ generated_at: 2026-...  │ │
│ │ model: claude-sonnet    │ │
│ │ human_reviewed: false   │ │
│ │ ---                     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 2. Query

Soru girişi + cevap kartı

```
┌─────────────────────────────┐
│ Ask the Wiki                │
│                             │
│ [primary renk nedir?     ]  │
│                    [Ask →]  │
│                             │
│ ┌─────────────────────────┐ │
│ │ ● High Confidence       │ │
│ │                         │ │
│ │ Primary : #003CBD       │ │
│ │ — primary action,       │ │
│ │   sidebar, active state │ │
│ │                         │ │
│ │ Source: design-system   │ │
│ │ Hash: a3f9...           │ │
│ └─────────────────────────┘ │
│                             │
│ Exit 2 durumu:              │
│ ┌─────────────────────────┐ │
│ │ ✗ I don't know.         │ │
│ │ No relevant wiki page   │ │
│ │ found for this query.   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Confidence badge renkleri:
- high → #19C480 (yeşil)
- low  → #f59e0b (turuncu)
- none → #FD2C30 (kırmızı) + Exit 2

### 3. Autoresearch

Experiment spec gösterimi + skor

```
┌─────────────────────────────┐
│ Run Experiment              │
│                             │
│ Spec: exp-001               │
│ "Verify wiki can answer     │
│  a basic design token query"│
│                             │
│ Query: primary color design │
│ Expected: primary, color,   │
│           003CBD            │
│                             │
│ [  Run Experiment  ]        │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✓ PASSED                │ │
│ │ Score: 3/3              │ │
│ │ Confidence: high        │ │
│ │ Source: design-system   │ │
│ │ Logged: experiments/    │ │
│ │   exp-001-2026-...json  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

## Bileşen Detayları

### Butonlar
- Primary: bg #003CBD, text white, rounded-lg (8px), px-16 py-8
- Hover: bg #002a9e
- Disabled: bg #a1a1aa

### Input
- border: 1px solid #e4e4e7
- rounded-lg (8px)
- focus: border #003CBD, ring 2px #003CBD/20
- padding: 8px 12px

### Code Block
- bg: #18181b
- text: #e4e4e7
- rounded-lg
- font: monospace 13px
- padding: 16px

### Result Card
- bg: white
- border: 1px solid #e4e4e7
- rounded-lg
- padding: 16px
- shadow: 0 1px 3px rgba(0,0,0,0.1)

### Confidence Badge
- high: bg #dcfce7, text #166534
- low:  bg #fef3c7, text #92400e
- none: bg #fee2e2, text #991b1b

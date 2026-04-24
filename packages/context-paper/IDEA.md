# context-paper

*Tek bir grafik özetten yayına hazır araştırmaya: boşluk analizi, model seçimi, istatistiksel analiz üretimi, CONSORT-AI uyumlu raporlama — sıfır YZ bilgisiyle, uçtan uca. Tıp uzmanlık tezlerini JAMA/NEJM seviyesinde makaleye dönüştüren, context-wiki destekli, istabot.com entegrasyonlu çok-etmenli tez navigatörü.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce USTA'nın ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır — slop yoktur.

---

## 1. Tez (Thesis)

Tıpta uzmanlık tezleri yayın dünyasının en büyük karanlık maddesini oluşturur. Çeşitli ülkelerdeki çalışmalar, tezlerin makaleye dönüşme oranının **üçte birin altında** seyrettiğini göstermektedir (Aggarwal vd., 2019; Singh vd., 2025). Binlerce tez yalnızca kurum arşivlerinde kalır — ne atıf alır, ne kılavuzlara girer, ne de hasta sonuçlarına yansır. Kaybolan şey yalnızca bir akademik metin değildir; araştırma altyapısına yapılan yatırımın, klinik verinin ve araştırmacı emeğinin geri dönüşümsüz israfıdır.

Bu düşük dönüşüm oranının kök nedeni araştırmacının klinik yetersizliği değildir. Neden yapısaldır: yoğun klinik iş yükü altında çalışan uzman adayı, araştırma sorusu formülasyonu, sistematik literatür taraması, istatistiksel analiz, hedef dergi seçimi ve akademik yazım süreçlerini birbirine bağlayacak tutarlı bir iş akışından yoksundur. Her aşama ayrı bir uzmanlık; her geçiş noktası bilişsel yük ve süre kaybı üretir.

**USTA'nın çekirdek iddiası şudur:** Tez-makale dönüşümü bir yaratıcı yazım problemi değil, bir **orkestrasyon** problemidir. Araştırmacının elinde ham klinik sorusu, grafik özet taslağı ve hasta verisi zaten vardır. Eksik olan, bu girdileri PICO yapılandırması, literatür boşluk analizi, istatistiksel model seçimi, analiz üretimi ve dergi-uyumlu manuskript taslağına dönüştüren sistematik bir pipeline'dır.

USTA bu pipeline'ı üç temel yeteneğin birleşimi olarak kurar:

1. **rag-wiki destekli bilgi katmanı:** Karpathy LLM-wiki örüntüsüyle derlenen klinik-akademik mikro-wiki'ler — literatür, kılavuzlar, metodoloji prosedürleri ve dergi konfigürasyonları tek bir sentezlenmiş bilgi tabanında yaşar.

2. **istabot.com istatistiksel analiz RAG'ı:** İstabot platformunda AI ve insan uzman desteğiyle üretilmiş, JAMA/NEJM Q1 seviye dergilerde kullanıma hazır istatistiksel analiz tabloları, yorumlar, yöntem metinleri ve chart/figürler. Bu, "sıfırdan analiz yap" değil, "doğrulanmış analiz şablonundan derle" yaklaşımıdır.

3. **Grafik özetten makaleye ters-derleme:** AutoVA grafik özet üretir; USTA bunun tersini yapar. Araştırmacının grafik özetini (tez planındaki ana hikâyeyi) giriş noktası olarak alır ve buradan geriye doğru — PICO, literatür, istatistik, yöntem, sonuç — makale bileşenlerini yapılandırır.

Üstüne Karpathy autoresearch döngüsü oturur: USTA her başarılı tez-makale dönüşümünden öğrenir, prompt'larını günceller, kalite ratchet'ını yükseltir. Sistem her iterasyonla daha keskin olur.

**Temel değer önermesi:** Araştırmacı grafik özetini ve tez planını yükler, hedef dergisini seçer; USTA araştırma sorusunu yapılandırır, literatür boşluğunu haritalandırır, istatistiksel analiz önerisi sunar ve dergi-uyumlu manuskrit taslağı üretir — araştırmacı bilimsel argümanı yazar, USTA yapıyı ve düzeni kurar.

---

## 2. Problem

### 2.1 Grafik Özet–Makale Uçurumu

Birçok tez danışmanı, öğrenciden ilk adımda "tezinin grafik özetini çiz" der. Grafik özet, araştırmanın hikâyesini — popülasyon, müdahale, karşılaştırma, sonuç — tek bir görsel düzlemde özetler. Ama bu grafik özetin makaleye dönüşmesi için araştırmacının sırayla: araştırma sorusunu PICO'ya dönüştürmesi, sistematik literatür taraması yapması, istatistiksel analiz tasarlaması, dergi formatına uygun yazım yapması gerekir. Bu süreçlerin her biri ayrı bir engeldir; aralarında sistematik bir bağlantı yoktur.

### 2.2 İstatistiksel Analiz Darboğazı

Uzmanlık tezlerinin en kırılgan noktası istatistiksel analizdir. Araştırmacı çoğu zaman:
- Hangi testi kullanacağını bilmiyor (parametrik vs nonparametrik, regresyon vs korelasyon)
- Güç analizi yapmıyor
- %95 güven aralığı (CI) raporlamıyor
- Grafiklerini "güzel görünen" ama yayın standardını karşılamayan formatlarda üretiyor (pasta grafikleri vs standart çubuk grafikler)

Bu eksiklikler, dergiye gönderimde en sık revizyon nedenidir. JAMA ve NEJM, p-değeri yanına CI zorunluluğu, pre-registration gerekliliği ve CONSORT/PRISMA uyumu gibi metodolojik standartları son on yılda katılaştırmıştır. Araştırmacının bu standartları ezberlemesi bekleniyor; ama bu standartları sistematik biçimde uygulayan bir araç yok.

### 2.3 Literatür Tarama Sürdürülemezliği

PubMed'de her yıl **milyonlarca** yeni makale yayımlanıyor. Sistematik derleme iş yükü, PROSPERO verilerine göre ortalama **67 hafta** sürüyor (Borah vd., 2017). Uzmanlık öğrencisi bu yükü taşıyamaz; sonuçta ya yüzeysel bir tarama yapar ya da tarihi geçmiş kaynaklarla çalışır.

### 2.4 Dergi Uyum Ruletçesi

Araştırmacı çoğu zaman hedef dergisini sezgiye dayalı seçiyor. Tezin kapsamı JAMA Surgery'ye mi yoksa Annals of Surgery'ye mi uygun? Abstract yapısı structured mı unstructured mı olmalı? Kelime sınırı kaç? Bu kararlar çoğu zaman submission'dan sonra — rejection mektubuyla — öğreniliyor.

### 2.5 Mevcut Araçların Yetersizliği

| Kriter | SciSpace | Elicit | ChatGPT | USTA |
|---|:---:|:---:|:---:|:---:|
| Grafik özetten makaleye | ✗ | ✗ | ✗ | ✓ |
| PICO yapılandırması | ✗ | Kısmi | ✗ | ✓ (ajan) |
| İstatistiksel analiz RAG | ✗ | ✗ | ✗ | ✓ (istabot) |
| Dergi config sistemi | ✗ | ✗ | ✗ | ✓ (YAML) |
| Kendi kendini iyileştirme | ✗ | ✗ | ✗ | ✓ (autoresearch) |
| Etik navigatör (yazar değil) | ✗ | Kısmi | ✗ | ✓ |
| CONSORT-AI uyumu | ✗ | ✗ | ✗ | ✓ |

Kesişim boşluğu: **grafik özetten makaleye + istatistik RAG + dergi config + autoresearch + etik navigatör** kombinasyonunu sunan bir araç mevcut değil.

---

## 3. Nasıl Çalışır (How It Works)

### Temel İçgörü 1 — Grafik Özet Makalenin "Kaynak Kodu"dur

AutoVA makaleyi grafik özete derler. USTA bunun **tersini** yapar: grafik özet, makalenin tüm yapısal bileşenlerinin — PICO, ana bulgular, hasta akışı, sonuç ölçütleri — sıkıştırılmış halini taşır. Bu görsel girdiden geriye doğru çalışarak araştırma sorusu, literatür stratejisi ve makale iskeleti oluşturulabilir. Grafik özetin her paneli bir makale bölümüne harita olur.

```
Grafik Özet Taslağı (Araştırmacı çizimi / tez planı)
       ↓
  Visual-to-Logic Mapper
  (Panel → PICO, hasta akışı → çalışma tasarımı)
       ↓
  RQ-Enhancer + PICO Architect
  (Yapılandırılmış araştırma sorusu)
       ↓
  Literature Scout (rag-wiki)
  (MeSH terimleri, boşluk analizi, ilgili çalışmalar)
       ↓
  StatDesigner (istabot.com RAG)
  (Test seçimi, güç analizi, analiz şablonu)
       ↓
  ThesisPlan JSON ←─────────────────────────────────────┐
  (PICO + literature_gap + statistics[source_quote])    │
       ↓                                                │
  IMRaD Bölüm Ajanları                                 │
  (Dergi-uyumlu taslak)                    AutoVA VisualAbstract JSON
       ↓                                   (alternatif giriş — Visual-to-Logic
  Ethics Checker + Journal Matcher          Mapper aşaması atlanır, doğrudan
  (CONSORT-AI uyumu, hedef dergi önerisi)   ThesisPlan JSON üretilir)
       ↓
  Tez / Makale Taslağı (Markdown + kaynak notları)
```

**AutoVA → USTA kısa yolu:** Araştırmacı grafik özeti AutoVA ile daha önce ürettiyse, VisualAbstract JSON elinde hazırdır. Bu durumda Visual-to-Logic Mapper aşaması atlanır; JSON doğrudan ThesisPlan JSON'a dönüştürülür ve pipeline Literature Scout'tan devam eder. Aynı `source_quote` disiplini, aynı dergi config sistemi — yalnızca giriş noktası farklıdır.

### Temel İçgörü 2 — istabot.com RAG: İstatistik Bilgisi "Wiki" Olarak Yaşar

İstabot.com platformunda AI ve insan istatistikçi desteğiyle üretilmiş analiz içerikleri, rag-wiki örüntüsüyle derlenmiş bir mikro-wiki olarak USTA'nın bilgi tabanına girer. Bu mikro-wiki'de:

- **Analiz tabloları:** Regresyon çıktıları, OR/HR/RR tabloları, Kaplan-Meier eğrileri — her biri `source_quote` disipliyle manuscript'e verbatim bağlı
- **Yöntem metinleri:** "Bağımsız iki grubun karşılaştırılmasında normal dağılıma uyum Shapiro-Wilk testi ile değerlendirildi..." gibi, dergiye hazır cümleler
- **Yorum şablonları:** "HR 0.73 (%95 CI: 0.58–0.92; p=0.008); müdahale grubunda olay riski %27 daha düşüktü" — standart raporlama kalıpları
- **Chart/figürler:** JAMA/NEJM standartlarına uygun forest plot, funnel plot, ROC eğrisi, çubuk grafik formatları

Bu RAG'ın kritik farkı şudur: içerik halüsinasyon değil, **istabot.com'da AI + insan uzman tarafından doğrulanmış** istatistiksel analizlerdir. Sistem "analiz üretmez", doğrulanmış analiz şablonlarını araştırmacının verisine uyarlar.

### Temel İçgörü 3 — Çok-Etmenli Mimari: Her Aşama Farklı Uzmanlık Gerektirir

Tek bir "makale yaz" komutu çalışmaz. Her aşama farklı epistemik kimliğe sahip ajanla çalışır:

- **Visual-to-Logic Mapper:** Grafik özetin görsel öğelerini (hasta akışı panelleri, müdahale kolları, sonuç ölçütleri) yapılandırılmış PICO bileşenlerine ve çalışma tasarımı parametrelerine dönüştürür.

- **RQ-Enhancer:** Araştırmacının serbest metinle yazdığı klinik problemi net, ölçülebilir ve dergiye uygun bir araştırma sorusuna yapılandırır. Birden fazla formülasyon sunar; araştırmacı seçer.

- **PICO Architect:** Popülasyon, müdahale, karşılaştırma, sonuç bileşenlerini Sokratik sorgulama ile rafine eder. Eksik parametreler için hedefli sorular yöneltir.

- **Literature Scout:** rag-wiki'den MeSH terimleri üretir, PubMed tarama stratejileri önerir, boşluk analizi yapar. Sistematik tarama protokolü iskeletini çıkarır.

- **StatDesigner:** istabot.com RAG'ından çalışma tasarımına uygun istatistiksel testleri, güç analizi parametrelerini ve raporlama şablonlarını getirir. Araştırmacıya "verinin için Student t-testi değil Mann-Whitney U testi uygun çünkü..." gibi açıklamalı öneriler sunar. Her sayısal değer — p-değeri, HR, CI — `source_quote` alanıyla istabot.com mikro-wiki'sindeki kaynak sayfasına verbatim bağlanır. Bu bağlantı olmadan değer ThesisPlan JSON'a girmez; ManuscriptForge'un ResultsNarrator'ı bu disiplini miras alır.

- **Journal Matcher:** Araştırmanın kapsamını, tasarımını ve sonuçlarını dergi scope beyanlarıyla eşleştirir. Uyumluluk skoru ve gerekçesi ile önerir.

- **Ethics Checker:** CONSORT-AI, PRISMA 2020 ve ICMJE yazar sorumluluğu kriterlerine karşı kontrol yapar. AI slop, halüsinasyon ve intihal göstergeleri tarar.

**IMRaD bölüm ajanlarının epistemik kısıtları** (ThesisPlan JSON'dan beslenen downstream katman):

| Ajan | Görev | Kısıt |
|---|---|---|
| **IntroWriter** | Literatür boşluğu ve araştırma sorusu | Üretmez — yapılandırır; yalnızca rag-wiki sayfalarından argüman kurar |
| **MethodsExpander** | PICO + istatistik → yöntem bölümü | Kaynak gerektirmeyen tek bölümdür; tamamı ThesisPlan JSON'dan türetilir |
| **ResultsNarrator** | İstatistik → narrative; tablo/şekil yer tutucu | Yorumlama yasaktır — yalnızca sonuç raporlama; tablo ve figür için yer tutucu üretir, gerçek görsel manuel yerleştirilir |
| **DiscussionSynthesizer** | Bulgular + sınırlılıklar + klinik çıkarım | Her önerme "tartışma taslağı" etiketi taşır; araştırmacı onayı olmadan bölüm tamamlanmaz |

### Temel İçgörü 4 — USTA → ManuscriptForge Köprüsü: Doğrulanmış JSON Aktarımı

USTA'nın pipeline'ı bir ara çıktı üretir: **ThesisPlan JSON**. Bu JSON, ManuscriptForge'un VisualAbstract JSON'u gibi, downstream pipeline'ın "tek gerçek kaynağı"dır.

```json
{
  "pico": { "P": "...", "I": "...", "C": "...", "O": "..." },
  "research_question": { "statement": "...", "source_quote": "grafik özet, panel 2" },
  "study_design": "rct",
  "literature_gap": { "summary": "...", "mesh_terms": [...] },
  "statistics": [
    {
      "test": "Mann-Whitney U",
      "rationale": "...",
      "result": { "value": "p=0.032", "ci": "0.58–0.92", "source_quote": "istabot.com/survival/hr-table-002" }
    }
  ],
  "journal": "jama",
  "consort_ai_checklist": { "status": "partial", "missing_items": [...] }
}
```

Bu JSON ManuscriptForge'un dört IMRaD ajanına şu şekilde akar:

| USTA Ajanı | Ürettiği JSON Alanı | ManuscriptForge Ajanı |
|---|---|---|
| Literature Scout | `literature_gap` | IntroWriter |
| PICO Architect + StatDesigner | `pico` + `statistics` | MethodsExpander |
| StatDesigner | `statistics[].result` | ResultsNarrator |
| Literature Scout + Ethics Checker | `literature_gap` + checklist | DiscussionSynthesizer |

ManuscriptForge'un `manuscript-config.yaml` sistemi doğrudan kullanılır. JAMA, Lancet, NEJM, BMJ — her derginin abstract yapısı, kelime sınırı, kaynak formatı, tablo politikası YAML'de kodlanmıştır. Araştırmacı dergi seçtiğinde doğru config yüklenir; aynı ThesisPlan JSON farklı config'lerle farklı dergilere uyumlu taslak üretir.

### Temel İçgörü 5 — Navigatör, Yazar Değil

Tüm çıktılar "TASLAK — Araştırmacı doğrulaması gerekli" etiketiyle işaretlenir. Hiçbir bölüm araştırmacının onayı olmadan nihai metin olarak sunulmaz. Discussion önerileri "önerme" etiketiyle gelir. Sistem araştırmacıyı kaynaklarını kontrol etmeye, kendi ifadelerini üretmeye ve akademik sorumluluğunu üstlenmeye yönlendirir.

---

## 4. Mimari (Architecture)

USTA üç katmandan oluşur. rag-wiki + ManuscriptForge + istabot.com örüntülerinin tez navigasyonuna uyarlanmış bileşimidir.

### Katman 1 — Bilgi Katmanı (Knowledge Layer)

Ham kaynak gerçeğini ve doğrulanmış analiz şablonlarını tutar. Değişmez.

```
usta/
├── raw/
│   ├── thesis-plans/          # Araştırmacı tez planları (grafik özet, niyet beyanı)
│   ├── manuscripts/           # Referans tez/makale PDF'leri
│   └── guidelines/            # Dergi kılavuzları, etik çerçeveler
│
├── wiki/
│   ├── clinical/              # Klinik alan mikro-wiki'leri
│   │   ├── cardiology.md
│   │   ├── surgery.md
│   │   └── ...
│   ├── methodology/           # Araştırma metodolojisi wiki
│   │   ├── rct-design.md
│   │   ├── cohort-design.md
│   │   ├── meta-analysis.md
│   │   └── systematic-review.md
│   ├── statistics/            # istabot.com RAG mikro-wiki'si
│   │   ├── tests/
│   │   │   ├── parametric.md
│   │   │   ├── nonparametric.md
│   │   │   ├── regression.md
│   │   │   └── survival.md
│   │   ├── tables/            # Doğrulanmış tablo şablonları
│   │   ├── charts/            # Standart chart formatları
│   │   ├── interpretations/   # Yorum kalıpları
│   │   └── methods-text/      # Yöntem bölümü cümle şablonları
│   └── journals/              # Dergi scope ve config wiki'si
│
├── configs/
│   ├── manuscript-configs/    # ManuscriptForge YAML'leri
│   │   ├── jama.yaml
│   │   ├── lancet.yaml
│   │   ├── nejm.yaml
│   │   └── bmj.yaml
│   ├── study-templates/       # Çalışma tipi şablonları (RCT, kohort, meta-analiz)
│   └── checklist-configs/     # CONSORT-AI, PRISMA 2020, STROBE
│
├── prompts/
│   ├── visual-mapper_v1.md
│   ├── rq-enhancer_v1.md
│   ├── pico-architect_v1.md
│   ├── literature-scout_v1.md
│   ├── stat-designer_v1.md
│   ├── ethics-checker_v1.md
│   ├── intro_v1.md            # IntroWriter — literatür boşluğu ve araştırma sorusu
│   ├── methods_v1.md          # MethodsExpander — PICO + istatistik → yöntem bölümü
│   ├── results_v1.md          # ResultsNarrator — source_quote disiplinli narrative
│   └── discussion_v1.md       # DiscussionSynthesizer — önerme etiketli tartışma
│
└── eval/
    ├── thesis-cases/          # Pilot tez vakaları (ground truth)
    ├── pico-quality/          # PICO netlik skorları
    ├── journal-compliance/    # Dergi uyum benchmark'ları
    └── stat-accuracy/         # İstatistik doğruluk test seti
```

### Katman 2 — Runtime Katmanı (Operational Layer)

Grafik özet + tez planı alır, çok-etmenli pipeline çalıştırır, taslak çıktılar üretir.

```
Grafik Özet + Tez Planı
         ↓
  Visual-to-Logic Mapper → PICO Yapısı
         ↓
  RQ-Enhancer → Yapılandırılmış Araştırma Sorusu
         ↓
  Literature Scout → Boşluk Analizi + MeSH Stratejisi
         ↓                                    ↓
  StatDesigner ←→ istabot.com RAG    Journal Matcher ←→ Dergi Config
         ↓                                    ↓
  ManuscriptForge Entegrasyonu (IMRaD bölüm ajanları)
         ↓
  Ethics Checker (CONSORT-AI / PRISMA kontrolü)
         ↓
  Taslak Manuskrit + Kalite Raporu + Dergi Uyum Skoru
```

Her ajan stateless çalışır. Aynı grafik özet farklı dergi config'leriyle paralel işlenebilir.

### Katman 3 — Geri Yazma Katmanı (Writeback Layer)

Araştırmacı tarafından onaylanan çıktılar ve kalite dönüşümleri sisteme geri yazılır.

```
Araştırmacı Onayı / Düzeltmesi
         ↓
  PromptRefiner: Başarısızlık örüntüsü analizi
         ↓
  İlgili prompt güncellenir (rq-enhancer_v2.md, stat-designer_v2.md)
         ↓
  Ratchet kuralı: yeni prompt önceki benchmark setini geçmelidir
         ↓
  Wiki writeback: Yeni öğrenilen kalıplar mikro-wiki'ye eklenir
```

Writeback örnekleri:
- "Acil cerrahi kohort çalışmalarında PICO'da 'C' bileşeni çoğu zaman eksik kalıyor" → `wiki/methodology/cohort-design.md`'ye kural eklenir
- "JAMA Surgery başvurularında 'Importance' bölümü mutlaka 3 cümleden uzun olmalı" → `configs/manuscript-configs/jama-surgery.yaml`'a eklenir
- "Hayatta kalım analizinde HR raporlaması CI olmadan kabul edilmiyor" → `wiki/statistics/interpretations/`'a kural eklenir

---

## 5. Operasyonlar (Operations)

### Senaryo 1 — Grafik Özetten PICO ve Araştırma Sorusu

```bash
usta analyze thesis-plan.pdf --graphical-abstract abstract.png
```

Visual-to-Logic Mapper grafik özeti parse eder, PICO bileşenlerini çıkarır. RQ-Enhancer birden fazla araştırma sorusu formülasyonu üretir. Araştırmacı seçer; sistem seçimi writeback'e alır.

### Senaryo 2 — İstatistiksel Analiz Önerisi

```bash
usta stat-recommend --design rct --outcome binary --groups 2
```

StatDesigner istabot.com RAG'ından çalışma tasarımına uygun testleri, güç analizi parametrelerini ve raporlama şablonlarını getirir. Çıktı: test seçimi gerekçesi, yöntem bölümü cümle taslağı, tablo şablonu.

### Senaryo 3 — Tam Tez-Makale Dönüşümü

```bash
usta transform thesis-plan.pdf --graphical-abstract abstract.png \
  --journal jama --study-type rct --output draft/
```

Aşama 1 — USTA pipeline: Visual-to-Logic Mapper → PICO Architect → Literature Scout → StatDesigner → Journal Matcher → Ethics Checker → **ThesisPlan JSON** (`draft/thesis-plan.json`)

Aşama 2 — ManuscriptForge pipeline (ThesisPlan JSON giriş olarak):

```bash
manuscriptforge generate draft/thesis-plan.json --journal jama --output draft/
```

İki aşama birleşince: grafik özet taslağından JAMA uyumlu, `source_quote` disiplinli, bölüm bazlı IMRaD manuskrit taslağı elde edilir. Çıktılar `draft/` altında bölüm bölüm kaydedilir.

### Senaryo 4 — Çok Dergi Karşılaştırması

```bash
usta compare thesis-summary.json --journals jama,lancet,nejm
```

Aynı tez özetinden üç farklı config ile üç taslak üretilir. Dergi uyum skorları, kelime sınırı farkları ve format gereksinimleri karşılaştırılır. Araştırmacı hedef dergisini veriye dayalı seçer.

### Senaryo 5 — CONSORT-AI / PRISMA Uyum Kontrolü

```bash
usta checklist draft/methods.md --standard consort-ai
```

Ethics Checker taslak üzerinde CONSORT-AI kontrol listesini çalıştırır. Eksik maddeler işaretlenir, tamamlama önerileri sunulur.

### Senaryo 6 — Tekil Bölüm Güncelleme (Bölüm Writeback)

```bash
usta revise draft/discussion.md --feedback "tartışma çok kısa, sınırlılıklar eksik"
```

DiscussionSynthesizer yalnızca bu bölümü revize eder, rag-wiki'den ek sayfa çeker, yeni taslak üretir. Diğer bölümlere dokunmaz. Araştırmacı onaylarsa revizyon örüntüsü `prompts/discussion_v{N+1}.md`'ye kural olarak eklenir ve ratchet seti çalıştırılır.

---

## 6. istabot.com Entegrasyonu — İstatistik RAG Detayı

USTA'nın en kritik farklanma noktası istabot.com entegrasyonudur. Bu entegrasyon bir "istatistik chatbot" değil, **doğrulanmış istatistiksel bilgi tabanının rag-wiki olarak yapılandırılması**dır.

### İstabot RAG Mikro-Wiki Yapısı

```
wiki/statistics/
├── decision-trees/
│   ├── test-selection.md      # Hangi koşulda hangi test?
│   ├── sample-size.md         # Güç analizi karar ağacı
│   └── normality-check.md     # Normal dağılım test prosedürü
│
├── templates/
│   ├── table1-demographics.md # Demografik tablo şablonu
│   ├── table2-outcomes.md     # Birincil sonuç tablosu şablonu
│   ├── forest-plot.md         # Forest plot üretim şablonu
│   └── kaplan-meier.md        # Hayatta kalım eğrisi şablonu
│
├── methods-library/
│   ├── descriptive.md         # "Sürekli değişkenler ortalama ± SD olarak..."
│   ├── inferential.md         # "İki grup karşılaştırması için..."
│   ├── regression.md          # "Çoklu lojistik regresyon modelinde..."
│   └── survival.md            # "Hayatta kalım analizi Kaplan-Meier yöntemiyle..."
│
├── interpretations/
│   ├── odds-ratio.md          # OR yorumlama kalıpları
│   ├── hazard-ratio.md        # HR yorumlama kalıpları
│   └── confidence-interval.md # CI raporlama kuralları
│
└── journal-requirements/
    ├── jama-stats.md          # JAMA istatistik raporlama gereksinimleri
    ├── nejm-stats.md          # NEJM istatistik standartları
    └── lancet-stats.md        # Lancet raporlama kuralları
```

### Guideline-in-the-Loop: İstatistik Doğrulaması

Her istatistik önerisi kılavuza karşı denetlenir:
- Seçilen test, veri tipiyle uyumlu mu? (sürekli/kategorik × normal/non-normal × bağımlı/bağımsız)
- Güven aralığı raporlanıyor mu?
- Çoklu karşılaştırma düzeltmesi gerekiyor mu? (Bonferroni, FDR)
- Grafik formatı dergi standardını karşılıyor mu? (pasta grafik → çubuk grafik dönüşümü)

Denetimden geçmeyen öneri araştırmacıya sunulmaz; açıklama notu ile "bu teste geçmedi, alternatif: ..." önerisi yapılır.

### source_quote Disiplini: İstatistik Katmanında Halüsinasyon Bariyeri

AutoVA ve ManuscriptForge'daki `source_quote` disiplini istabot.com RAG katmanında da uygulanır. Kural: **ThesisPlan JSON'a giren her sayısal değerin istabot.com mikro-wiki'sindeki kaynak sayfasına verbatim bağlantısı zorunludur.**

```json
// İzin verilen
{
  "test": "Mann-Whitney U",
  "result": {
    "value": "p=0.032",
    "ci": "0.12–0.54",
    "source_quote": "istabot.com/wiki/nonparametric/mann-whitney#reporting-template-tr"
  }
}

// Reddedilen — source_quote eksik
{
  "test": "Mann-Whitney U",
  "result": { "value": "p≈0.03" }   // "yaklaşık" kabul edilemez; bağlantı zorunlu
}
```

Bu kural ManuscriptForge'un ResultsNarrator'ına miras geçer: USTA'dan gelen JSON'daki her istatistik, `source_quote` ile istabot.com'a bağlı olduğu için ResultsNarrator slayt ve manuscript metnine bu değerleri uydurma riski olmadan taşır.

---

## 7. Ne Yapmaz (What It Does Not Do)

- **Tam otomatik makale yazmaz.** Üretilen metin taslaktır; araştırmacının akademik sesi, bilimsel argümanı ve klinik yorumu araştırmacıya aittir. Her bölüm "TASLAK" etiketiyle gelir.
- **İstatistiksel analiz çalıştırmaz.** USTA istatistik hesaplaması yapmaz; doğrulanmış analiz şablonlarını ve yöntem metinlerini sunar. Gerçek analiz istabot.com'da veya araştırmacının tercih ettiği yazılımda (SPSS, R, Stata) yapılır.
- **Kaynak uydurmaz.** rag-wiki'de bulunmayan kaynak makale metnine girmez; yer tutucu olarak işaretlenir. Discussion bölümünde her iddia kaynağıyla etiketlenir.
- **Tanı veya tedavi önerisi yapmaz.** Klinik yorum "önerme" etiketiyle gelir, klinik karar verme sistemini ikame etmez.
- **Serbest metin girdisinden çalışmaz.** Giriş her zaman yapılandırılmış formattadır: grafik özet, tez planı veya yapılandırılmış JSON. Ham serbest metin pipeline'a girmez.
- **İntihal kontrolü veritabanı değildir.** Pattern bazlı AI slop tespiti yapar; Turnitin/iThenticate gibi veritabanı bazlı intihal tespiti kapsamında değildir.

---

## 8. Neden Şimdi (Why Now)

**LLM'lerin tıbbi içerik yapılandırma olgunluğu:** GPT-4 sınıfı modeller, PICO formülasyonu ve literatür tarama stratejisi üretiminde anlamlı performans göstermeye başladı (Khraisha vd., 2024; Schmidt vd., 2024). Sistematik derleme taramasında LLM'ler makale eleme iş yükünü %40–90 azaltabiliyor (Liu vd., 2025).

**istabot.com ekosistemi olgunlaştı:** İstabot platformunda AI + insan uzman desteğiyle üretilen istatistiksel analiz içerikleri, yeterli hacme ve kaliteye ulaştı. Bu içerikler doğrudan rag-wiki olarak yapılandırılabilir.

**ManuscriptForge pipeline'ı hazır:** Dergi config sistemi (YAML), IMRaD ajan mimarisi ve Ethics Checker ManuscriptForge'da zaten tasarlandı. USTA bu pipeline'ları upstream bileşen olarak kullanır.

**AutoVA + USTA simetrisi:** AutoVA "makaleden grafik özete" çalışır; USTA "grafik özetten makaleye" çalışır. İki sistem aynı JSON şemasını, aynı `source_quote` disiplinini ve aynı dergi config'lerini paylaşarak birbirinin tersi-tamamlayıcısı olur.

**Akademik etik çerçeveler netleşti:** ICMJE, COPE ve CONSORT-AI standartları, AI destekli akademik yazımda "navigatör vs. yazar" ayrımını tanımladı (Oxford AI Ethics Consortium, 2024). USTA bu ayrımı tasarımın merkezine koyar.

**Tez-makale dönüşüm oranı krizi fark edildi:** YÖK ve uluslararası kaynaklar tezlerin %70+'ının hiç yayımlanmadığını belgeledi. Bu kayıp artık kurumsal düzeyde gündem maddesi; çözüm ihtiyacı somut ve acil.

---

## 9. Kim Fayda Sağlar (Who Benefits)

**Tıp Uzmanlık Öğrencileri:** Yoğun klinik rotasyonlar arasında tez yazan, araştırma metodolojisi konusunda sınırlı eğitim almış, ilk kez makale hazırlayan araştırmacılar. USTA grafik özetten başlayarak yapılandırılmış bir yol sunar.

**Tez Danışmanları:** Öğrencinin dağınık fikrini PICO'ya dönüştürmek, istatistik hatalarını düzeltmek ve dergi uyumunu sağlamak için harcanan saatleri azaltır. Danışman bilimsel yönlendirmeye odaklanır.

**İstabot.com Kullanıcıları:** İstabot'ta üretilen analizlerin doğrudan makale yöntem ve sonuç bölümlerine entegre edilmesi, "analiz yaptım ama makaleye nasıl yazarım" darboğazını çözer.

**Araştırma Hastaneleri ve Üniversiteler:** Kurumsal tez-makale dönüşüm oranını artırır. Kurumun akademik çıktı verimliliği ölçülebilir biçimde yükselir.

**Dergi Editörleri:** Metodolojik olarak daha iyi yapılandırılmış, CONSORT-AI/PRISMA uyumlu, format açısından hazır başvurular alırlar.

---

## 10. Kısıtlamalar (Constraints)

### Ölçülen / Hesaplanan Sınırlar

- **Yalnızca yapılandırılmış giriş:** Grafik özet + tez planı veya yapılandırılmış JSON zorunlu. Ham serbest metin girdisi kabul edilmez.
- **istabot.com RAG kapsamı:** İstatistik önerileri istabot.com mikro-wiki'sinde bulunan analizlerle sınırlıdır. Wiki'de olmayan analiz tipi yer tutucu olarak işaretlenir.
- **MVP için sınırlı klinik alan:** İlk versiyonda genel cerrahi, iç hastalıkları ve acil tıp alanları. Yeni alan ≈ 8–16 saat wiki derleme çalışması.
- **MVP için sınırlı dergi ailesi:** JAMA, Lancet, BMJ, NEJM config dosyaları. ManuscriptForge ile paylaşılır.
- **Discussion bölümü rag-wiki kapsamıyla sınırlı:** Literatür wiki'sinde olmayan kaynak Discussion taslağına girmez.
- **Araştırma tipi:** MVP'de RCT, kohort ve sistematik derleme desteklenir. Kalite iyileştirme projeleri, vaka serileri sonraki iterasyonda.

### Tahmini / Henüz Ölçülmemiş Sınırlar

- **Pipeline end-to-end süresi:** Grafik özet parse (~3s) + ajan zinciri (~30-90s) + ManuscriptForge entegrasyonu (~20-60s). Tahmini P50: 2-3 dakika, P95: 5-8 dakika.
- **LLM maliyeti / tez:** Tam pipeline (6 ajan + ManuscriptForge) ≈ $0.20–0.80 (Gemini Flash default). Discussion derinliği rag-wiki çağrılarıyla maliyet artabilir.
- **Yeni klinik alan ekleme süresi:** Klinik mikro-wiki + istatistik şablonları + pilot tez vakaları ≈ 2–4 hafta.

---

## 11. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **StatDesigner yanlış test önerirse klinik sonuç yanıltıcı** | Orta | Yüksek | Her öneri guideline-in-the-loop denetiminden geçer; istabot.com'da insan doğrulaması zorunluluğu |
| **Grafik özet parse hatası PICO'yu bozar** | Yüksek (başlangıçta) | Yüksek | Visual-to-Logic Mapper çıktısı araştırmacıya onaylatılır; otomatik kabul yok |
| **rag-wiki'de güncel olmayan literatür** | Yüksek | Orta | Wiki sayfa tarih damgası gösterilir; araştırmacı güncelliği doğrular; periyodik ingest planlanır |
| **Araştırmacı taslağı doğrudan yayımlar** | Orta | Yüksek | Tüm çıktılar "TASLAK" etiketi + Ethics Checker uyarısı taşır |
| **Discussion ajanı wiki dışı kaynak üretir** | Orta | Yüksek | Her kaynak referansı wiki sayfa ID'sine bağlanır; eksik ID Ethics Checker tarafından bloklanır |
| **Dergi config güncel değilse format hatası** | Yüksek | Orta | Config versiyonlama + ratchet eval seti her güncelleme döngüsünde çalışır |
| **İstatistik RAG Türkçe–İngilizce karışımı** | Orta | Orta | Mikro-wiki sayfaları dil bazlı etiketlenir; çıktı dili araştırmacı tercihine göre filtrelenir |
| **Autoresearch döngüsü küçük örnekte overfitting** | Orta | Orta | Ratchet kuralı: yeni prompt önceki tüm benchmark setini geçmelidir |

---

## 12. Açık Sorular (Open Questions)

1. **istabot.com entegrasyon derinliği nedir?** API bazlı gerçek zamanlı çağrı mı, yoksa periyodik wiki snapshot'u mu? MVP için snapshot yaklaşımı daha güvenli görünüyor; ama canlı entegrasyon uzun vadede daha değerli.

2. **Grafik özet formatı standardize mi olmalı?** Araştırmacının çizimi fotoğraf olarak mı alınacak, yoksa yapılandırılmış bir şablon üzerinden mi girilecek? Vision LLM'in serbest çizim parse kapasitesi vs. yapılandırılmış form girdisi trade-off'u.

3. **MeRAG ve ÇIRAK bağlantısı ne kadar sıkı?** USTA–MeRAG–ÇIRAK ekosistemi kavramsal olarak tanımlanmış; ama teknik entegrasyon derinliği (ortak micro-wiki, paylaşılmış writeback, cross-module sinyaller) henüz netleşmedi.

4. **Türkçe vs İngilizce çıktı:** Tez Türkçe yazılırken makale İngilizce mi olacak? İki dilli pipeline mı yoksa çeviri ajanı mı? Çeviri kalitesi vs doğrudan İngilizce üretim trade-off'u.

5. **Pilot tez seçimi ve ground truth:** Ratchet eval seti için hangi tezler kullanılacak? YÖK Tez Merkezi'nde bulunan ama yayına dönüşmemiş tezler doğal adaydır; ama ground truth (bu tez ideal makaleye nasıl dönüşürdü) kim tarafından üretilecek?

6. **CONSORT-AI kontrol listesi otomasyonu:** Tam otomatik kontrol mü yoksa "araştırmacıya sorarak" yarı-otomatik mi? Her madde için evidence seviyesi farklı — bazıları JSON'dan doğrulanabilir, bazıları araştırmacı beyanı gerektirir.

7. **Discussion taslağı ne kadar "önerme" olabilir?** Araştırmacının akademik sesi ile sistem önerisi arasındaki sınır nerede çizilecek — doğrudan önerme mi yoksa yalnızca yapı iskeleti mi? Her önermeyi "tartışma taslağı" etiketiyle sunmak yeterli mi, yoksa araştırmacı her cümleyi onaylamalı mı?

8. **Çok yazarlı manuscript için revidasyon akışı:** Danışman ve öğrenci aynı taslakta çalışıyorsa hangi bölümün kimin sorumluluğunda olduğu nasıl izlenir? Bölüm bazlı "sahip" tanımı ThesisPlan JSON'a metadata olarak eklenmeli mi?

9. **Kaynak formatı (AMA/Vancouver/APA) seçimi:** Dergi config'den otomatik mi alınsın, yoksa araştırmacıdan onay mı isteniyor? JAMA AMA ister, Lancet Vancouver — config zaten bunu biliyor; araştırmacıya sormak friction ekler ama doğrulama fırsatı verir.

---

## 13. Değerlendirme — Ratchet Beklentisi

USTA'da tez-makale dönüşüm kalitesi **sadece ileriye gider.** Bu politikadır.

**Ratchet kuralı:** Her ajan prompt'u (`rq-enhancer_v{N+1}.md`, `stat-designer_v{N+1}.md` vb.) yalnızca önceki versiyonun geçtiği benchmark setini geçerse aktife alınır. Aksi halde `prompts/history/` altında kalır.

**Her iterasyonda sorulacak sorular:**
- PICO yapılandırması uzman değerlendiricinin önceki puanının altına düştü mü?
- StatDesigner'ın önerdiği test, çalışma tasarımıyla uyumlu mu? (%100 olmalı)
- **ResultsNarrator'ın ürettiği her sayısal değer `source_quote` ile örtüşüyor mu?** (istabot.com kaynak yolu doğrulanmış olmalı)
- **Discussion taslağında rag-wiki'de olmayan kaynak referansı var mı?** (eksik ID → Ethics Checker bloklama)
- Ethics Checker CONSORT-AI / PRISMA uyum skoru önceki iterasyondan düşük mü?
- Yeni eklenen prompt kuralı eski geçen vakaları bozuyor mu?
- Prompt uzunluğu context window'u tehdit ediyor mu?
- Daha kısa bir kural aynı sonucu veriyor mu?

Eşit koşullarda daha kısa prompt kazanır.

---

## 14. Başarı Kriterleri (Success Criteria)

**Teknik metrikler (zorunlu):**
- **PICO netlik artışı:** Uzman değerlendirici ölçeğinde başlangıç PICO'ya göre anlamlı puan artışı (Likert 1-5, hedef: ≥ 1.5 puan artış).
- **Dergi uyumluluk skoru:** Hedef derginin 100 puanlık uyumluluk matrisinde ≥ %90 (pilot ölçüm: %66 → %94 artışı doğrulanmış).
- **İstatistik doğruluğu:** StatDesigner'ın önerdiği test ile uzman incelemesi arasında uyum ≥ %90.
- **Sıfır halüsinasyon:** İstatistik değerlerde uydurma sayı veya kaynak üretilmemesi.
- **Ratchet geçerliliği:** Her yeni prompt versiyonu önceki benchmark setinin tamamını geçiyor.

**Verimlilik metrikleri:**
- **Literatür tarama süresi kısalması:** En az %30 (hedef ölçüm: literature scout + boşluk analizi süresi vs manuel tarama).
- **Okunabilirlik artışı:** Key Points (Soru–Bulgu–Anlam) entegrasyonuyla kabul edilebilirlik potansiyeli artışı (hedef: ~%40).
- **Çok dergi dönüşümü:** Aynı tezden ikinci dergi taslağı üretme süresi < 10 dakika.

**Kullanıcı metrikleri:**
- **Araştırmacı memnuniyeti:** Pilot kullanıcı değerlendirmesinde ≥ 4/5 ortalama.
- **Düzenleme oranı:** Methods ve Results bölümleri "kabul edilebilir başlangıç" olarak değerlendiriliyor — > %70 hedef. Discussion için > %40 hedef.
- **Tez-makale dönüşüm oranı artışı:** USTA kullanıcılarında referans grubuna göre anlamlı artış (uzun vadeli metrik).

---

## 15. Ekosistem Konumu (Ecosystem Position)

USTA, cerebra ekosisteminde diğer modüllerle şu ilişkileri kurar:

### Upstream Bağımlılıklar (USTA'ya besleyen)
- **rag-wiki** → USTA'nın bilgi tabanı. Klinik, metodoloji ve istatistik mikro-wiki'leri rag-wiki örüntüsüyle derlenir.
- **source-curator** → USTA'nın wiki'sine giren kaynakların kalite kapısı. Her klinik kılavuz, makale ve veri seti curator'dan geçer.
- **istabot.com** → İstatistiksel analiz RAG'ının kaynağı. Doğrulanmış analiz şablonları, yorum kalıpları ve chart formatları.

### Downstream Tüketiciler (USTA'nın beslediği)
- **IMRaD bölüm ajanları (USTA içi)** → ThesisPlan JSON, IntroWriter / MethodsExpander / ResultsNarrator / DiscussionSynthesizer'a akar; manuskrit taslağı üretilir. (ManuscriptForge artık ayrı bir modül değil, USTA'nın manuscript katmanıdır.)
- **AutoVA** → USTA tersine çalışır ama aynı JSON şemasını paylaşır. USTA çıktısı AutoVA'ya grafik özet üretimi için verilebilir; AutoVA VisualAbstract JSON'u USTA'ya kısa yol girdisi olarak verebilir.

### Sibling Modüller (USTA–MeRAG–ÇIRAK)
- **MeRAG:** Hastaların sorularını kanıta dayalı yanıtlara çeviren klinik modül. MeRAG'dan gelen gerçek klinik sorular, USTA'da tez konusu önerileri için girdi olabilir.
- **ÇIRAK:** Arayüz ve prototip geliştiren tasarım odaklı modül. USTA çıktılarını klinik karar destek araçlarına veya eğitim materyallerine dönüştürür.

### Cerebra ile İlişki (Dual-mode)
- **Standalone mod:** USTA tek başına çalışır; kendi `raw/`, `wiki/` ve `eval/` klasörleriyle grafik özetten makale taslağına pipeline sunar. Cerebra gerektirmez.
- **Cerebra-composed mod:** USTA, cerebra substrate'ine mikro-wiki olarak bağlanır. Writeback'ler provenance graph'a dahil olur, cross-module sinyaller (MeRAG → USTA tez konusu önerisi) aktifleşir, ratchet eval framework'ten miras alınır.

---

## 16. Bağlam / Referanslar (Context / References)

**Akademik Kaynaklar**
- Aggarwal vd. (2019) — Tezlerin makaleye dönüşüm oranları ve engeller
- Singh vd. (2025) — NBE tezlerinin yayın dönüşüm oranı
- Borah vd. (2017) — Sistematik derleme süre ve iş yükü analizi (PROSPERO)
- Thirunavukarasu vd. (2023) — Tıpta LLM'ler (Nature Medicine)
- Khraisha vd. (2024) — LLM'lerin sistematik derlemedeki etkinliği
- Schmidt vd. (2024) — LLM ile veri çıkarma fizibilite çalışması
- Liu vd. (2025) — LLM'lerin literatür taramasındaki rolü
- Scherbakov vd. (2025) — LLM araçlarının sistematik derleme üzerine etkisi
- Page vd. (2021) — PRISMA 2020 raporlama kılavuzu
- Eriksen & Frandsen (2018) — PICO arama stratejisi kalitesi
- ICASR (2024) — Sistematik derleme otomasyonu bildirisi

**Etik Çerçeveler**
- Oxford AI Ethics Consortium (2024) — AI'ın akademik araştırmada etik kullanımı
- AI for Scientific Integrity Working Group (2025) — Bilimsel bütünlük ve AI
- Artificial Intelligence–Assisted Academic Writing Taskforce (2025) — AI destekli yazımda risklere ve yönetişim
- ICMJE authorship criteria — AI destekli yazımda yazar sorumluluğu

**Karpathy Pattern**
- Karpathy AutoResearch (2024) — PromptRefiner döngüsünün ilham kaynağı
- Karpathy LLM-Wiki + IDEA.md (2024) — Bu dosyanın format standardı

**Cerebra Ekosistemi**
- `idea.md` — enterprise-wiki ana framework kontratı
- `rag-wiki.md` — Literature Scout ve StatDesigner'ın bilgi tabanı örüntüsü
- `notebooklm-infographic (autova).md` — AutoVA: tersine çalışan karşıt parça
- `notebooklm-reports (manuscript).md` — ManuscriptForge: IMRaD pipeline kaynağı
- `source-curator.md` — Kaynak kalite kapısı

**Teknik Stack**
- Python 3.11+, Pydantic v2, Typer
- LLM Providers: Gemini 2.5 Flash (default), Claude Sonnet (fallback)
- rag-wiki: micro-wiki HTTP/local API
- istabot.com: RAG mikro-wiki (snapshot veya API)
- Dergi config: YAML (ManuscriptForge paylaşımlı)
- Çıktı: Markdown + HTML (Pandoc ile DOCX/PDF export)
- Kontrol listeleri: CONSORT-AI, PRISMA 2020, STROBE (YAML)

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-paper",
  "version": "0.1.0",
  "bin": { "context-paper": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-paper forge` | Generate manuscript from thesis/abstract | `--input`, `--output` | `--config`, `--format`, `--language`, `--dry-run` |
| `context-paper verify` | Verify source_quote discipline in manuscript | `--input` | `--format`, `--verbose` |
| `context-paper compile` | Compile IMRaD sections from structured JSON | `--input`, `--output` | `--config`, `--format`, `--language` |
| `context-paper batch` | Process multiple theses in batch | `--input`, `--output` | `--config`, `--concurrency` |
| `context-paper eval` | Ratchet evaluation against baseline | `--input`, `--baseline` | `--output`, `--format` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Forge Manuscript

```bash
context-paper forge \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/manuscript.json \
  --config fixtures/config/jama-visual-abstract.yaml \
  --format json
```

**Input:** Raw thesis abstract text.
**Expected Output:** JSON with IMRaD sections (`introduction`, `methods`, `results`, `discussion`), each with `source_quote` fields.
**Exit Code:** `0`

#### Scenario 2 — Verify source_quote Discipline

```bash
context-paper verify \
  --input fixtures/json/manuscript-imrad-sample.json \
  --format json
```

**Input:** Structured manuscript JSON.
**Expected Output:** Validation report: pass/fail for each numerical claim's `source_quote`.
**Exit Code:** `0` if all pass, `2` if violations found.

#### Scenario 3 — Compile to Markdown

```bash
context-paper compile \
  --input fixtures/json/manuscript-imrad-sample.json \
  --output output/manuscript.md \
  --format md \
  --language en
```

**Input:** Structured IMRaD JSON.
**Expected Output:** Formatted Markdown manuscript with section headers and citations.
**Exit Code:** `0`

#### Scenario 4 — Missing Input (Error)

```bash
context-paper forge --output output/manuscript.json
```

**Expected:** `Error: required option '--input <path>' not specified`
**Exit Code:** `1`

#### Scenario 5 — Nonexistent Input (Error)

```bash
context-paper forge --input nonexistent.txt --output output/ms.json
```

**Expected:** `Error: Input file not found: nonexistent.txt`
**Exit Code:** `1`

#### Scenario 6 — Dry Run

```bash
context-paper forge \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/manuscript.json \
  --dry-run
```

**Expected:** Prints extraction plan (detected sections, token estimate). No files written.
**Exit Code:** `0`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Manuscript generated |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | source_quote missing, hallucination detected |
| `3` | External dependency error | LLM/istabot API timeout |

### Output Schema (forge)

```json
{
  "study_id": "string",
  "title": "string",
  "imrad": {
    "introduction": { "background": "string", "gap": "string", "objective": "string" },
    "methods": { "design": "string", "setting": "string", "population": "string", "statistics": ["string"] },
    "results": { "demographics": {}, "primary_outcome": { "by_group": [], "p_values": [] } },
    "discussion": { "main_finding": "string", "limitations": ["string"] }
  }
}
```

---

> **Living Artifact Notu.** Bu belge yaşayan bir artefakttır: istabot.com entegrasyonu derinleştikçe, yeni klinik alan wiki'leri eklendikçe, pilot tez dönüşümlerinden yeni ratchet kuralları öğrenildikçe güncellenir. Tezdeki "grafik özetten makaleye ters-derleme" çerçevesi değişmedikçe teze dokunma; değiştiyse tezi yeniden yaz, önceki versiyonu `## Eski Tez` olarak altına bırak.

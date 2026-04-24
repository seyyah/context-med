# context-slides

*Doğrulanmış JSON kaydından — context-va veya context-paper çıktısından — hedef konferansın veya sunumun format konfigürasyonuna göre, sıfır halüsinasyonlu, slide-by-slide yapılandırılmış ve konuşmacı notlarıyla donatılmış akademik sunum destesi üreten çok-etmenli bir sunum navigatörü.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce DeckForge'un ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır — slop yoktur.

---

## 1. Tez (Thesis)

Bir akademisyen aynı araştırmayı defalarca farklı formatlarda sunar: 10 dakikalık konferans sunumu, 45 dakikalık klinik grand rounds, poster, webinar, yönetim özeti. Her seferinde aynı kaynak veriden yeni bir slayt destesi üretilir — ellerle, sıfırdan.

Bu tekrarlayan emeğin kökünde bir paradoks var: araştırmanın "gerçeği" sabittir, değişen yalnızca **sunum formatı ve izleyici derinliğidir.** Süre kısalınca ne atılır, izleyici değişince ne öne çıkar, görsel ne kadar detaylı olmalı — bu kararlar her seferinde yeniden alınıyor, ama yanıtları aslında kural tabanlı.

DeckForge'un çekirdek iddiası şudur: **AutoVA'nın ürettiği VisualAbstract JSON ve ManuscriptForge'un IMRaD yapısı, sunum içeriğinin "tek gerçek kaynağı"dır.** Bu kaynaktan hedef konferansın format konfigürasyonuna — süre, izleyici, slayt sayısı, görsel yoğunluk — göre otomatik slayt destesi üretmek bir yaratıcılık problemi değil, bir **derleme (compilation) problemidir.**

Üstüne rag-wiki katmanı oturur: Discussion slaytları için literature gap notları, klinik çıkarımlar ve sınırlılıklar micro-wiki'den çekilir. Autoresearch döngüsüyle her iterasyon kendi başarısızlık geçmişinden öğrenir.

**Temel değer önermesi:** Araştırmacı JSON'u yükler, konferansı seçer; sistem süreye ve izleyici profiline uygun, halüsinasyonsuz, konuşmacı notlu bir slayt destesi taslağı sunar. Araştırmacı içeriği değil, anlatıyı ve tonu yazar.

---

## 2. Problem

### 2.1 Aynı Araştırma — Sonsuz Manuel Format Dönüşümü

Bir klinik araştırmacı tipik bir yılda aynı çalışmayı en az 3–5 farklı bağlamda sunar: ulusal konferans (10 dk), uluslararası kongre (15 dk), klinik toplantı (45 dk), üniversite semineri (60 dk), dernek webinarı. Her biri farklı slayt sayısı, farklı görsel yoğunluk, farklı anlatı yapısı. Her dönüşüm 2–6 saat manüel çalışma.

### 2.2 PowerPoint Başlangıç Problemi

Boş bir PowerPoint dosyası, boş bir Word dosyasından daha tehlikeli bir başlangıç noktasıdır: araştırmacı önce yapıyı, sonra içeriği, sonra görseli kurar. Bu üç boyutun aynı anda yönetilmesi genellikle en kritik slaytın — Results — en zayıf görselleştirilmesi sonucuyla biter.

### 2.3 Slide'ların Manuscript'ten Sapması

Araştırmacılar manuscript ile slayt destesini bağımsız olarak geliştirdiğinden ikisi arasında sayısal tutarsızlıklar oluşabilir. Bir p-değeri manuscriptte "0.048" iken slaytlarda "0.05 civarı" olarak yuvarlanabilir. Tıbbi sunumda bu fark bir dinleyicinin klinik kararını etkileyebilir.

### 2.4 Konuşmacı Notlarının Standart Dışılığı

Konuşmacı notları çoğu zaman slaytın tam metni olarak yazılır ("Bu slayt X'i gösteriyor") ya da hiç yazılmaz. İkisi de yararsızdır. İdeal konuşmacı notu dinleyicinin nereye baktığını, sonraki slayta nasıl geçileceğini ve kritik sayısal değerlerin nasıl vurgulanacağını bilir.

---

## 3. Nasıl Çalışır (How It Works)

### Temel İçgörü 1 — Konferans Format Konfigürasyonu = Derleme Parametresi

Tıpkı AutoVA'nın `jama.yaml` ile JAMA piksel standardını tanımlaması gibi, DeckForge her sunum türü için bir `deck-config.yaml` dosyası kullanır:

```yaml
# config/conference-10min.yaml
duration_min: 10
slide_count: 10-12
audience: specialist-physician
language: tr
visual_density: high         # az metin, büyük görsel
speaker_notes: brief         # 2-3 cümle, saat vurgusu
imrad_mapping:
  title:    1
  intro:    1
  methods:  2
  results:  3-4
  discussion: 2
  conclusion: 1
  qna_buffer: 1
```

```yaml
# config/grand-rounds-45min.yaml
duration_min: 45
slide_count: 35-45
audience: multidisciplinary-clinical
language: tr
visual_density: medium
speaker_notes: detailed
imrad_mapping:
  title:         1
  case_context:  3
  intro:         5
  methods:       6
  results:       10-12
  discussion:    8
  conclusion:    3
  qna_buffer:    3
```

Araştırmacı yalnızca config dosyasını seçer; içerik dağılımı ve görsel yoğunluğu otomatik belirlenir.

### Temel İçgörü 2 — Slayt Türleri Farklı Ajan Kimliklerine Sahiptir

```
VisualAbstract JSON + ManuscriptForge IMRaD + Deck Config
         ↓
  [ TitleSlideAgent | IntroSlideAgent | MethodsSlideAgent ]
  [ ResultsSlideAgent | DiscussionSlideAgent | ConclusionSlideAgent ]
         ↓
  [ SpeakerNotesAgent ]   ← her slayt için ayrı çalışır
         ↓
  Slayt Destesi (Markdown → PPTX / HTML / PDF)
```

- **TitleSlideAgent:** Başlık, yazarlar, kurum, konferans adı, tarih. Kaynak JSON'dan alır.
- **IntroSlideAgent:** "Neden bu araştırma?" sorusunu rag-wiki'den çektiği literature gap ile yapılandırır. 1–2 slayt, yoğun metin değil soru + bağlam.
- **MethodsSlideAgent:** PICO yapısını, hasta sayısını ve istatistik yöntemini config'e göre daraltır. 10 dk sunumda tek slayt; 45 dk'da 4–6 slayt.
- **ResultsSlideAgent:** JSON metriklerini `source_quote` disipliniyle slayt metin bloklarına çevirir. Grafik için yer tutucu üretir; veri aracı veya manuel yerleştirme için açık bırakır.
- **DiscussionSlideAgent:** Bulguların anlamını rag-wiki ile destekler; klinik çıkarım ve sınırlılıkları yapılandırır.
- **ConclusionSlideAgent:** Tek mesaj (take-home message), action item, açık sorular.
- **SpeakerNotesAgent:** Her slayt için süre tahmini, geçiş cümlesi ve vurgulanacak sayısal değeri içeren konuşmacı notu yazar.

### Temel İçgörü 3 — SpeakerNotesAgent Saati Takip Eder

Konuşmacı notunun en değerli parçası "bu slayta ne kadar zaman ayır" bilgisidir. SpeakerNotesAgent config'deki toplam süreyi slayt sayısına dağıtır, kritik slaytlara (Results) fazla süre verir, geçiş slaytlarına minimum süre atar ve her nota saniye cinsinden hedef süre ekler:

```
[Results-2 | Hedef: ~90 sn]
"p=0.048 vurgula — 'istatistiksel olarak anlamlı ama klinik sınırda' diyebilirsin.
CI aralığını göster, dar olduğunu belirt. Sonraki slayta geçmeden soru var mı diye bak."
```

### Temel İçgörü 4 — Sıfır Halüsinasyon Aynı Disiplinle Korunur

ResultsSlideAgent'ın her sayısal değeri JSON'daki `source_quote` ile eşleşmelidir. Eşleşmeyen değer slayta girmez; Ethics Checker slayt bazında uyarı üretir. Manuscript ile slayt arasındaki sayısal tutarlılık bu mekanizma ile yapısal olarak sağlanır.

---

## 4. Mimari (Architecture)

### Katman 1 — Bilgi Katmanı (Knowledge Layer)

- `VisualAbstract JSON` — doğrulanmış araştırma verisi
- `ManuscriptForge IMRaD Markdown` — bölüm bazlı kaynak metin (opsiyonel; JSON yeterliyse kullanılmaz)
- `deck-configs/` — konferans/sunum YAML dosyaları
- `prompts/` — slayt-yazım prompt'ları (results_slide_v1.md, speaker_notes_v1.md...)
- `rag-micro-wiki/` — Discussion slaytları için literatür bağlamı

### Katman 2 — Runtime Katmanı (Operational Layer)

```
JSON Parser + Config Loader
       ↓
 PICO Mapper → slide_plan[] oluştur
       ↓
 Parallel Agents:
   TitleSlideAgent | IntroSlideAgent | MethodsSlideAgent
   ResultsSlideAgent | DiscussionSlideAgent | ConclusionSlideAgent
       ↓
 SpeakerNotesAgent (her slayt üzerinde sequential)
       ↓
 Ethics Checker (sayısal doğrulama)
       ↓
 Deck Assembler → Markdown / PPTX / HTML
```

### Katman 3 — Geri Yazma Katmanı (Writeback Layer)

Araştırmacının "kullandı / düzeltti / reddetti" geri bildirimi PromptRefiner'a iletilir. Hangi slayt türlerinde düzenleme oranı yüksekse o ajan prompt'una öncelikli kural eklenir.

---

## 5. Operasyonlar (Operations)

### Senaryo 1 — Tek Format Sunum Destesi

```bash
deckforge generate abstract.json --config conference-10min --output deck/
```

JSON parse, config yükleme, yedi ajan paralel çalışma, SpeakerNotesAgent, Ethics Checker, Markdown çıktı.

### Senaryo 2 — Çoklu Format Karşılaştırması

```bash
deckforge compare abstract.json --configs conference-10min,grand-rounds-45min,webinar-30min
```

Aynı JSON'dan üç farklı config ile üç taslak. Araştırmacı hangi slaytın hangi formatta nasıl değiştiğini karşılaştırır.

### Senaryo 3 — Mevcut Desteden Yeni Format

```bash
deckforge convert existing-deck.md --to grand-rounds-45min
```

Onaylanmış bir slayt destesini farklı konferans formatına dönüştürür; mevcut konuşmacı notlarını ve revizyonları korur.

### Senaryo 4 — Konuşmacı Notu Yenileme

```bash
deckforge speaker-notes deck/ --duration 12 --style aggressive
```

Yalnızca konuşmacı notlarını yeniden üretir; slayt içeriğine dokunmaz. "Aggressive" mod: her slayta katı zaman sınırı, geçiş cümlesi zorunlu.

---

## 6. Ne Yapmaz (What It Does Not Do)

- **Tasarım ve grafik üretmez.** Slayt içeriğini ve yapısını üretir; grafik, ikon ve şekil için yer tutucu bırakır. Görsel üretim AutoVA'nın görevidir, DeckForge'un değil.
- **Tam otomatik sunum yazmaz.** Taslak sunar; araştırmacı anlatı sesini ve bağlamsal yorumu ekler.
- **Halüsinasyona tolerans göstermez.** Sayısal değer JSON'da yoksa slayta girmez.
- **Serbest metin girdisinden çalışmaz.** Giriş her zaman doğrulanmış JSON veya ManuscriptForge çıktısıdır.
- **Görsel tasarım kararı vermez.** Renk, font, arka plan — bunlar kullanıcının seçtiği tema şablonunda kalır; DeckForge içerik katmanına odaklanır.

---

## 7. Neden Şimdi (Why Now)

**Üçlü pipeline tamamlandı:** AutoVA JSON üretir, ManuscriptForge manuscript yazar, DeckForge sunum destesi oluşturur — üçü aynı kaynaktan beslendiğinde araştırmacı tek bir doğrulanmış JSON ile tüm yayın çıktı biçimlerini kapsayabilir.

**Yapılandırılmış slayt üretiminin teknik eşiği aşıldı:** Markdown-to-PPTX dönüştürücüler (python-pptx, Marp, Reveal.js) artık program-kontrollü slide layout oluşturmayı destekliyor. YAML konfigürasyonu ile içerik ve yapı ayrıştırıldığında derleme mantığı doğrudan uygulanabilir.

**Konferans formatlarının YAML'e dökülmesi defalarca kanıtlandı:** AutoVA'nın `jama.yaml` deneyimi, yayın standardlarının makine-okunabilir hale gelebildiğini gösterdi. Aynı pattern, konferans format kuralları için geçerli.

---

## 8. Kim Fayda Sağlar (Who Benefits)

**Klinik Araştırmacılar:** Yılda birden fazla konferansta sunum yapanlar için her format dönüşümü saatler yerine dakikalar alır. Boş slayt yerine yapılandırılmış iskelet ile başlarlar.

**Tıp Uzmanlık Öğrencileri:** İlk konferans sunumunu hazırlamak için ne yapılacağını bilmeyenler için format konfigürasyonu yapısal bir rehber sağlar.

**Danışmanlar ve Mentörler:** Öğrencinin taslak destesini düzeltmek yerine içeriği ve anlatıyı tartışmaya odaklanabilirler.

**Akademik Birimler:** Kurumsal kongre katılımları için standartlaştırılmış sunum çıktısı elde ederler; marka tutarlılığı konfigürasyon katmanında sağlanır.

**Konferans Organizatörleri:** Belirli konferanslar için hazır format config dosyaları sunabilirler; katılımcılar konferans şablonunu seçip araştırma JSON'larını yükler.

---

## 9. Teknik Mimari (Technical Architecture)

**Stack:**
- Python 3.11+, Pydantic v2, Typer
- python-pptx (PPTX üretimi) veya Marp CLI (Markdown → PDF/HTML slide)
- LLM Providers: Claude Sonnet (default), Gemini 2.5 Flash (fallback)
- rag-wiki local API veya micro-wiki dosya sistemi
- Çıktı: Markdown + PPTX + HTML (Reveal.js)

**Ajan rolleri:**
- **TitleSlideAgent:** Başlık bloğu; config'den kurum, yazarlar ve konferans bilgisini alır.
- **IntroSlideAgent:** Problem + research gap; rag-wiki'den Literature Gap özeti çeker.
- **MethodsSlideAgent:** PICO, n, istatistiksel test; config'e göre slayt sayısı belirlenir.
- **ResultsSlideAgent:** JSON metriklerini `source_quote` ile slayt bloklarına çevirir; grafik yer tutucu üretir.
- **DiscussionSlideAgent:** Karşılaştırmalı bulgular, sınırlılıklar; rag-wiki desteği.
- **ConclusionSlideAgent:** Take-home message, action item, açık sorular.
- **SpeakerNotesAgent:** Süre tahmini, geçiş cümlesi, vurgu noktaları.
- **Ethics Checker:** Sayısal değer JSON uyumu, slop uyarısı.
- **PromptRefiner:** Başarısız slayt türlerinden ratchet güncelleme.

---

## 10. Kısıtlamalar (Constraints)

- **Grafik üretimi DeckForge kapsamı dışındadır.** Grafik ve şekil için yer tutucu üretir; gerçek görsel AutoVA veya manuel araç gerektirir.
- **MVP için sınırlı config ailesi:** conference-10min, grand-rounds-45min, webinar-30min, poster (landscape). Yeni config ≈ 2–4 saat.
- **python-pptx template sınırları:** Karmaşık grid layout'lar PPTX'te değil Reveal.js HTML çıktısında daha iyi desteklenir. MVP için HTML birincil çıktı.
- **SpeakerNotesAgent süre tahminleri:** Araştırmacının konuşma hızına bağlıdır. Config'deki `words_per_minute` parametresi ile kalibre edilebilir ama varsayılan ≈ 130 kelime/dk.
- **rag-wiki kapsamı Discussion slaytlarını sınırlar:** Wiki'de olmayan literatür bağlamı yer tutucu olarak işaretlenir.

---

## 11. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **ResultsSlideAgent JSON'dan sapan değer üretir** | Orta | Yüksek | `source_quote` validasyonu her sayısal değer için zorunlu; Ethics Checker slayt bazında denetler |
| **Config → template mapping uyumsuzluğu** | Yüksek (başlangıçta) | Orta | Her config için ratchet eval seti; yeni template ekleme süreci onay gerektiriyor |
| **SpeakerNotesAgent monoton not yazar** | Orta | Düşük | Stil config parametresi (brief / detailed / aggressive); ratchet bu boyutu da izler |
| **Araştırmacı slaytı doğrudan sunar** | Orta | Orta | Tüm çıktılar "TASLAK" başlığı taşır; araştırmacı onay akışı olmadan export engellenir |
| **python-pptx layout kısıtlamaları** | Yüksek | Orta | HTML (Reveal.js) birincil çıktı; PPTX ikincil ve basitleştirilmiş layout |

---

## 12. Açık Sorular (Open Questions)

1. **Grafik entegrasyonu:** DeckForge slayt metnini üretir, AutoVA görsel özet PNG'si üretir. İkisi aynı slayta nasıl monte edilecek — otomatik mi, araştırmacı eliyle mi?
2. **Config'in slayt sayısı vs. içerik dengesi:** Bazı araştırmalarda results JSON çok zengin; 10 dakikalık slayta sığmaz. Overflow stratejisi nedir — kesme mi, özetleme mi, araştırmacı seçimi mi?
3. **Çok dilli sunum:** Türkçe JSON'dan İngilizce konferans destesi üretmek istenebilir. Translation agent ayrı bir katman mı olmalı?
4. **Poster formatı:** Konferans posteri slide deck değil, ama aynı JSON ve config mantığı uygulanabilir. Poster bir DeckForge config'i mi olmalı?
5. **Iteratif revizyon akışı:** Araştırmacı 3. ve 4. slaytı beğenmedi — sadece bu slaytları yeniden üretmek mi isteyecek, tüm desteyi mi? Bölümsel revizyon akışı nasıl tasarlanmalı?

---

## 13. Değerlendirme — Ratchet Beklentisi

**Her slayt türü için ratchet kuralı:** `results_slide_v{N+1}.md` yalnızca `results_slide_v{N}.md`'nin geçtiği benchmark set'ini geçerse aktif olur.

**Her iterasyonda sorulacak sorular:**
- ResultsSlideAgent'ın sayısal değerleri `source_quote` ile örtüşüyor mu?
- SpeakerNotesAgent'ın ürettiği süre tahminleri toplam config süresini aşıyor mu?
- Yeni eklenen kural eski geçen test vakalarından birini bozuyor mu?
- Araştırmacı hangi slayt türünde en çok düzenleme yapıyor — bu sinyal öncelikli iyileştirmeyi belirler.

---

## 14. Başarı Kriterleri (Success Criteria)

**Teknik metrikler (zorunlu):**
- **Sıfır JSON-Slide tutarsızlığı:** İlk 20 test vakasında ResultsSlideAgent çıktısındaki tüm sayısal değerler JSON `source_quote` ile örtüşüyor.
- **Config uyumu:** Üretilen slayt sayısı config aralığının içinde; slayt metin uzunlukları visual_density parametresini karşılıyor.
- **Ratchet geçerliliği:** Her yeni prompt versiyonu önceki benchmark set'inin tamamını geçiyor.

**Kullanım metrikleri:**
- **Format dönüşüm süresi:** Aynı JSON'dan ikinci format (ör. 10 dk → 45 dk) üretme < 3 dakika.
- **Araştırmacı düzenleme oranı:** Methods ve Results slaytları için > %60 "kabul edilebilir başlangıç" hedef.
- **SpeakerNotes kullanım oranı:** Araştırmacıların üretilen konuşmacı notlarını silmek yerine düzenleyerek kullanma oranı > %50.

---

## 15. Bağlam / Referanslar (Context / References)

**Sistem Bağlamı**
- `notebooklm-infographic (autova).md` — AutoVA: VisualAbstract JSON kaynağı ve graphical abstract üreticisi
- `notebooklm-reports (manuscript).md` — ManuscriptForge: IMRaD manuscript kaynak metni; DeckForge bu metni slayt formatına kırpar
- `rag-wiki.md` — literatür micro-wiki örüntüsü; Discussion ve Intro slaytlarının bilgi tabanı
- `source-curator` — ham kaynak validasyon sistemi; JSON bütünlüğünün garantörü

**Teknik Araçlar**
- python-pptx — PPTX programatik üretimi
- Marp CLI — Markdown → PDF/HTML slide dönüşümü
- Reveal.js — HTML sunum formatı
- Karpathy IDEA.md (2024) — bu dosyanın format standardı

**Teknik Stack**
- Python 3.11+, Pydantic v2, Typer
- LLM Providers: Claude Sonnet (default), Gemini 2.5 Flash (fallback)
- rag-wiki local API veya micro-wiki dosya sistemi

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-slides",
  "version": "0.1.0",
  "bin": { "context-slides": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-slides generate` | Generate slide deck from wiki/JSON source | `--input`, `--output` | `--config`, `--format`, `--language`, `--dry-run` |
| `context-slides convert` | Convert deck between formats | `--input`, `--output`, `--format` | `--verbose` |
| `context-slides compare` | Compare two deck versions | `--input`, `--baseline` | `--output`, `--format` |
| `context-slides speaker-notes` | Generate speaker notes for existing deck | `--input`, `--output` | `--config`, `--duration`, `--language` |
| `context-slides batch` | Batch generate decks from directory | `--input`, `--output` | `--config`, `--concurrency` |
| `context-slides eval` | Ratchet evaluation against baseline | `--input`, `--baseline` | `--output`, `--format` |

### Additional Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--duration` | `string` | `10min` | Target presentation duration |
| `--slide-count` | `number` | `auto` | Target number of slides |

### Usage Scenarios

#### Scenario 1 — Happy Path: Generate Deck

```bash
context-slides generate \
  --input fixtures/json/manuscript-imrad-sample.json \
  --output output/deck.json \
  --config fixtures/config/conference-10min.yaml \
  --format json
```

**Input:** Structured IMRaD JSON.
**Expected Output:** JSON slide deck with title, content, and layout per slide.
**Exit Code:** `0`

#### Scenario 2 — Convert to PPTX

```bash
context-slides convert \
  --input output/deck.json \
  --output output/deck.pptx \
  --format pptx
```

**Input:** JSON slide deck.
**Expected Output:** PowerPoint file.
**Exit Code:** `0`

#### Scenario 3 — Generate Speaker Notes

```bash
context-slides speaker-notes \
  --input output/deck.json \
  --output output/deck-with-notes.json \
  --duration 10min
```

**Expected Output:** Deck JSON with `speaker_notes` field per slide, timed for target duration.
**Exit Code:** `0`

#### Scenario 4 — Compare Versions

```bash
context-slides compare \
  --input output/deck-v2.json \
  --baseline output/deck-v1.json \
  --format json
```

**Expected Output:** Diff report showing added/removed/changed slides.
**Exit Code:** `0`

#### Scenario 5 — Missing Input (Error)

```bash
context-slides generate --output output/deck.json
```

**Expected:** `Error: required option '--input <path>' not specified`
**Exit Code:** `1`

#### Scenario 6 — Dry Run

```bash
context-slides generate \
  --input fixtures/json/manuscript-imrad-sample.json \
  --output output/deck.json \
  --dry-run
```

**Expected:** Prints generation plan (slide count, sections). No files written.
**Exit Code:** `0`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Deck generated/converted |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | source_quote missing in content |
| `3` | External dependency error | LLM API timeout |

---

> **Living Artifact Notu.** Bu belge yaşayan bir artefakttır. Yeni konferans config dosyaları eklendikçe, SpeakerNotesAgent'ın stil parametreleri genişledikçe ve AutoVA/ManuscriptForge ile entegrasyon derinleştikçe güncellenir. Tezdeki "derleme, üretim değil" çerçevesi değişmedikçe teze dokunma; değiştiyse tezi yeniden yaz, önceki versiyonu `## Eski Tez` olarak altına bırak.

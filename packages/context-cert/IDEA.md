# context-cert

Wiki-temelinde sertifika odaklı sınav, soru ve değerlendirme yönetimi için bir platform. Tıbbi eğitimde LLM-destekli quiz üretimi, kılavuz-döngülü onay süreci ve sertifikasyon programları sunar.

Bu bir idea file'dır. Kendi LLM ajanına (Claude Code, Codex, OpenCode veya benzeri) kopyala-yapıştır olarak verilmek üzere tasarlanmıştır. Amacı belirli bir uygulamayı değil, yüksek seviyede örüntüyü iletmektir. Spesifikleri sen ve ajanın birlikte, kendi alanına göre inşa edeceksiniz.

## Çekirdek Fikir

Tıbbi eğitimde quiz üretimi genelde elle yapılır veya jenerik quiz generator'lara emanet edilir. İlki maliyetlidir (uzmanlık + zaman), ikincisi güvenilmezdir (halüsinasyon, ton tutarsızlığı, kaynak atıf eksikliği). Her iki durumda da:

1. **Kaynak tutarsızlığı** — Soruların üretildiği kaynak ile kullanıcının öğrendiği içerik farklı olabilir. Kurs videosunda A denmiş, quiz'de B sorulmuş.
2. **Kalite kontrolsüzlük** — LLM doğrudan cevap üretir, kimse kontrol etmez. Yanlış seçenekler belirsiz, doğru cevap tartışmalı veya outdated bilgiye dayalı olabilir.
3. **Birikim yok** — Her yeni quiz üretimi sıfırdan başlar. Geçmişte onaylanmış iyi sorular unutulur, benzer hatalar tekrarlanır.
4. **Sertifika mekanizması kopuk** — Quiz'ler bağımsız etkinlikler olarak kalır. Uzun vadeli program (residency değerlendirmesi, CME kredisi, board prep) ile bütünleşemez.

**context-cert** bu dört sorunu şöyle çözer:

- **Wiki-powered generation**: Quiz soruları doğrudan context-wiki'nin micro-domain sayfalarından üretilir. Eğer kullanıcı "preeklampsi" micro-wiki'sinden öğrendiyse, quiz de aynı wiki'den beslenir. Kaynak tutarlılığı garanti edilir.
- **Guideline-in-the-loop approval**: Üretilen her soru bir kılavuza karşı denetlenir. Eşik altındaysa draft olarak işaretlenir ve admin onayına gider. Onaylanan sorular havuza, reddedilenler arşive gider. Kalite kontrolü sistemin merkezindedir.
- **Writeback & ratchet**: Onaylanan iyi sorular wiki'ye geri yazılır, eval set'e dahil edilir. Sonraki üretimler bu birikimden faydalanır. Sistem kendi kendini iyileştirir.
- **Certification programs**: Quiz'ler bağımsız değil, sertifikasyon programlarının parçasıdır. Her program bir wiki domain'e, bir passing threshold'a ve bir question pool'a sahiptir. Kullanıcı programı tamamladığında sertifika üretilir.

Bu dört şey birlikte, "akıllı quiz üretimi" değil, **"güvenilir, birikimli, kaynaklı değerlendirme platformu"** oluşturur.

## Dual-Mode Çalışma

context-cert iki modda çalışır:

### Standalone Mode (Minimal)
Video transcript veya PDF doğrudan verilir → Claude API ile quiz üretilir → draft olarak kaydedilir → admin onaylar → kullanıcı quiz'e girer. context-wiki'ye bağımlılık yok. Bu mod, özellikle **video-based CME** use case'i için uygundur:

```bash
# Video transcript'ten quiz üret
context-cert generate \
  --source video_transcript.txt \
  --count 5 \
  --difficulty medium \
  --audience patient

# Draft soruları gözden geçir
context-cert review --status draft

# Onaylananları havuza ekle
context-cert approve --question-id 123
```

### Wiki-Powered Mode (Recommended)
Quiz üretimi context-wiki'nin micro-domain yapısını kullanır. Soru üretimi wiki sayfalarından beslenir, açıklamalar wiki'ye atıflanır, onaylanan sorular wiki'ye geri yazılır. Bu mod, sistemin uzun vadede birikimli hale gelmesini sağlar:

```bash
# Preeklampsi micro-wiki'sinden 10 soru üret
context-cert generate \
  --wiki-domain "preeklampsi" \
  --count 10 \
  --difficulty hard \
  --audience junior_doctor

# Üretilen soruların wiki sayfalarına atıfları var
# Onaylanan sorular wiki'ye writeback edilir
```

İki mod arasındaki fark: standalone modda sistem her seferinde sıfırdan başlar; wiki-powered modda sistem zamanla birikir.

## Mimari

Üç katman vardır.

### 1. Quiz Generation Layer
LLM-powered soru üretimi. İki kaynak türü desteklenir:

- **Transcript/PDF source**: Video transcript, ders notları, makale PDF'i doğrudan verilir. Claude API'ye gönderilir, structured JSON olarak çoktan seçmeli sorular üretilir.
- **Wiki source**: context-wiki'nin micro-domain sayfaları retrieval ile çekilir, LLM'e bağlam olarak verilir, sorular üretilir. Her soru hangi wiki sayfasından üretildiğini `wiki_page` field'ında taşır.

Üretim sırasında guideline uygulanır:
- Zorluk seviyesine göre talimat (easy → temel tanım, hard → karar verme)
- Hedef kitleye göre ton (patient → sade dil, doctor → klinik terminoloji)
- Seçenek sayısı ve doğru cevap garantisi (4 seçenek, 1 doğru)
- Explanation zorunluluğu (her soru kısa bir açıklama taşımalı)

Üretilen sorular **status: draft** olarak kaydedilir. Hiçbiri doğrudan havuza girmez.

### 2. Approval & Curation Layer
Draft soruların kalite kontrolü. Admin panelde:

- Draft listesi (filtreleme: difficulty, category, wiki_domain)
- Her soru için: question_text, options, explanation, source (transcript veya wiki_page)
- Approve / Reject / Edit butonları
- Approve edilenler **status: approved**, reddedilenler **status: rejected**

Onaylanan sorular:
1. Question pool'a girer (quiz session'larda kullanılabilir)
2. Wiki-powered modda: ilgili wiki sayfasına writeback edilir
3. Eval set'e aday olarak eklenir (periyodik lint pass'te insan onayıyla kalıcı hale gelir)

Reddedilen sorular arşive gider. Sistemin neden reddettiğini öğrenmek için log tutulur (örn: "belirsiz seçenek", "outdated bilgi", "halüsinasyon").

### 3. Session & Certification Layer
Quiz session yönetimi ve sertifikasyon programları.

**Quiz Session**:
- User quiz başlatır (course-based, video-based veya standalone)
- Soru havuzundan filtre ile sorular çekilir (difficulty, category, wiki_domain)
- Her cevap kaydedilir (QuizAnswer)
- Session tamamlandığında skor hesaplanır
- Passing threshold geçilirse `passed: true`

**Certification Program**:
- Her program bir wiki_domain'e bağlı (örn: "preeklampsi", "obstetri-acil")
- Passing threshold (default: 70%)
- Question pool size (minimum kaç onaylanmış soru gerekli)
- Validity period (sertifika kaç gün geçerli, CME için önemli)

Kullanıcı bir programı tamamladığında (quiz passed + course completed varsa):
- Certificate oluşturulur (PDF)
- CME credit kaydedilir (opsiyonel)
- Provenance metadata: hangi sorular soruldu, skor ne oldu, hangi tarihte tamamlandı

## Data Model

Üç core entity:

**QuizQuestion**:
- `course_id`, `video_id` (opsiyonel, standalone modda null)
- `wiki_domain`, `wiki_page` (opsiyonel, wiki-powered modda dolu)
- `question_text`, `options` (JSON: [{text, correct}; 4 option, 1 correct])
- `explanation` (kısa açıklama, her soru için zorunlu)
- `difficulty` (easy/medium/hard), `category` (etiket: "preeklampsi", "GDM")
- `target_audience` (patient/junior_doctor/both)
- `status` (draft/approved/rejected/archived)
- `generated_by` (ai/manual), `approved_by` (admin user_id), `approved_at`

**QuizSession**:
- `user_id`, `program_id` (opsiyonel)
- `quiz_type` (post_video/standalone/certification)
- `started_at`, `completed_at`, `score`, `total_questions`, `passed` (boolean)

**CertificationProgram**:
- `name`, `wiki_domain`, `passing_threshold`, `question_pool_size`
- `validity_period` (days), `cme_credit` (hours)

## Operasyonlar

### Generate
Quiz üretimi. İki mod:

1. **Transcript-based**:
   ```
   context-cert generate --source video_transcript.txt --count 5
   ```
   - Transcript Claude API'ye gönderilir
   - Prompt: "Aşağıdaki transcript'ten {count} adet Türkçe çoktan seçmeli soru üret..."
   - JSON parse → QuizQuestion olarak status: draft kaydedilir

2. **Wiki-based**:
   ```
   context-cert generate --wiki-domain "preeklampsi" --count 10
   ```
   - context-wiki'den "preeklampsi" micro-domain sayfaları retrieval ile çekilir
   - Sayfa içerikleri Claude API'ye bağlam olarak verilir
   - Üretilen her soru `wiki_page` field'ında kaynak sayfasını taşır

Her iki modda da:
- Guideline uygulanır (difficulty, audience, format)
- Halüsinasyon denetimi: LLM'in uydurduğu bilgi var mı?
- Draft olarak kaydedilir, havuza girmez

### Review & Approve
Admin draft soruları listeler → onaylar/reddeder/düzenler:

```
context-cert review --status draft
context-cert approve --question-id 123
context-cert reject --question-id 456 --reason "Belirsiz seçenek"
```

Approve edilen sorular:
- `status: approved`
- Question pool'a girer
- Wiki-powered modda: `wiki_page` bilgisi varsa o sayfaya writeback edilir

Reject edilen sorular:
- `status: rejected`
- Arşive gider, havuza girmez
- Ret nedeni loglanır (gelecekte sistem iyileştirmesi için)

### Session
Kullanıcı quiz başlatır:

```
POST /quiz_sessions → soru havuzundan filtreli sorular çekilir
POST /quiz_sessions/:id/answer → her cevap kaydedilir
POST /quiz_sessions/:id/complete → skor hesaplanır
```

Skor hesaplama:
```
score = (correct_answers / total_questions) * 100
passed = score >= passing_threshold
```

Session tamamlandığında:
- QuizAnswer'lar kaydedilmiş
- Skor hesaplanmış
- passed boolean set edilmiş
- Kullanıcıya sonuç + breakdown gösterilir

### Certification
Program bazlı sertifikasyon:

```
# Program oluştur
context-cert program create \
  --name "Preeklampsi Sertifikası" \
  --wiki-domain "preeklampsi" \
  --passing-score 70 \
  --pool-size 50

# Sertifika ver (quiz passed + course completed şartıyla)
context-cert cert issue --user-id 123 --program-id 456
```

Sertifika PDF oluşturulur:
- Program adı, kullanıcı adı
- Completion date, skor
- Geçerlilik süresi (validity_period)
- CME credit (varsa)
- QR kod (verification link)

## Guideline-in-the-Loop Pattern

context-wiki'nin en kritik örüntüsü: üretilen her çıktı bir kılavuza karşı denetlenir. context-cert bunu quiz üretiminde uygular:

1. **Generation-time guideline**: LLM'e verilen prompt kılavuz kurallarını içerir
   - "SADECE transcript içeriğine dayalı soru üret"
   - "4 seçenek, 1 doğru"
   - "Her soru için kısa açıklama ekle"

2. **Post-generation verification**: Üretilen JSON parse edildikten sonra:
   - Her soruda 4 seçenek var mı?
   - Tam bir tane doğru seçenek var mı?
   - Explanation boş mu?
   - (Wiki-powered modda) Soru wiki sayfasındaki bilgiyle tutarlı mı?

Eşik altındaysa soru direkt reject edilir veya draft olarak işaretlenip admin'e eskalasyona gider.

3. **Human-in-the-loop approval**: Draft sorular mutlaka insan onayından geçer
   - Approve → havuza girer
   - Reject → arşive gider, ret nedeni loglanır
   - Edit → admin düzeltir, sonra approve eder

Bu üç katman birlikte "akıllı ama güvenilmez quiz" değil, "biraz daha az akıllı ama tamamen güvenilir quiz" üretir.

## Writeback & Ratchet

### Writeback
Onaylanan iyi sorular wiki'ye geri yazılır (yalnızca wiki-powered modda):

- Quiz question `wiki_page: "preeklampsi/treatment.md"` taşıyorsa
- Approve edildiğinde o sayfa altına "Common Assessment Questions" bölümü eklenir
- Soru + doğru cevap + explanation yazılır
- Provenance metadata: "Generated by context-cert, approved by admin_123, date: 2026-04-23"

Bu writeback, wiki'nin sadece bilgi kaynağı değil, aynı zamanda değerlendirme kaynağı olduğunu gösterir. Sonraki quiz üretimlerinde LLM bu soruları görür ve benzer kalitede sorular üretmeyi öğrenir.

### Ratchet Eval
Her micro-wiki'nin bir eval seti vardır (altın-standart soru-cevap çiftleri). Yeni bir quiz generation guideline değişikliği yapıldığında:

1. Eval set'teki sorular yeniden üretilir
2. Üretilen sorular altın-standart ile karşılaştırılır
3. Kalite metriği: doğru seçenek overlap, explanation kalitesi, halüsinasyon oranı
4. Beklenti: yeni değişiklik önceki performansı kötüleştirmemeli (ratchet)

Kötüleştiriyorsa değişiklik geri alınır veya insan incelemesi yapılır. Bu disiplin, sistemin zamanla kendi kendini bozmayı engellemesini sağlar.

## context-wiki ile İlişki

### Retrieval Integration
Wiki-powered modda:
- Kullanıcı `--wiki-domain "preeklampsi"` belirtir
- context-cert, context-wiki'nin retrieval API'sini çağırır
- İlgili wiki sayfaları (entity, concept, procedure) retrieval ile çekilir
- Sayfa içerikleri LLM'e bağlam olarak verilir
- Üretilen her soru `wiki_page` field'ında kaynak sayfasını taşır

### Guideline Inheritance
Her micro-wiki'nin bir `operational-schema` vardır (tonlama, kapsam, kırmızı çizgiler). context-cert bu schema'yı quiz üretiminde uygular:
- Eğer "patient" wiki'si sade dil gerektiriyorsa, quiz soruları da sade dilde üretilir
- Eğer "junior_doctor" wiki'si klinik terminoloji kullanıyorsa, quiz soruları da öyle üretilir

Bu sayede quiz ile öğrenme içeriği arasında ton ve kapsam tutarlılığı garanti edilir.

### Writeback Path
Onaylanan quiz soruları wiki'ye geri yazılır:
- `substrate/micro-wikis/preeklampsi/assessment.md` dosyasına eklenir
- Provenance metadata: generated_by, approved_by, approved_at
- Sonraki quiz üretimlerinde bu sayfa retrieval'a dahil olur

Wiki zamanla sadece öğrenme kaynağı değil, aynı zamanda değerlendirme kaynağı haline gelir.

## Standalone vs Ecosystem

### Standalone Package
```bash
pip install context-med-cert
context-cert generate --source transcript.txt --count 5
```

context-wiki'ye bağımlılık yok. Transcript → Claude API → JSON → draft → approve → quiz session. Minimal, hızlı başlangıç.

### Ecosystem Integration
```bash
# context-med full stack kurulu
context-cert generate --wiki-domain "preeklampsi" --count 10
```

context-wiki + context-gate + context-core ile entegre. Wiki retrieval, provenance tracking, guideline inheritance, writeback — hepsi aktif. Uzun vadede birikimli sistem.

İki mod da desteklenir. Kullanıcı basit bir video CME quiz'i için standalone modda başlar, sistem büyüdükçe ecosystem moduna geçiş yapar.

## Kullanım Senaryoları

### 1. Video-based CME
Bir obstetri doktoru ders videosu çeker → transcript otomatik çıkarılır → quiz üretilir → admin onaylar → video sonrası quiz kullanıcıya sunulur. CME kredisi verilir.

### 2. Residency Assessment
Asistan eğitim programı → her rotasyon sonunda quiz → wiki-powered (güncel kılavuzlar micro-wiki'si) → skor takibi → board prep.

### 3. Patient Education
Hasta eğitimi videoları → sade dilde quiz → hastalık yönetimi bilgisini test eder → düşük skor → ek eğitim içeriği önerilir.

### 4. Certification Programs
"Preeklampsi Sertifikası" programı → 50 soruluk pool → kullanıcı 20 soruluk quiz alır → %70 passing → sertifika PDF üretilir → 2 yıl geçerli.

## Neden İşe Yarar

Jenerik quiz generator'lar iki temel sorunla başarısız olur:

1. **Kaynak tutarsızlığı**: Quiz soruları öğrenme içeriğinden bağımsız üretilir. Kullanıcı A'yı öğrenmiş, quiz B'yi soruyor.
2. **Kalite kontrolsüzlük**: LLM doğrudan üretir, kimse kontrol etmez. Yanlış veya belirsiz sorular kullanıcıya gider.

**context-cert** bu iki sorunu şöyle çözer:

- **Wiki-powered generation**: Quiz soruları doğrudan öğrenme kaynağından (context-wiki) üretilir. Kaynak tutarlılığı garanti.
- **Guideline-in-the-loop approval**: Her soru kılavuza karşı denetlenir, insan onayından geçer. Kalite kontrolü garantisi.

İki özellik birlikte, "hızlı ama güvenilmez" yerine "biraz daha yavaş ama tamamen güvenilir" quiz platformu üretir. Tıbbi eğitimde güvenilirlik hızdan önemlidir.

## Teknik Notlar

- **LLM Model**: Claude Sonnet 4.5 (structured output için)
- **Prompt yapısı**: System (rol) + User (transcript/wiki + kurallar) + JSON schema
- **JSON parsing**: ````json` fence strip + JSON.parse + validation
- **Eval metric**: Exact match (altın-standart ile overlap), halüsinasyon rate
- **Writeback format**: Markdown block `<!-- GENERATED -->` tag'i ile işaretlenir
- **PDF generation**: ReportLab veya WeasyPrint (sertifika PDF'i için)
- **CME tracking**: Opsiyonel external sistem entegrasyonu (ACCME API)

## Not

Bu doküman kasıtlı olarak soyuttur. DB schema, API endpoint'leri, admin UI tasarımı, exact prompt template'leri — hepsi implementation detayıdır. context-cert'in özü:

1. **Kaynaklı quiz üretimi** (transcript veya wiki'den)
2. **Kılavuz-döngülü onay** (draft → approve → pool)
3. **Writeback & ratchet** (sistem zamanla birikir)
4. **Sertifikasyon programları** (quiz'ler bağımsız değil, program parçası)

Bu dört şey doğru uygulanırsa, sistem tıbbi eğitimde güvenilir değerlendirme platformu olur. Aksi halde sadece bir quiz generator olur.

Bu dokümanı LLM ajanına ver, mevcut repo state'ini okumasını iste, ve birlikte bir sonraki küçük, kılavuzlu iyileştirmeyi seçin. İlk hedef: standalone modda transcript → quiz üretimi çalışır hale getirmek. Wiki entegrasyonu sonraki adım.

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-cert",
  "version": "0.1.0",
  "bin": { "context-cert": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-cert generate` | Generate quiz questions from source | `--input`, `--output` | `--config`, `--count`, `--difficulty`, `--audience`, `--dry-run` |
| `context-cert review` | List questions by status | | `--status`, `--format`, `--verbose` |
| `context-cert approve` | Approve a draft question | `--input` | `--format`, `--verbose` |
| `context-cert reject` | Reject a draft question with reason | `--input` | `--reason`, `--format` |
| `context-cert eval` | Ratchet evaluation of generation quality | `--input`, `--baseline` | `--output`, `--format` |
| `context-cert batch` | Batch generate from wiki domain | `--input`, `--output` | `--count`, `--difficulty`, `--concurrency` |

### Additional Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--count` | `number` | `5` | Number of questions to generate |
| `--difficulty` | `string` | `medium` | Difficulty: `easy` \| `medium` \| `hard` |
| `--audience` | `string` | `junior_doctor` | Target: `patient` \| `junior_doctor` \| `specialist` |
| `--status` | `string` | `draft` | Filter: `draft` \| `approved` \| `rejected` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Generate from Transcript

```bash
context-cert generate \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/quiz-questions.json \
  --count 5 \
  --difficulty medium \
  --audience junior_doctor
```

**Input:** Raw transcript or thesis text.
**Expected Output:** JSON array of 5 draft quiz questions with options, correct answer, and explanation.
**Exit Code:** `0`

#### Scenario 2 — Generate from Wiki

```bash
context-cert generate \
  --input fixtures/wiki/cardiovascular/ \
  --output output/quiz-cardio.json \
  --count 10 \
  --difficulty hard
```

**Input:** Wiki domain directory.
**Expected Output:** JSON array of quiz questions with `wiki_page` source references.
**Exit Code:** `0`

#### Scenario 3 — Review Drafts

```bash
context-cert review --status draft --format json
```

**Expected Output:** JSON array of pending draft questions.
**Exit Code:** `0`

#### Scenario 4 — Missing Input (Error)

```bash
context-cert generate --output output/quiz.json
```

**Expected:** `Error: required option '--input <path>' not specified`
**Exit Code:** `1`

#### Scenario 5 — Dry Run

```bash
context-cert generate \
  --input fixtures/wiki/cardiovascular/ \
  --output output/quiz.json \
  --dry-run
```

**Expected:** Prints generation plan (source pages, count, difficulty). No files written.
**Exit Code:** `0`


#### Scenario (Extension) — Invalid Config (Error)

```bash
context-cert generate \
  --input fixtures/raw/sample-text.txt \
  --output output/error.json \
  --config fixtures/config/corrupt-config.yaml
```

**Expected:** `Error: Invalid YAML configuration in fixtures/config/corrupt-config.yaml`
**Exit Code:** `1`


#### Scenario (Extension) — Schema / Validation Check (Error)

```bash
context-cert generate \
  --input fixtures/json/invalid-schema-sample.json \
  --output output/failed.json
```

**Expected:** `Error: Validation failed — schema mismatch or hallucination detected.`
**Exit Code:** `2`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Questions generated/approved |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | Question format invalid, hallucination detected |
| `3` | External dependency error | LLM API timeout |

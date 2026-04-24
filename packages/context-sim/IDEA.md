# context-sim

*context-med aracılığıyla yüklenmiş doğrulanmış medikal içerikten, senaryo-tabanlı sanal hasta (virtual patient) simülasyonları üreten ve çalıştıran modül. İki runtime modu destekler:*
*(A) **Runtime-LLM modu** — sesli/yazılı, guardrail'li, OSCE-tarzı açık-uçlu anamnez; gerçek-zamanlı LLM ile akışkan diyalog.*
*(B) **Offline-compiled mode** — LLM ile offline senaryo üretimi, runtime'da deterministik kural motoru (MeasurementRule-benzeri) ile test-seçim ve klinik karar verme simülasyonu; runtime'da LLM bağımlılığı yoktur.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce context-sim'in ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır.

---

## 1. Tez (Thesis)

Objective Structured Clinical Examinations (OSCE), klinik becerilerin ölçülmesinde altın standarttır; ancak insan standart hasta oyuncularına ve uzman öğretim üyesi değerlendiricilere bağımlı olduğu için **ölçeklenemez**. Mevcut dijital çözümler (örn. BodyInteract) katı, menü-tabanlı karar ağaçlarına dayanır; bu yaklaşım hasta anamnezinin akışkan, doğal-dil doğasını temsil edemez — öğrencinin sorduğu her yeni soru aynı cevapları döndürür, fedakârlık sistemin gerçekçiliğinden olur.

context-sim'in çekirdek iddiası şudur: **context-wiki'nin ürettiği micro-wiki yapısı + senaryo matrisi, sanal hastanın klinik bilgi temeli olarak yeterlidir; LLM bir anlatı motoru olarak değil, bir bilgi-asimetrisi motoru olarak kullanılır.** Sistem rastgele metin üretmez; wiki'de kodlanmış klinik gerçekleri, öğrenci doğru soruyu sorana kadar **kasıtlı olarak saklar**. Bu saklama disiplini, sistemin asıl değeridir — zekâ değil, disiplinli çekilmedir.

Sistem NotebookLM'in "PDF'ten podcast" örüntüsü yerine **"micro-wiki'den sanal hasta"** örüntüsünü benimser: kullanıcı (eğitmen veya kurum) context-med'in `raw/` klasörüne klinik kılavuz, vaka sunumu veya senaryo materyalini yükler; context-wiki bunu distile eder; context-sim bu distile bilgiyi alır ve iki farklı paradigmada sanal hasta deneyimi üretir.

### İki Runtime Modu — Aynı Invariant, Farklı Arayüz

**Mod A — Runtime-LLM (Açık-uçlu anamnez):** Öğrenci hastayla sesli/yazılı olarak konuşur, kendi kelimeleriyle soru sorar. LLM persona kuralları ve guardrail altında cevap verir. Disclosure Engine + Semantic Router bilgi asimetrisini korur. Uygun olduğu yer: OSCE-benzeri açık-uçlu anamnez, iletişim becerileri, klinik muhakeme sürecinin doğal akışı.

**Mod B — Offline-compiled (Test-seçim/karar):** Senaryolar LLM (Claude/NotebookLM) ile **offline** üretilir, JSON olarak DB'ye import edilir. Runtime'da **LLM yoktur** — öğrenci hasta sunumunu görür, önceden-derlenmiş test listesinden seçer, `hidden_values`'dan değer reveal edilir, mevcut kural motoru (örn. MeasurementRule) severity/action hesaplar, öğrenci tanı seçer, deterministik skor üretilir. Uygun olduğu yer: klinik karar verme, test seçim disiplini, rule-based patolojilerin (preeklampsi, GDM, HELLP) tanıma eğitimi, yüksek throughput/düşük maliyet eğitim gereken kurumsal platformlar.

İki mod da **aynı invariantı** paylaşır: bilgi asimetrisi (hidden_values / scenario matrix), kaynak-grounded senaryolar (context-wiki), validasyon-önce değerlendirme. Sadece etkileşim katmanı değişir — açık diyalog vs yapılandırılmış seçim.

3D avatarlar, fizik motorları ve görsel hasta simülasyonları **kapsam dışıdır**. context-sim'in ilgisi klinik sadakat ve değerlendirme geçerliliğidir — yüz animasyonu değil.

**Temel değer önermesi:** Eğitmen wiki'ye klinik senaryo yükler; sistem o senaryo için otomatik olarak bir sanal hasta üretir (Mod A'da runtime-LLM persona, Mod B'de JSON scenario contract). Öğrenci hastayla etkileşir, sistem etkileşimi kaydeder, rubriğe göre puanlar, eğitmene yapılandırılmış geri bildirim sunar.

---

## 2. Problem

### 2.1 OSCE'nin Ölçek Problemi

Bir OSCE istasyonu için tipik maliyet: 1 standart hasta oyuncu + 1 değerlendirici öğretim üyesi + 15-30 dakika/öğrenci. 200 öğrencili bir sınıfta tek istasyon için ~100 saat insan emeği gerekir. Sonuç: OSCE yılda 1-2 kez yapılır, formatif değil summatif kalır, öğrenci gerçek deneyim yerine test koşusu yapar.

### 2.2 Mevcut Dijital Simülatörlerin Katılığı

BodyInteract, Shadow Health, i-Human gibi araçların temel mimari kısıtı, karar ağaçlarına dayanmalarıdır:
- Öğrenci yalnızca menüden soru seçebilir; kendi kelimelerini kullanamaz
- Senaryo yazımı manuel ve pahalıdır (bir vaka için haftalarca editorial çalışma)
- Doğal dil varyasyonlarını (sinonim, kolokyal ifade, yanlış telaffuz) tolere etmez
- Öğrenci "sistemi nasıl yenerim" odağına kayar, klinik akıl yürütmeden uzaklaşır

### 2.3 LLM'lerin Saf Hâliyle Tehlikeli Olması

Bir LLM'e "hasta rolü oyna" demek tek başına yetmez çünkü:
- **Halüsinasyon:** Senaryoda olmayan semptomlar uydurur (bu tıp eğitiminde **zararlıdır** — öğrenci yanlış örüntü öğrenir)
- **Karakter kırılması:** "Sanırım kalp krizi geçiriyorum, öyle değil mi doktor?" der — oysa hasta tıbbi terminoloji bilmemeli
- **Bilgi döküntüsü (information spill):** Öğrenci sormadan tüm semptomları bir paragrafta açıklar — anamnez disiplini ölür
- **Öğretici rolüne kayma:** Öğrenciye "şunu sormalıydınız" diyerek değerlendirmeyi sabote eder

### 2.4 Latency Gerçekliği

Doğal klinik diyalog ~1.5-2 saniyelik yanıt döngüsü bekler. 3-5 saniyeyi aşan bir voice-to-voice gecikme, simülasyonun gerçekçiliğini çökertir; öğrenci ritmi kaybeder, etkileşim "chatbot ile konuşma" hissine döner.

### 2.5 Değerlendirmenin Geçerlilik Problemi

Bir LLM-değerlendirici yapılandırılmış JSON skor üretebilir, ama bu skor **insan uzman değerlendiricinin skoruyla ilişkili mi**? Bu soruya cevap verilmeden otomatik değerlendirme tıp eğitiminde meşru olmaz. Validitysiz puanlama, zararlı puanlamadır.

---

## 3. Nasıl Çalışır (How It Works)

### Temel İçgörü 1 — Bilgi Asimetrisi = Sistemin Tek İnvaryantı

context-sim'in tek katı kuralı: **sanal hasta, tüm klinik veriyi sessizce barındırır; veriyi yalnızca öğrenci doğru, klinik-anlamlı soruyu sorduğunda açığa çıkarır.**

```
Sahne Arkası (LLM'in bildiği, ama ağzından kaçırmayacağı):
  - Tanı: Akut Koroner Sendrom (ACS)
  - Kırmızı bayraklar: Kola yayılan göğüs ağrısı, dispne, soğuk terleme
  - Gizli bulgu: Ağrı 30 dakikadır sürüyor, nitrata yanıtsız
  - Must-not-disclose-unless-asked: Aile hikâyesi (babada 55 yaşında MI)

Sahne Önü (Öğrenciye yalnızca soruya göre açılır):
  ÖĞRENCİ: "Göğsünüzde ağrı var mı?"    → HASTA: "Evet, burada bir baskı hissediyorum."  ✓ açılır
  ÖĞRENCİ: "Aileden kalp hastalığı?"    → HASTA: "Babam 55'inde kalp krizi geçirdi."      ✓ açılır
  ÖĞRENCİ: "Nasılsınız?"                → HASTA: "İyi değilim, göğsüm ağrıyor."           ⚠ minimum
  ÖĞRENCİ: (sormadı)                    → HASTA: aile hikâyesini SÖYLEMEZ                 ✓ invariant korundu
```

Bu invaryant **yazılım kontrolüyle** korunur, LLM'in iyi niyetine bırakılmaz (bkz. İçgörü 3 — Guardrail).

### Temel İçgörü 2 — Senaryo Matrisi = Deterministik Sözleşme

Her senaryo, LLM'in özgür davranacağı bir "prompt" değil, **deterministik bir JSON sözleşmesidir**. LLM bu sözleşmenin içinde anlatı üretir; sözleşmenin dışına çıkamaz.

```yaml
# scenarios/acs-chest-pain-01.yaml
scenario_id: acs-chest-pain-01
diagnosis: acute-coronary-syndrome
difficulty: intermediate
duration_target_min: 12

patient_persona:
  name: Mehmet
  age: 58
  gender: male
  occupation: öğretmen
  medical_literacy: low            # Jargon anlamaz, basit dil bekler

presenting_complaint:
  chief: "Göğsümde bir baskı var"
  onset_min_ago: 30

hidden_clinical_data:
  vital_signs:
    bp: "145/90"
    pulse: 98
    spo2: 94
  red_flags:
    - radiation_to_left_arm
    - diaphoresis
    - dyspnea_on_exertion
  family_history:
    - father_mi_age_55
  medications:
    - metoprolol_50mg_daily
    - aspirin_none

disclosure_rules:
  must_not_disclose_unless_asked:
    - family_history
    - medication_list
    - smoking_history
  must_disclose_on_direct_question:
    - pain_radiation
    - pain_character
    - associated_symptoms
  must_never_disclose:
    - diagnosis_label          # Hasta "kalp krizi" demez
    - medical_jargon_usage     # Hasta "STEMI" demez

grounding_sources:
  - wiki: cardiovascular/acute-coronary-syndrome.md
  - wiki: emergency/chest-pain-triage.md
  - source: T.C. Sağlık Bakanlığı Birinci Basamak Kılavuzu 2024
```

Bu sözleşme, context-wiki'deki doğrulanmış klinik bilgiden **türetilir**, manuel yazılmaz (bkz. Operasyonlar — Senaryo Otomatik Üretimi).

### Temel İçgörü 3 — Çift Katmanlı Guardrail: Prompt + Semantic Router

LLM'in sözleşmeden sapmasını engelleyen iki katman vardır:

**Katman A — Sistem Prompt İzolasyonu:**
```
Sen Mehmet'sin, 58 yaşında bir öğretmen. Tıp bilgin yoktur.
Öğrenci sormadıkça bilgi vermezsin. Maksimum 2 kısa cümleyle cevap verirsin.
Tıbbi terim kullanmazsın. Kendin teşhis koymazsın, doktor gibi konuşmazsın.
Eğer öğrenci karmaşık bir terim kullanırsa, "onu anlamadım doktor, basitçe söyler misiniz?" dersin.
Senin sadece şu bilgilere erişimin vardır: {senaryo sözleşmesinden türetilmiş sahne önü}
```

**Katman B — Output Parsing Validator (Semantic Router):**
LLM'in ürettiği her cevap, TTS'e gönderilmeden önce **hızlı, hafif bir sınıflandırıcıdan** geçer. Sınıflandırıcı şunu kontrol eder:
- Cevap doktor-dili içeriyor mu? ("STEMI", "myokardiyal enfarktüs", "diferansiyel tanı")
- Cevap öğretici rolüne mi kaydı? ("Şöyle sormanız gerekirdi...")
- Cevap gizli bir bilgiyi sormadan mı açığa vurdu? (scenario matrix çapraz-kontrolü)
- Cevap tıbbi tavsiye veriyor mu? ("Nitrat almanız lazım")

Herhangi biri tetiklenirse cevap **bloke edilir**, fallback cevapla değiştirilir:
> "Anlamadım doktor, göğsüm ağrıyor sadece."

Bu iki katman birlikte, LLM'in karakter kırmasını sıfıra indirmez ama **denetlenebilir hâle getirir** — her kırılma loglanır, analitik geri besleme olarak PromptRefiner'a girer.

### Temel İçgörü 4 — Voice Pipeline Latency = Sistemin Yaşam Sınırı

Sanal hastanın gerçekçiliği, **voice-to-voice yanıt süresine** bağlıdır. Hedef: **< 2.0 saniye**. Bu hedef aşılırsa simülasyon ölür.

```
ÖĞRENCİ SESİ (mic)
  ↓
[STT] Whisper-v3 (Groq/distil-whisper için hızlandırılmış)   → ~400ms
  ↓
[LLM] Claude 4 Haiku / Llama-3-70B (Groq/vLLM, streaming)     → ~800ms TTFT + generate
  ↓
[Guardrail] Semantic Router (hafif classifier, <50ms)
  ↓
[TTS] ElevenLabs Turbo v2.5 / Coqui TTS TR, streaming         → ~400ms ilk ses
  ↓
HASTA SESİ (speaker)

Toplam projekte E2E latency: ~1.6 saniye
```

Mitigasyon stratejileri (pilot sırasında > 2.0s görülürse):
- **Streaming TTS:** Cevap tamamen üretilmeden ses akışı başlar
- **Speculative decoding:** LLM ilk N token'ı tahmin ederek ön-üretim yapar
- **Client-side VAD:** Öğrenci konuşmayı bitirdiği an STT başlar (push-to-talk değil)
- **Pre-warm pool:** Senaryo yüklendiği an LLM context'i ısıtılır, ilk token daha hızlı gelir

### Temel İçgörü 5 — Hybrid RAG = Halüsinasyon Bariyeri

Sanal hasta, senaryo sözleşmesindeki sahne önü alanlarının dışında bir soru geldiğinde ("hiç ameliyat oldun mu?") LLM'in kendi bilgi tabanından uydurmasına **izin verilmez**. Üç yol vardır:

1. **Wiki'de cevap var:** context-wiki'den ilgili sayfa retrieve edilir, senaryo-tutarlı bir cevap oluşturulur
2. **Wiki'de cevap yok ama klinik olarak önemsiz:** "Hatırlamıyorum" / "Özel bir şey yok doktor"
3. **Wiki'de cevap yok ve klinik olarak önemli:** Semantic Router bloke eder, eskalasyon işaretleyicisi çıkar — senaryoya **bu bulgu için alan eklenmelidir**

Retrieval mekaniği:
- **Embedding:** `BAAI/bge-m3` (Türkçe tıbbi morfoloji için)
- **Hybrid search:** Semantic (vector) + BM25 (keyword) — "dispne", "yayılan ağrı" gibi kritik terimler vektör uzayında kaybolmaz
- **Accuracy metriği:** MRR@3, 500 tipik Türkçe anamnez sorusu üzerinde ölçülür

### Temel İçgörü 6 — Offline-Compiled Mode = LLM Runtime Bağımlılığı Olmayan Paradigma

Her klinik senaryo sesli diyalog gerektirmez. Rule-based patolojiler (preeklampsi, GDM, HELLP, hipotiroidi, vb.) — tanının deterministik bir "değer eşik + klinik context" mantığına indirgenebildiği alanlar — açık-uçlu anamnez yerine **yapılandırılmış test-seçim** arayüzüyle daha verimli öğretilir. Bu durumda runtime-LLM'in faydası maliyetini karşılamaz: her seans birkaç kuruş LLM çağrısı, binlerce öğrencili bir platformda operasyonel yük ve halüsinasyon riski demektir.

Mod B'nin mimari kararı:

```
OFFLINE (senaryo üretim zamanı):
  wiki + rule engine dokümanı
    ↓
  Claude / NotebookLM (manuel prompting + insan onayı)
    ↓
  scenario.json (deterministik sözleşme)
    ↓
  `simulations:import` → DB

RUNTIME (öğrenci seans zamanı):
  DB'den scenario oku → patient_presentation göster
    ↓
  Öğrenci test seçer → hidden_values'dan reveal
    ↓
  Mevcut rule engine (MeasurementRule) → severity/action
    ↓
  Öğrenci tanı seçer → deterministik skor:
     test_score = (doğru_kritik / toplam_kritik) × 60
     diagnosis_score = doğru ? 40 : 0
     total = test_score + diagnosis_score (max 100)
    ↓
  Score breakdown + explanation + ideal_management
```

**Neden bu ayrım önemli:**
- **Halüsinasyon riski = 0:** Runtime'da LLM yok; hasta değerleri scenario.json'dan deterministik reveal edilir
- **Latency:** Yüzlerce ms değil, milisaniyeler (DB query + rule match)
- **Maliyet:** Seans başına LLM faturası yok; yalnızca senaryo üretiminde one-time offline maliyet
- **Denetlenebilirlik:** Her senaryo insan tarafından onaylanmış JSON; audit trail basit
- **Regülasyon:** LLM çıktısı hastaya gitmediği için AI tıp aracı sertifikasyonu (Mod A'ya kıyasla) çok daha az endişe vericidir

**Ortak invariant korunur:** Bilgi asimetrisi — öğrenci sormadıkça değer açılmaz. Fark: "sormak" Mod A'da doğal dilde soru, Mod B'de listeden test seçimi.

### Temel İçgörü 7 — Değerlendirme Katmanı = Validation-First Tasarım

context-sim otomatik OSCE puanlaması **iddia etmez**; önce **doğrulanır**, sonra kullanılır.

**Pilot validasyon protokolü (MVP öncesi):**
1. **Eval Set:** 50 kayıtlı öğrenci-sanal hasta transkripti, tek senaryo (Göğüs Ağrısı / ACS)
2. **Ground Truth:** 2 bağımsız öğretim üyesi, 100-puanlık resmî OSCE rubriğiyle skorlar
3. **LLM Eval Agent:** Aynı 50 transkripti zero-shot / few-shot prompt ile skorlar
4. **Başarı metriği:** Cohen's Kappa > 0.75 (substantial agreement) + Pearson korelasyonu > 0.80
5. **Eğer eşik tutmazsa:** Modül "Summative Grader" olmaktan çıkar, **"Formative Feedback Assistant"** olarak downgrade edilir — skor vermez, yalnızca geri bildirim üretir

---

## 4. Mimari (Architecture)

### Katman 1 — Bilgi Katmanı (Knowledge Layer)

- **micro-wiki/** — context-wiki'den miras alınan medikal bilgi ağacı (kardiyoloji, acil, dahiliye, vb.)
- **scenarios/** — senaryo sözleşmeleri (YAML). Manuel yazılabilir veya `context-sim scenario compile` ile wiki'den türetilir
- **rubrics/** — OSCE değerlendirme rubrikleri (anamnez, iletişim, klinik akıl yürütme)
- **persona-templates/** — hasta persona şablonları (yaş, meslek, tıbbi okuryazarlık seviyesi, dil tonu)
- **pronunciation-dict/** — Türkçe tıbbi terminoloji telaffuz sözlüğü (TTS ve STT için)

### Katman 2 — Runtime Katmanı (İki Alternatif Pipeline)

#### Mod A — Runtime-LLM Pipeline (açık-uçlu anamnez)

```
Senaryo Yüklenir (scenario.yaml) + Persona seçilir
       ↓
ScenarioCompilerAgent — wiki'den retrieval, sözleşme doğrulama, persona enjeksiyonu
       ↓
SessionInitializer — LLM context pre-warm, STT/TTS engine'leri kur, VAD başlat
       ↓
┌──────────── LOOP (her öğrenci turu için) ───────────┐
│  STT (Whisper)                                       │
│    ↓                                                 │
│  IntentRouter — klinik anlamlı soru mu, off-topic mi?│
│    ↓                                                 │
│  DisclosureEngine — scenario matrix sorgusu:         │
│    "Bu soru hangi gizli alanı açabilir?"             │
│    ↓                                                 │
│  PatientLLM (Claude/Llama) — persona + kısıtlı bağlam│
│    ↓                                                 │
│  SemanticRouter — guardrail kontrolü                 │
│    ↓ (bloke → fallback)                              │
│  TTS (ElevenLabs/Coqui, streaming)                   │
│    ↓                                                 │
│  TranscriptLogger — zaman damgalı kayıt              │
└─────────────────────────────────────────────────────┘
       ↓ (seans biter)
EvaluationAgent — transkripti OSCE rubriğiyle skorlar
       ↓
FeedbackGenerator — yapılandırılmış geri bildirim (güçlü yönler, eksikler, kaçırılan kırmızı bayraklar)
       ↓
Output: JSON skor + Markdown feedback + ses transkripti + seans kaydı (opsiyonel)
```

#### Mod B — Offline-Compiled Pipeline (test-seçim / karar)

**Offline senaryo üretim (her senaryo için bir kez):**
```
Variable + MeasurementRule referans dokümanı + micro-wiki
       ↓
Claude / NotebookLM (prompted scenario generation, insan-in-loop onay)
       ↓
scenario.json (Simulation record: code, patient_presentation, hidden_values,
               critical_variables, distractor_variables, diagnosis_options,
               explanation, ideal_management)
       ↓
validator: hidden_values key'leri Variable.code ile, critical_variables
           hidden_values key'leri ile eşleşmeli
       ↓
DB import (simulations table)
```

**Runtime seans pipeline (LLM YOK):**
```
POST /simulations/:id/start
       ↓
SimulationAttempt oluştur
       ↓
Response: patient_presentation + shuffled available_variables
          (critical + distractor karışık; hidden_values ve
          correct diagnosis client'a ASLA dönmez)
       ↓
┌──────── LOOP (öğrenci test seçimleri) ────────┐
│  POST /simulation_attempts/:id/select_test    │
│  { variable_code }                            │
│    ↓                                          │
│  hidden_values'dan değeri reveal et           │
│    ↓                                          │
│  MeasurementRule engine:                      │
│    variable + week + value → severity/action  │
│    ↓                                          │
│  revealed_values'a ekle                       │
│    ↓                                          │
│  Response: { value, severity, action,         │
│              description, related_checks }    │
└───────────────────────────────────────────────┘
       ↓
POST /simulation_attempts/:id/submit_diagnosis
{ diagnosis_code }
       ↓
Deterministik skorlama:
  missed_critical = critical_variables − selected_variables
  test_score      = (doğru_kritik / toplam_kritik) × 60
  diagnosis_score = diagnosis_correct ? 40 : 0
  total           = test_score + diagnosis_score (max 100)
       ↓
status → completed; attempt record güncellenir
       ↓
Response: score_breakdown + explanation + ideal_management
          (+ opsiyonel: ai_feedback — offline LLM ile post-hoc üretilebilir)
```

### Katman 2.5 — Veri Modeli (Mod B için)

**Simulation** (senaryo sözleşmesi kaydı):
- `code` (unique), `title`, `difficulty` (easy/medium/hard)
- `target_audience` (junior_doctor/student/both), `status` (draft/approved/archived)
- Domain-specific alanlar (örn. OB/GYN için: `pregnancy_week`)
- `target_diagnosis`, `target_profile_why`
- `patient_presentation` (jsonb: age, demografik, complaints[], history[], vitals_visible{})
- `hidden_values` (jsonb: variable_code → değer; öğrenciye GÖSTERİLMEZ)
- `critical_variables` (jsonb[]: tanı için zorunlu testler)
- `distractor_variables` (jsonb[]: ilgisiz ama makul görünen testler)
- `diagnosis_options` (jsonb[]: {code, text, correct}; 1 doğru + N yanlış)
- `explanation`, `ideal_management`, `max_score`, `time_limit_minutes`, `attempt_count`

**SimulationAttempt** (öğrenci seans kaydı):
- `simulation_id`, `user_id`, `status` (in_progress/completed/abandoned)
- `selected_variables` (jsonb[]), `revealed_values` (jsonb)
- `selected_diagnosis`, `diagnosis_correct`
- `score`, `score_breakdown` (jsonb: correct_tests, total_critical, missed_critical[], unnecessary_tests, test_score, diagnosis_score, total)
- `ai_feedback` (text, opsiyonel — offline post-hoc üretilebilir)
- `started_at`, `completed_at`

### Katman 3 — Geri Yazma Katmanı (Writeback & Analytics)

Her tamamlanmış seanstan üretilen sinyaller:
- **Kaçırılan sorular:** Öğrencilerin sık kaçırdığı kırmızı bayraklar → senaryo difficulty kalibrasyonu
- **Karakter kırılmaları:** LLM'in ne sıklıkla blokelendiği → PromptRefiner girdisi
- **Latency ihlalleri:** 2.0s aşımları → engine / pipeline optimizasyon tetikleyicisi
- **Skor tutarsızlığı:** Aynı senaryoda öğretmen puanı vs LLM puanı → eval eşik güncellemesi

Analytics → context-med'in geri yazma halkasına dahil olur; senaryo matrisleri ve persona şablonları zamanla rafine olur.

---

## 5. Operasyonlar (Operations)

### Senaryo 1 — Wiki'den Senaryo Otomatik Üretimi

Eğitmen yeni bir klinik konu için (örn. "akut apandisit") sanal hasta oluşturmak ister. Manuel YAML yazmak yerine:

```bash
context-sim scenario compile \
  --topic "akut apandisit" \
  --wiki-path micro-wiki/gastrointestinal/ \
  --difficulty beginner \
  --language tr \
  --output scenarios/appendicitis-beginner-01.yaml
```

Sistem:
1. Wiki'den ilgili sayfaları retrieve eder
2. Bir "ScenarioDraftAgent" ile sözleşme JSON'u üretir
3. Eğitmenin onayı için diff gösterir (insan-in-loop)
4. Onaylanırsa `scenarios/` altına kaydedilir

### Senaryo 2 — Öğrenci Seansı (Voice Interactive)

Öğrenci web tabanlı UI'da senaryoyu seçer, mikrofona basar:

```bash
# (çağrılan komut sunucu tarafında)
context-sim session start \
  --scenario scenarios/acs-chest-pain-01.yaml \
  --student-id s2024-0145 \
  --mode voice \
  --language tr
```

Etkileşim örneği:
```
ÖĞRENCİ (ses): "Merhaba, ben Dr. Ahmet. Şikâyetiniz nedir?"
  [STT: 320ms] [IntentRouter: chief_complaint_query] [LLM: 680ms]
HASTA (ses):  "Göğsümde bir baskı var doktor, bir saat önce başladı."

ÖĞRENCİ (ses): "Ağrı başka bir yere yayılıyor mu?"
  [Disclosure: radiation → disclose] [LLM: 710ms]
HASTA (ses):  "Evet, sol kolumda hissediyorum."

ÖĞRENCİ (ses): "Sizde STEMI olduğunu düşünüyor musunuz?"
  [Semantic Router: complex_jargon → fallback]
HASTA (ses):  "Anlamadım doktor, onu bilmiyorum."
```

### Senaryo 3 — Yazılı Mod (Low-Bandwidth Fallback)

Ses pipeline'ı kullanılamıyorsa (bağlantı, mikrofon sorunu), seans yazılı chat olarak çalışır. Aynı scenario matrix, aynı guardrail; yalnızca STT/TTS devre dışı. Latency hedefi < 1.0s metin-metin.

```bash
context-sim session start \
  --scenario scenarios/acs-chest-pain-01.yaml \
  --mode text \
  --language tr
```

### Senaryo 4 — Otomatik Değerlendirme ve Geri Bildirim

Seans biter bitmez:

```bash
context-sim evaluate \
  --transcript sessions/s2024-0145-acs-01.json \
  --rubric rubrics/osce-100pt.yaml \
  --output feedback/s2024-0145-acs-01-feedback.md
```

Çıktı:
- **JSON skor:** `{anamnez: 38/50, iletişim: 18/25, klinik_akıl: 19/25, toplam: 75/100}`
- **Markdown feedback:**
  - ✓ Güçlü yönler: "Kırmızı bayrakları sistematik sorguladınız."
  - ⚠ Kaçırılan noktalar: "Aile hikâyesi sorulmadı (babada genç yaşta MI var)."
  - 💡 Öneri: "Ağrı karakteri (batıcı/baskı/yanma) netleştirilmeli."

### Senaryo 5 — Offline-Compiled Mod Seansı (Test-Seçim)

Junior doktor kurumsal platformda (örn. KadDoğSim) giriş yapar, bir senaryo seçer:

```
UI akışı:
1. Öğrenci: "Preeklampsi - 28. Hafta" senaryosunu seç
   → GET → patient_presentation gösterilir:
     "32 yaşında G2P1, 28. hafta. Şikâyetler: baş ağrısı, ayak şişliği.
      Öyküde önceki gebelikte preeklampsi. Kilo: 78 kg, Boy: 165 cm."
   → available_variables listesi (karışık sırada):
     [BP_SYSTOLIC, BP_DIASTOLIC, PROTEIN_URINE, PLT, ALT, AST,
      CREATININE, TSH, HBA1C, ...]  — critical + distractor karışık

2. Öğrenci: BP_SYSTOLIC seç → POST /select_test
   Response: { value: 158, severity: "high", action: "urgent",
               description: "Sistolik ≥140, gebelik HT sınırı..." }

3. Öğrenci: PROTEIN_URINE seç
   Response: { value: "++", severity: "high", action: "urgent",
               description: "Proteinüri, preeklampsi kriteri" }

4. Öğrenci: TSH seç (distractor)
   Response: { value: 2.1, severity: "normal", action: "none",
               description: "Normal aralık" }

5. Öğrenci: PLT seç → 89 reveal (trombositopeni işareti)
   ...

6. Öğrenci: "Yeterli, tanı koyacağım" → diagnosis_options gösterilir:
     [Preeklampsi, HELLP Sendromu, GDM, Kronik HT]
   → POST /submit_diagnosis { diagnosis_code: "PREEC" }
   Response:
     score_breakdown: {
       correct_tests: 5, total_critical: 7,
       missed_critical: ["ALT", "AST"],
       unnecessary_tests: ["HBA1C"],
       test_score: (5/7) × 60 = 42.9,
       diagnosis_score: 40,
       total: 82.9
     }
     explanation: "Sistolik ≥140 + proteinüri ++ + trombositopeni → preeklampsi"
     ideal_management: "Antihipertansif + MgSO4 profilaksisi + fetal monitorizasyon"
```

**Kritik not:** Bu seansta **hiç LLM çağrısı yoktur**. Tüm akış DB query + mevcut rule engine + deterministik skorlama. Latency: <200ms/istek.

### Senaryo 6 — Toplu Sınıf Modu (Batch)

Bir sınıfın tamamı aynı senaryoyu paralel olarak çözer, sonra eğitmen toplu rapor alır:

```bash
context-sim batch-evaluate \
  --scenario scenarios/acs-chest-pain-01.yaml \
  --sessions sessions/class-2024-fall/ \
  --output reports/class-2024-fall-acs.html
```

Eğitmen: sınıf ortalaması, en çok kaçırılan 3 kırmızı bayrak, en sık yapılan 3 hata, bireysel öğrenci sıralaması.

---

## 6. Ne Yapmaz (What It Does Not Do)

- **3D avatar veya yüz animasyonu üretmez.** İlgi: klinik akıl yürütme, ses etkileşimi, değerlendirme. Görsel hasta simülasyonu ayrı bir modülün işidir.
- **Fiziksel muayene simüle etmez.** Sadece sözel anamnez. "Hastanın karnına bastım" gibi muayene komutları scope dışıdır; gelecek modül (`context-sim-exam`) konusudur.
- **Gerçek zamanlı tanı önerisi sunmaz.** Öğrenciye "bence ACS" demez; öğrenci tanı koyar, sistem değerlendirir.
- **Halüsinasyon yapmaz.** Her hasta cümlesi, senaryo sözleşmesinin veya wiki'nin sınırları içindedir. Dışarı çıkarsa guardrail bloke eder.
- **Tıbbi cihaz veya klinik karar destek sistemi değildir.** Yalnızca **eğitim** amaçlıdır; gerçek hasta verisi girmez, gerçek tanı çıkmaz.
- **Öğrenciye doğru cevabı söylemez.** Seans sırasında "şunu sormalıydın" demez; değerlendirme safhasına kadar bekler.
- **Kurumsal LMS yerine geçmez.** Öğrenci kaydı, ders programı, sertifikasyon dışarıdadır; sistem yalnızca seans + değerlendirme üretir.

---

## 7. Neden Şimdi (Why Now)

**LLM'ler Türkçe medikal bağlamda kullanılabilir kaliteye ulaştı:** Claude 4 ve Llama-3-70B, 2023'te karakterde kalmakta zorlanırken 2025'te guardrail+prompt disipliniyle saatlerce tutarlı hasta rolü oynayabiliyor.

**Voice-interactive latency < 2s gerçek oldu:** Groq, vLLM ve streaming TTS (ElevenLabs Turbo, OpenAI TTS-1) sayesinde end-to-end 1.5-1.8s ulaşılabilir hâle geldi. 2023'te bu ~5s idi ve simülasyonu öldürüyordu.

**context-wiki altyapısı hazır:** Doğrulanmış, kaynak-bağlantılı, çapraz-referanslı wiki; sanal hasta için halüsinasyon bariyerinin temelini oluşturuyor. context-sim bu temel olmadan **inşa edilemezdi**.

**OSCE maliyeti tavan yaptı:** Türkiye'de yeni tıp fakültelerinin hızla açılması (2025 itibarıyla 130+), standart hasta oyuncu havuzunu ve öğretim üyesi değerlendirici kapasitesini aştı. Dijital, ölçeklenebilir formatif değerlendirme talebi aciliyet kazandı.

**Regülasyon henüz kapıyı kapatmadı:** AI tabanlı tıp eğitim araçları henüz sıkı sertifikasyona tâbi değil (eğitim amaçlı olduğu sürece); validasyon ve transparans disiplinli sistemler bu pencerede meşruiyet kurabilir.

---

## 8. Kim Fayda Sağlar (Who Benefits)

**Tıp Fakülteleri:** OSCE maliyetini düşürür, yıl içine yayar. Formatif değerlendirmeyi haftalık/aylık ritme çeker.

**Tıp Öğrencileri:** İstediği zaman pratik yapar. Klinik staj öncesi "deneme" seansı yapar. Hatalarını kimse görmeden öğrenir — utanma faktörü ortadan kalkar.

**Klinik Eğitmenler:** Senaryo üretim yükü düşer (wiki'den otomatik compile). Değerlendirme süresi 30 dk/öğrenci'den ~5 dk/öğrenci'ye iner (LLM ön-skoru incelemek).

**Klinik Araştırmacılar:** Anamnez örüntülerini büyük veri olarak analiz eder. "Öğrenciler ACS senaryosunda %78 oranında aile hikâyesini kaçırıyor" gibi bulgular eğitim tasarımını besler.

**Kurum (Dekanlık / Akreditasyon):** Standartize edilmiş, kayıtlı, denetlenebilir bir değerlendirme zinciri. Akreditasyon denetimlerinde "kaç öğrenci, hangi senaryoyu, hangi skorla tamamladı" sorusu cevaplanabilir.

**Bitirme Projesi Bağlamı:** Tek öğrenci / küçük ekip tarafından 4-6 aylık sürede prototiplenebilir; çünkü üretim değil **validasyon + guardrail** odaklıdır, sıfırdan LLM eğitimi gerektirmez.

---

## 9. Teknik Mimari (Technical Architecture)

**Stack (Mod A — Runtime-LLM):**
- Python 3.11+, Pydantic v2, Typer, FastAPI (session server)
- **STT:** Whisper-v3 (Groq distil-whisper API primary, local whisper.cpp fallback)
- **LLM:** Claude 4 Sonnet / Haiku (primary), Llama-3-70B-Instruct via Groq (fallback), vLLM self-hosted (cost-sensitive mode)
- **TTS:** ElevenLabs Turbo v2.5 (Türkçe kalite), Coqui TTS TR (self-hosted fallback), OpenAI TTS-1 (İngilizce)
- **Semantic Router:** Lightweight classifier (DistilBERT-tr fine-tuned veya llama-guard benzeri)
- **Retrieval:** BAAI/bge-m3 (multilingual embedding) + BM25 hybrid (Elasticsearch veya qdrant + rank_bm25)
- **Transcript/Session Storage:** PostgreSQL + JSON blobs; ses kayıtları için S3-compatible
- **Frontend:** Web tabanlı SPA (React/SvelteKit), WebRTC ses, push-to-talk + VAD opsiyonu

**Stack (Mod B — Offline-compiled, polyglot tolerant):**
- **Backend:** Ruby on Rails veya Python/FastAPI veya Node.js — fark etmez. Runtime'da LLM yok; mevcut kural motoru (ör. Rails app'te `Variable` + `MeasurementRule` ActiveRecord modelleri) yeniden kullanılır.
- **DB:** PostgreSQL (jsonb alanları kritik: `hidden_values`, `patient_presentation`, `score_breakdown`)
- **Senaryo Üretim Pipeline (offline):** Claude (Anthropic API) veya NotebookLM (browser-based) + Variable/Rule referans dokümanı source olarak → JSON output → validator script (hidden_values Variable code uyumu, critical_variables hidden_values key uyumu) → DB seed
- **Frontend:** Standart web SPA (React/Svelte/Hotwire/Turbo) — sesli pipeline gerekmez. Basit formlar ve listeler yeterli.
- **Maliyet profili:** Offline senaryo üretimi one-time (~30 senaryo × ~15 dk insan + LLM maliyeti); runtime'da seans başına ek LLM gideri yoktur.

**Ajan Rolleri:**

- **ScenarioCompilerAgent:** Wiki + topic + difficulty → scenario YAML sözleşmesi (insan onayıyla)
- **IntentRouterAgent:** Öğrenci sorusunu {chief_complaint, red_flag_query, history_query, off_topic, jargon} gibi intentlere sınıflandırır
- **DisclosureEngine:** Scenario matrix'e bakarak "bu soru bu gizli alanı açar mı?" kararını verir. Deterministik, LLM değil.
- **PatientLLMAgent:** Persona + kısıtlı bağlam ile 1-2 cümlelik hasta cevabı üretir
- **SemanticRouterAgent:** Cevabı guardrail'e karşı denetler; bloke eder veya geçirir
- **EvaluationAgent:** Tamamlanmış transkripti OSCE rubriğiyle yapılandırılmış olarak skorlar
- **FeedbackGenerator:** Skor + transkript → öğrenciye insan-okunabilir geri bildirim
- **PromptRefiner:** Guardrail bloke istatistiklerinden öğrenir; sistem prompt ve persona şablonlarını iyileştirir
- **LatencyMonitor:** E2E pipeline sürelerini izler; > 2s tekrarlarsa alert üretir, mitigation stratejisini önerir

**Scenario Taxonomy (MVP):**
- **Kardiyoloji:** ACS (3 zorluk), HT krizi, Aritmi semptomu
- **Acil:** Göğüs ağrısı triage, Karın ağrısı triage, Senkop
- **Dahiliye:** Tip 2 DM ilk başvuru, Astım exacerbation, GIS kanama
- **Psikiyatri (opsiyonel Phase 2):** Depresyon anamnezi, Anksiyete atağı

---

## 10. Kısıtlamalar (Constraints)

- **C1 — Latency tavanı:** Voice-to-voice E2E < 2.0s. Aşılırsa simülasyon gerçekçilik kaybeder.
- **C2 — Tarayıcı odaklı:** Öğrenci istemcisi ağır lokal compute gerektirmez; API'ler üzerinden çalışır. Mikrofon ve ses çıkışı yeterli.
- **C3 — Klinik kapsam:** MVP yalnızca sözel anamnez. Fizik muayene, laboratuvar istemi, görüntüleme kararları kapsam dışı.
- **C4 — Dil:** MVP Türkçe öncelikli. İngilizce ikincil (bge-m3 multilingual, mevcut TTS İngilizce'de zaten güçlü). Arapça / Kürtçe gelecek iterasyon.
- **C5 — Halüsinasyon bariyeri mutlaktır:** Senaryo sözleşmesinde veya wiki'de olmayan klinik iddia hasta ağzından çıkmaz; çıkarsa bug'dır.
- **C6 — Validasyon öncedir:** Cohen's Kappa > 0.75 eşiği tutmadan otomatik skor özelliği "Summative" etiketiyle yayınlanmaz; yalnızca "Formative Feedback" modu açık kalır.
- **C7 — Wiki kalitesi = Simülasyon kalitesi:** Eğer context-wiki'de kardiyoloji sayfaları eksikse, ACS senaryosu eksik çalışır. Wiki ratchet disiplini kritiktir.

---

## 11. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **LLM karakterden çıkıp kendi kendini teşhis eder** | Orta | Yüksek | Sistem prompt + Semantic Router (çift katman); karakter kırılmaları loglanır ve prompt refine edilir |
| **Halüsinasyon: senaryoda olmayan semptom uydurma** | Orta | Çok Yüksek | Hybrid RAG + scenario matrix kesin sınır; cevap wiki'den quote ile doğrulanamıyorsa fallback |
| **E2E latency 2s üstüne çıkar, simülasyon gerçekçiliği çöker** | Orta | Yüksek | Streaming TTS, speculative decoding, pre-warm pool; critical path monitoring |
| **Whisper Türkçe tıbbi terimlerde hata yapar** | Yüksek | Orta | Pronunciation dictionary + custom vocabulary injection; öğrenci tekrar sorma opsiyonu |
| **LLM değerlendirici uzman skoruyla korele olmaz (Kappa < 0.75)** | Orta | Yüksek | Summative modu kilitli kalır, sistem "Formative" olarak yayına girer; pilot genişletilir |
| **Senaryo üretimi uzman gözetimi olmadan klinik hata üretir** | Düşük | Çok Yüksek | ScenarioCompilerAgent her çıktıyı insan onayı için sunar; onaysız senaryo `scenarios/` altına yazılmaz |
| **Öğrenci sistemi "yenmeyi" öğrenir, klinik akıl yürütmez** | Orta | Orta | Senaryo varyasyonları randomize edilir (persona, başlangıç şikâyeti); aynı senaryo iki kez aynı çalmaz |
| **Regülasyon değişikliği: AI tıp eğitim aracı sertifikasyon zorunluluğu** | Orta | Orta | "Eğitim amaçlı, tanı koymaz" ibaresi açıkça; validasyon verisi hazır tutulur (audit için) |

---

## 12. Açık Sorular (Open Questions)

1. **Scenario matrix manuel mi, wiki'den otomatik mi?** Hibrit: ilk taslak otomatik, eğitmen onayı zorunlu. Ama onay UI'sı ne kadar zengin olmalı?
2. **Öğrenci ses mi yazı mı tercih etmeli?** MVP ikisini de sunar; kullanım verisi hangisinin baskın olduğunu gösterecek.
3. **LLM değerlendirici düşük güvenle skor verirse ne yapar?** "Human review required" bayrağı + askıya alma mı, yoksa alt eşikli geri bildirim mi?
4. **Çoklu-turn uzunluğu ne olmalı?** Tipik OSCE 8-15 dakika. Context window 10 dakikalık Türkçe diyalog için yeterli mi, özet stratejisi gerekiyor mu?
5. **Senaryo yeniden kullanımı:** Aynı öğrenci aynı senaryoyu 2 gün sonra tekrar yaparsa, sistem farkında olmalı mı? Varyasyon enjekte edebilir mi?
6. **Validasyon pilotu:** 50 transkript yeterli mi, 200'e çıkmalı mı? Hangi uzmanlar kabul edilir (iç tıp ihtisası yeterli mi, kardiyoloji uzmanı mı gerekli)?
7. **Kayıt gizliliği:** Öğrenci seans ses kaydı tutulmalı mı? GDPR / KVKK açısından opt-in mi opt-out mu?
8. **Çok-dilli senaryolar:** Türkçe hasta + İngilizce öğrenci (veya tersi) senaryosu talebi gelirse, translation overhead latency'i nasıl etkiler?

---

## 13. Değerlendirme — Ratchet Beklentisi

**Altın standart test seti:**
- **50 transkript / 1 senaryo (MVP):** ACS Göğüs Ağrısı, 2 uzman skoruna karşı Cohen's Kappa ölçümü
- **150 transkript / 5 senaryo (Phase 2):** ACS, Apandisit, DM İlk Başvuru, Astım Atağı, HT Krizi
- **Scenario-compile testleri:** 20 wiki alt-alanı → otomatik üretilmiş senaryolar → uzman kabul oranı hedef %80+
- **Guardrail testleri:** 100 adversarial giriş ("doktor, ne hastalığım var?") → karakter kırılma oranı hedef < %2

**Her iterasyonda sorulacak sorular:**
- PatientLLMAgent'ın her cevabı senaryo sözleşmesi + wiki sınırları içinde mi?
- SemanticRouter blokeleri false-positive oranı nedir? (Geçmesi gereken cevaplar bloke oluyor mu?)
- E2E latency dağılımı nerede? p50, p95, p99.
- EvaluationAgent insan skoruyla korelasyonu önceki versiyondan düşük mü? (Ratchet ihlali)
- Öğrenci geri bildiriminde "yapay / gerçekçi değil" şikâyeti hangi senaryolarda yoğunlaşıyor?

**Başarısızlık Örnekleri → Writeback:**
- Halüsinasyon yakalanırsa → senaryo matrisine eksik alan eklenir + guardrail kuralı güncellenir
- Kappa bir senaryoda < 0.75 → o senaryo "Formative only" olarak işaretlenir, yeni transkriptlerle pilot genişletilir
- Latency ihlali > %5 seanslarda → LatencyMonitor pipeline optimizasyonunu önerir (engine switch, stream chunking)

---

## 14. Başarı Kriterleri (Success Criteria)

**Teknik Metrikler (zorunlu):**
- **Latency:** 100 test seansında ortalama E2E voice-to-voice yanıt < 2.0 saniye. p95 < 2.5s.
- **Halüsinasyon oranı:** 500 hasta cevabında, scenario matrix + wiki dışı klinik iddia oranı %0 (sıfır tolerans; her ihlal bug'dır).
- **Karakter kırılma oranı:** < %2 (adversarial test setinde).
- **Retrieval MRR@3:** > 0.80 (500 Türkçe anamnez sorusu benchmark'ında).
- **Scenario compile yield:** Otomatik üretilen senaryoların %80+'i eğitmen onayından ilk denemede geçer.

**Validasyon Metrikleri (gate):**
- **Cohen's Kappa (LLM vs insan skor):** > 0.75 (substantial agreement). Tutmazsa Summative modu kilitli kalır.
- **Pearson korelasyonu:** > 0.80.

**Kullanım Metrikleri:**
- **Seans tamamlama oranı:** Öğrencilerin %75'i başladıkları seansı bitiriyor.
- **Tekrar kullanım:** Öğrencilerin %40'ı 1 hafta içinde ≥ 2 farklı senaryo deniyor.
- **Eğitmen kabul:** Eğitmen skorunun LLM skoruyla "büyük farklılık gösterdiği" seans oranı < %10.

**Klinik Güvenlik Metrikleri (mutlak):**
- Sanal hastanın öğrenciye **tıbbi tavsiye verme** olayı: 0 (sıfır).
- Sanal hastanın kendini **teşhis etme** olayı: 0.
- Senaryoda **olmayan kırmızı bayrak uydurma** olayı: 0.

---

## 15. Bağlam / Referanslar (Context / References)

**Sistem Bağlamı (context-med ekosistemi):**
- `context-wiki/IDEA.md` — klinik bilgi tabanı; context-sim'in scenario compile ve halüsinasyon bariyerinin dayanağı. Wiki olmadan sim çalışmaz.
- `context-core.md` — orkestra katmanı; context-sim bir runtime modülü olarak core'a bağlanır, senaryo/ders programı koordinasyonu core üzerinden yapılır.
- `context-gate.md` — kaynak kalite kontrolü; wiki'ye giren her ham kaynak gate'den geçer, context-sim gate-onaylı kaynakları kullanır.
- `context-shield.md` — PII maskeleme; wiki'de hasta verisi varsa shield edge'de maskeler, context-sim anonim veri üzerinde çalışır.
- `context-narrate.md` — kardeş modül; wiki'den ses içeriği üretir (pasif dinleme). context-sim aktif etkileşim üretir (konuşma). İkisi birlikte "bilgi → pasif + aktif tüketim" zinciri kurar.

**Orijinal Taslak:**
- `cerebra/10-draft-ideas/bitirme-proje/bp-medSim.md` — MedSim AI v2.1 teknik taslağı. context-sim bu taslağın context-med ekosistemine uyarlanmış versiyonudur. Bilgi asimetrisi invariantı, latency pipeline'ı, Cohen's Kappa validasyon protokolü doğrudan miras alındı; 3D avatar kapsamı dışlandı (orijinal taslakla tutarlı), wiki-grounding katmanı bu ekosistem için eklendi.

**İlham Kaynakları:**
- **BodyInteract, Shadow Health, i-Human:** Mevcut virtual patient araçları — karar ağacı katılığının ne olduğunu gösterir; context-sim'in farkı LLM-native olmasıdır.
- **NotebookLM (Google):** Wiki / doküman → konuşmalı format üretimi örüntüsü. context-narrate'i zaten ilhamlandırdı; context-sim bunun "interaktif" versiyonudur.
- **Standardized Patient programları (ABD tıp fakülteleri):** Sanal hasta senaryolarının yazılım sözleşmesi olarak ifade edilebileceği fikrinin kökeni.

**Teknik Araçlar:**
- **Whisper:** https://github.com/openai/whisper (STT)
- **Groq distil-whisper:** Ultra-low latency STT
- **ElevenLabs:** https://elevenlabs.io (Türkçe TTS kalitesi)
- **Coqui TTS:** https://github.com/coqui-ai/TTS (open-source TTS fallback)
- **BAAI/bge-m3:** Multilingual embedding
- **vLLM:** https://github.com/vllm-project/vllm (self-hosted LLM serving)

**Standartlar:**
- **OSCE 100-point rubric:** Anamnez (50), İletişim (25), Klinik Akıl Yürütme (25)
- **Cohen's Kappa thresholds (Landis & Koch 1977):** > 0.60 moderate, > 0.75 substantial, > 0.80 almost perfect
- **Karpathy IDEA.md (2024):** Bu dosyanın format standardı
- **context-med ekosistem kontratları:** operational-schema, ratchet eval, writeback

---

## 16. Cerebra ile İlişki (Dual-mode)

**Standalone Mod:** context-sim kendi `scenarios/`, `micro-wiki/` (veya context-wiki'ye file system bağlantısı), `rubrics/` klasörlerinden okur. Seans kayıtları lokal PostgreSQL'de. Tek bir tıp fakültesi tek başına deploy edebilir, dış sisteme bağlı değildir.

**Cerebra-composed Mod:**
- context-wiki substrate'ine bağlanır; tüm micro-wiki'lere (kardiyoloji, dahiliye, acil, vb.) erişir — tek bir sim motoru birçok klinik alanı kapsar
- Öğrenci seans analytics'i (kaçırılan kırmızı bayraklar, karakter kırılmaları) cerebra provenance grafiğine yazılır
- Validasyon gerektiğinde (LLM değerlendirici güvensizse, uzman gözden geçirme gerekliyse) cerebra'nın `human-in-loop-agent`'ına eskalasyon yapar
- Ratchet eval yetenekleri (senaryo benchmark set'leri, Kappa takibi) framework'ten miras alınır
- `context-gate` ile scenario compile zincirinde kaynak kalite kontrolü otomatikleşir

---

## 17. Bitirme Projesi Uygunluğu

Bu modül **tıp / bilgisayar mühendisliği ortak bitirme projesi** olarak özel olarak elverişlidir:

**Kapsam Kontrolü:**
- 4-6 aylık süreçte tek öğrenci / 2-3 kişilik ekip tarafından prototiplenebilir
- Sıfırdan LLM eğitimi gerektirmez (prompting + guardrail + RAG)
- Ses pipeline'ı mevcut API'lerle (Groq, ElevenLabs) inşa edilir, sıfırdan STT/TTS yazılmaz
- Tek bir senaryo (ACS) üzerinde validasyon yeterlidir; genişletme gelecek iş

**Öğrenme Kazanımları:**
- LLM prompt engineering + guardrail tasarımı
- Voice-interactive sistem mühendisliği (latency, streaming)
- Hybrid RAG (semantic + keyword)
- Klinik değerlendirme metrikleri (Cohen's Kappa, inter-rater reliability)
- İnsan-in-loop sistem tasarımı

**Sunulabilirlik:**
- Demo: canlı ses etkileşimi, öğrenci gözünden 5 dakikalık anamnez seansı
- Ölçülebilir sonuçlar: latency dağılımı, halüsinasyon oranı, Kappa skoru
- Akademik katkı: Türkçe medikal voice-interactive simülasyon + wiki-grounding mimarisi yeni bir araştırma alanıdır

---

## 18. Kullanım Senaryosu: KadDoğSim — Kadın Doğum Junior Doktor Eğitim ve Hasta Danışmanlık Platformu

Bu bölüm, context-sim'in **Mod B (Offline-compiled)** paradigmasının somut bir uygulamasıdır. Platform bağımsız bir üründür; context-sim'in bu modunun hangi gerçek-dünya problemini çözdüğünü ve hangi mimari kararları somutlaştırdığını gösterir.

### 18.1 Kapsam

Kadın doğum uzmanlarına yönelik, junior doktor (asistan, aile hekimi, genç uzman) eğitim ve hasta danışmanlık platformunun bir modülü olarak **sanal hasta simülatörü**. Platformun geri kalanı (hasta danışmanlığı, asistan eğitim modülleri, rule engine katmanı) zaten mevcuttur ve **mevcut kod yeniden kullanılır** — özellikle `Variable` (65+ değişken: BP_SYSTOLIC, PROTEIN_URINE, HBA1C, TSH, PLT, ...) ve `MeasurementRule` (200+ kural: week-range + condition_type + severity/action/description) ActiveRecord modelleri.

### 18.2 Neden Mod B (Runtime-LLM Değil)

KadDoğSim'in tercih ettiği mimari kararlar şu gerekçelerle Mod B'ye yönelir:

- **Obstetrik rule-based tanı zengin:** Preeklampsi, GDM, HELLP, hipotiroidi, gestasyonel HT, FGR, oligohidramnios — tanı çoğunlukla "hafta + değer + eşik" mantığıyla kurulabilir. LLM'in ürettiği "akışkan anamnez" yerine "test seçim disiplini" daha öğretici.
- **Maliyet duyarlı kurumsal platform:** Junior doktor havuzu binlerce kişilik; seans başına LLM çağrısı ciddi operasyonel yük.
- **Regülasyon konforu:** Runtime'da LLM çıktısı öğrenciye/hastaya doğrudan gitmez; tüm klinik değerler önceden onaylanmış senaryolardan reveal edilir. Sertifikasyon pozisyonu çok daha güçlü.
- **Mevcut rule engine yatırımı:** 65+ Variable + 200+ MeasurementRule zaten production'da; sanal hasta simülatörü bu yatırımı yeniden kullanır, paralel sistem kurulmaz.

### 18.3 Senaryo Üretim Pipeline (Offline)

Bu use case'in çekirdek iş akışı:

```
1. Referans doküman hazırla:
   - Tüm Variable kayıtları (code + name + unit + normal_range)
   - Tüm MeasurementRule kayıtları (variable + week_range + condition +
     severity + action + description + related_checks)
   - Obstetrik micro-wiki sayfaları (preeklampsi, GDM, HELLP, ...)

2. NotebookLM / Claude'a yükle:
   - Source: yukarıdaki referans doküman
   - Prompt: senaryo üretim şablonu (hedef patoloji + zorluk + hafta)

3. JSON çıktısı al:
   - patient_presentation, hidden_values, critical_variables,
     distractor_variables, diagnosis_options (1 doğru + 3 yanlış),
     explanation, ideal_management

4. Kaydet:
   - db/seeds/simulations.json'a append

5. Import:
   - rails simulations:import → Simulation kayıtları oluşur

6. Validate:
   - rails simulations:validate
   - Kontroller:
     * hidden_values key'leri ∈ Variable.pluck(:code) ?
     * critical_variables ⊆ hidden_values.keys ?
     * distractor_variables ⊆ hidden_values.keys ?
     * diagnosis_options içinde tam olarak 1 correct:true ?
     * target_diagnosis ∈ diagnosis_options.map(&:code) ?
```

**Senaryo Taksonomisi (hedef: 30 senaryo, 8 kategori):**

| Kategori | Örnek Tanılar | Tipik Hafta Aralığı |
|---|---|---|
| Hipertansif bozukluklar | Preeklampsi, Gestasyonel HT, Kronik HT, HELLP | 20-40 |
| Metabolik | GDM, Tip 1/2 DM komplikasyonu, Obezite | 24-32 |
| Hematolojik | Anemi, Trombositopeni, Koagülopati | 12-40 |
| Fetal | FGR, Oligohidramnios, Polihidramnios, Makrozomi | 20-40 |
| Tiroid/Enfeksiyon | Hipo-/Hipertiroidi, UTI, Koryoamnionit | 8-40 |
| Erken gebelik | Hiperemesis, Missed abortus, Ektopik şüphesi | 4-14 |
| Doğum dönemi | Preterm eylem, PROM, İndüksiyon kararı | 28-40 |
| Kompleks/çoklu patoloji | Kombine senaryo (örn. PREEC + GDM) | Değişken |

### 18.4 Veri Modeli (Rails)

Mevcut modellere ek olarak iki yeni model:

```ruby
# app/models/simulation.rb
class Simulation < ApplicationRecord
  # code:string (unique), title, difficulty:enum, target_audience:enum,
  # status:enum, pregnancy_week:integer, target_diagnosis:string,
  # target_profile_why:string, patient_presentation:jsonb,
  # hidden_values:jsonb, critical_variables:jsonb,
  # distractor_variables:jsonb, diagnosis_options:jsonb,
  # explanation:text, ideal_management:text, max_score:integer,
  # time_limit_minutes:integer, attempt_count:integer
  has_many :simulation_attempts
end

# app/models/simulation_attempt.rb
class SimulationAttempt < ApplicationRecord
  # simulation_id, user_id, status:enum,
  # selected_variables:jsonb, revealed_values:jsonb,
  # selected_diagnosis, diagnosis_correct:boolean,
  # score:integer, score_breakdown:jsonb, ai_feedback:text,
  # started_at, completed_at
  belongs_to :simulation
  belongs_to :user
end
```

### 18.5 Endpoint Sözleşmesi

```
POST /simulations/:id/start
  → SimulationAttempt.create(status: :in_progress)
  → Response:
      {
        attempt_id: ...,
        patient_presentation: { age, gravida, parity, complaints, history, vitals_visible },
        available_variables: [ ... shuffled critical + distractor ... ],
        time_limit_minutes: ...
      }
  # ASLA dönmeyenler: hidden_values, critical_variables, target_diagnosis

POST /simulation_attempts/:id/select_test
  Body: { variable_code: "BP_SYSTOLIC" }
  → hidden_values'dan değer oku
  → MeasurementRule.where(variable: ...)
      .select { |r| r.week_range_includes?(simulation.pregnancy_week) }
      .find { |r| condition_met?(r, value) }
  → revealed_values güncelle, selected_variables push
  → Response:
      { value, severity, score, action, description, related_checks }

POST /simulation_attempts/:id/submit_diagnosis
  Body: { diagnosis_code: "PREEC" }
  → Skorlama:
      correct_critical = selected_variables ∩ critical_variables
      missed_critical  = critical_variables − selected_variables
      unnecessary      = selected_variables − critical_variables
      test_score       = (correct_critical.size / critical_variables.size) × 60
      diagnosis_score  = (diagnosis_code == target_diagnosis) ? 40 : 0
      total            = test_score + diagnosis_score
  → attempt: status=:completed, score, score_breakdown
  → Response:
      { score_breakdown, explanation, ideal_management,
        diagnosis_correct, selected_diagnosis }
```

### 18.6 Örnek Senaryo JSON

```json
{
  "code": "SIM_PREEC_28W_001",
  "title": "Preeklampsi - 28. Hafta",
  "difficulty": "medium",
  "pregnancy_week": 28,
  "target_diagnosis": "PREEC",
  "target_profile_why": "SEVERE_PREEC",
  "patient_presentation": {
    "age": 32,
    "gravida": 2,
    "parity": 1,
    "complaints": ["Baş ağrısı", "Ayak şişliği"],
    "history": ["Önceki gebelikte preeklampsi"],
    "vitals_visible": { "weight_kg": 78, "height_cm": 165 }
  },
  "hidden_values": {
    "BP_SYSTOLIC": 158, "BP_DIASTOLIC": 98,
    "PROTEIN_URINE": "++", "PLT": 89,
    "ALT": 65, "AST": 58, "CREATININE": 1.2,
    "TSH": 2.1, "HBA1C": 5.2
  },
  "critical_variables": [
    "BP_SYSTOLIC", "BP_DIASTOLIC", "PROTEIN_URINE",
    "PLT", "ALT", "AST", "CREATININE"
  ],
  "distractor_variables": ["TSH", "HBA1C"],
  "diagnosis_options": [
    { "code": "PREEC", "text": "Preeklampsi", "correct": true },
    { "code": "HELLP", "text": "HELLP Sendromu", "correct": false },
    { "code": "GDM",   "text": "Gestasyonel Diyabet", "correct": false },
    { "code": "HTN",   "text": "Kronik Hipertansiyon", "correct": false }
  ],
  "explanation": "Sistolik ≥140 + proteinüri ++ + trombositopeni → preeklampsi",
  "ideal_management": "Antihipertansif + MgSO4 profilaksisi + fetal monitorizasyon"
}
```

### 18.7 Efor Tahmini

| Faz | Süre |
|---|---|
| Migration + model (Simulation, SimulationAttempt) | 0.5 gün |
| Model logic (select_test, submit_diagnosis, scoring) | 1.5 gün |
| Controller + serializer | 1 gün |
| Rake task (simulations:import, simulations:validate) | 0.5 gün |
| Senaryo üretimi (NotebookLM/Claude, 30 senaryo) | 1 gün |
| Frontend (hasta ekranı + test seçim + sonuç) | 2-3 gün |
| Prompt kalibrasyon + test | 0.5 gün |
| **Toplam** | **~7-8 gün** |

Bu efor profili, context-sim'in Mod A'sına (voice pipeline, LLM runtime, guardrail validator, OSCE Kappa validasyonu) kıyasla **10x daha düşük**tür. Mod B, rule engine'i olan kurumların mevcut yatırımının üstüne incecik bir simülasyon katmanı kurma seçeneğidir.

### 18.8 Context-Sim'e Geri Beslenen Öğrenmeler

KadDoğSim geliştikçe context-sim IDEA'sına geri yazılacak potansiyel sinyaller:
- Hangi senaryo şablonları LLM tarafından ilk seferde doğru üretiliyor, hangileri insan editörlüğü gerektiriyor?
- Junior doktorların en sık kaçırdığı critical_variables hangileri? (Senaryo zorluk kalibrasyonu + eğitim müfredatı geri beslemesi)
- distractor_variables dağılımı: "çok açık distraktör" (hiç seçilmez) vs "tuzak distraktör" (sık seçilir) oranı ne?
- `ai_feedback` alanı offline post-hoc LLM ile doldurulursa, bu feedback junior doktor için anlamlı mı? (Opsiyonel genişletme noktası — context-sim Mod B + Mod A hybrid varyantının ilk adımı olabilir)

### 18.9 Mod A ile Olası Hibrit

KadDoğSim ileride Mod A öğelerini seçici olarak entegre edebilir:
- **Anamnez ön-faz:** Test seçiminden önce hasta ile 2-3 dakikalık LLM-tabanlı anamnez (Mod A)
- **Test seçim ana-faz:** Mevcut deterministik akış (Mod B)
- **Post-hoc feedback:** Seans sonrası LLM ile bireyselleştirilmiş geri bildirim (offline, latency kritik değil)

Bu hibrit Mod A'nın anamnez zenginliğini + Mod B'nin klinik karar verme disiplinini birleştirir. Ancak MVP olarak saf Mod B yeterlidir.

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-sim",
  "version": "0.1.0",
  "bin": { "context-sim": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-sim compile` | Compile scenario from wiki sources | `--input`, `--output` | `--config`, `--format`, `--language`, `--dry-run` |
| `context-sim start` | Start interactive simulation session | `--input` | `--mode`, `--config`, `--verbose` |
| `context-sim evaluate` | Evaluate completed session against rubric | `--input`, `--output` | `--config`, `--format` |
| `context-sim batch` | Batch compile scenarios | `--input`, `--output` | `--config`, `--concurrency` |
| `context-sim eval` | Ratchet evaluation against baseline | `--input`, `--baseline` | `--output`, `--format` |

### Additional Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--mode` | `string` | `modeB` | Simulation mode: `modeA` (LLM) \| `modeB` (offline/compiled) |
| `--topic` | `string` | | Clinical topic for scenario |
| `--difficulty` | `string` | `beginner` | Difficulty: `beginner` \| `intermediate` \| `advanced` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Compile Scenario

```bash
context-sim compile \
  --input fixtures/scenarios/acs-chest-pain-01.yaml \
  --output output/compiled-scenario.json \
  --format json
```

**Input:** Scenario YAML with patient persona, clinical data, disclosure rules.
**Expected Output:** Compiled scenario JSON ready for session execution.
**Exit Code:** `0`

#### Scenario 2 — Start Simulation Session

```bash
context-sim start \
  --input output/compiled-scenario.json \
  --mode modeB
```

**Input:** Compiled scenario JSON.
**Expected Output:** Interactive session in terminal (stdin/stdout dialogue).
**Exit Code:** `0` on completion.

#### Scenario 3 — Evaluate Session

```bash
context-sim evaluate \
  --input output/session-log.json \
  --output output/eval-report.json \
  --format json
```

**Input:** Session log JSON.
**Expected Output:** Evaluation report with rubric scores, areas for improvement.
**Exit Code:** `0`

#### Scenario 4 — Batch Compile

```bash
context-sim batch \
  --input fixtures/scenarios/ \
  --output output/sim-compiled/
```

**Input:** Directory of scenario YAML files.
**Expected Output:** One compiled JSON per scenario.
**Exit Code:** `0`

#### Scenario 5 — Missing Input (Error)

```bash
context-sim compile --output output/scenario.json
```

**Expected:** `Error: required option '--input <path>' not specified`
**Exit Code:** `1`

#### Scenario 6 — Dry Run

```bash
context-sim compile \
  --input fixtures/scenarios/acs-chest-pain-01.yaml \
  --output output/scenario.json \
  --dry-run
```

**Expected:** Prints compilation plan (topic, difficulty, wiki sources). No files written.
**Exit Code:** `0`


#### Scenario (Extension) — Invalid Config (Error)

```bash
context-sim compile \
  --input fixtures/raw/sample-text.txt \
  --output output/error.json \
  --config fixtures/config/corrupt-config.yaml
```

**Expected:** `Error: Invalid YAML configuration in fixtures/config/corrupt-config.yaml`
**Exit Code:** `1`


#### Scenario (Extension) — Schema / Validation Check (Error)

```bash
context-sim compile \
  --input fixtures/json/invalid-schema-sample.json \
  --output output/failed.json
```

**Expected:** `Error: Validation failed — schema mismatch or hallucination detected.`
**Exit Code:** `2`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Scenario compiled/session completed |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | Scenario schema invalid, wiki source missing |
| `3` | External dependency error | LLM/TTS API timeout |

---

> **Living Artifact Notu.** Bu belge yaşayan bir artefakttır. Yeni senaryolar eklendikçe, validasyon pilotu sonuçları geldikçe, LLM ve TTS engine'leri geliştikçe, rule engine-tabanlı use case'ler (KadDoğSim vb.) olgunlaştıkça güncellenir. Tezdeki "bilgi asimetrisi invariantı + wiki-grounded senaryo üretimi + validated evaluation" çerçevesi değişmedikçe teze dokunma; değiştiyse tezi yeniden yaz.

---

**Son Not:** context-sim, context-med ekosisteminde **bilgiyi interaktif deneyime çeviren** modüldür. context-va grafik özet üretir (görsel pasif), context-paper manuscript yazar (metin pasif), context-slides sunum oluşturur (görsel+metin pasif), context-narrate sesli özet üretir (ses pasif), **context-sim klinik etkileşim üretir — Mod A'da sesli açık-uçlu diyalog, Mod B'de yapılandırılmış test-seçim ve karar (her ikisi de aktif).** Beş modül birlikte, tek bir doğrulanmış micro-wiki kaynağından farklı öğrenme modlarına hitap eden çıktılar sunar — okumaktan dinlemeye, dinlemekten konuşmaya, konuşmaktan karar vermeye.

context-sim'in iki modu aynı felsefeyi paylaşır: **bilgi asimetrisi invariantı + kaynak-grounded senaryolar + validation-first değerlendirme**. Mod A maksimum gerçekçilik ve klinik akışkanlık pahasına operasyonel karmaşıklık getirir; Mod B operasyonel sadelik ve regülasyon konforu pahasına yapılandırılmış arayüz gerektirir. Kurum hangisini seçeceğini vakaya, hedef kitleye, maliyet/kalite dengelerine göre kararlaştırır — her iki yol da context-sim'in sözleşmesi altındadır.

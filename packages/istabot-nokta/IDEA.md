# ISTABOT × NOKTA Integration
## NAIM's Orchestrated Knowledge-To-Artifact for Medical Research

> **‧→✨** Karpathy-style mobile app where a research dot becomes a published universe.

*NOKTA kabiliyeti; ISTABOT kullanıcılarının akademik fikir kıvılcımlarını (dot) engineering-guided, AI-assisted, domain-specific konversasyon ile uctan-uca proje mimarisine (artifact) dönüştüren otonom araştırma kuluçka sistemidir.*

---

## 1. Tez (Thesis)

Akademik araştırma, fikir aşamasında boğulur. Danışman hocasıyla ilk konuşmasından sonra "implant ve diyabet" gibi 2-3 anahtar kelime ile evine dönen bir uzmanlık öğrencisi, bu noktayı Q1 dergiye gönderilecek bir çalışmaya dönüştürmek için aylar boyunca parçalanmış araçlar (SPSS, Mendeley, Google Forms, Word şablonları) arasında kaybolur.

**ISTABOT × NOKTA, bu süreci tek platform içinde, AI agent orkestrasyon ve MRLC (Medical Research Lifecycle) navigasyonu ile radikal şekilde sıkıştırır ve kolaylaştırır.**

NOKTA; sadece veri analizi yapan bir araç değil, **anahtar kelimeden publication'a kadar tüm MRLC fazlarını (DISCOVER → DESIGN → EXECUTE → PUBLISH) guided conversation ve domain-specific prompting ile yöneten bir Araştırma Yaşam Döngüsü Orchestrator'dır.**

---

## 2. Problem

Araştırmacılar (özellikle uzmanlık öğrencileri, yüksek lisans/doktora adayları) şu krizlerle boğuşur:

1. **Fikir → Proje Körfezi:** "Diyabet ve implant" gibi bir anahtar kelimeyi, yapılandırılmış bir araştırma sorusuna (PICO/PICOT), literatür taramasına, metodolojiye çevirmek haftalar/aylar sürer.

2. **Araç Parçalanması:** Literatür için Mendeley, soru formu için Google Forms, analiz için SPSS, rapor için Word, sunum için PowerPoint — her biri ayrı öğrenme eğrisi, import/export sürtünmesi.

3. **Metodolojik Karar Yorgunluğu:** "Hangi ölçeği kullanmalıyım? Kaç kişiye anket yapmalıyım? Hangi testi seçmeliyim?" sorularında tek başına kalma, yanlış karar verme riski.

4. **Danışman Darboğazı:** Hoca randevu vermiyor, feedback gecikiyor, öğrenci ay boyunca "bir sonraki adım" için bekliyor.

5. **MRLC Navigasyon Körlüğü:** Kullanıcı "şu an hangi fazdayım, sırada ne yapmalıyım?" sorusuna cevap bulamıyor. Örnek: Veri topladı ama analiz öncesi power analysis yapmadığını 3 ay sonra fark ediyor.

**NOKTA, bu problemleri "conversational orchestration + domain-specific guidance + algorithm-driven automation" üçlüsü ile çözer.**

---

## 3. Nasıl Çalışır (How It Works)

### 3.1 Temel Konsept: Nokta → Artifact Evrimi

NOKTA, kullanıcının **mevcut bağlamına (persona, proje durumu, MRLC fazı) göre** adaptif bir sohbet başlatır ve onu adım adım bir sonraki MRLC milestone'una taşır.

**Giriş (Input):**
- Anahtar kelimeler ("diyabet, implant, sigara")
- Mevcut proje durumu (eğer varsa: "Veri topladım, analiz etmem lazım")
- Kullanıcı profili (Periodontoloji uzmanlık öğrencisi, 2. yıl)
- Önceki projeler/analizler (context memory)

**Çıkış (Output):**
- Karpathy-style `project-idea.md` dosyası (IDEA standart)
- MRLC fazına özel artifact (research question, survey, analysis report, manuscript draft)
- Her adımda güncel "sırada ne var" roadmap

---

### 3.2 NOKTA'nın ISTABOT MRLC İçindeki Rolü

NOKTA, ISTABOT'un 4-faz MRLC yapısını **agent-driven conversation** ile otomatikleştirir.

```
         USER INPUT (nokta)
              ↓
    ┌─────────────────────────┐
    │  NOKTA ORCHESTRATOR     │
    │  (AI Conversation Agent)│
    └─────────────────────────┘
              ↓
    ┌─────────────────────────┐
    │  CONTEXT ANALYSIS       │
    │  • Persona profiling    │
    │  • Project state        │
    │  • MRLC phase detection │
    └─────────────────────────┘
              ↓
    ┌─────────────────────────────────────┐
    │  PHASE-SPECIFIC GUIDED CONVERSATION │
    ├─────────────────────────────────────┤
    │  DISCOVER → Literature gap?         │
    │  DESIGN → Survey design?            │
    │  EXECUTE → Data ready?              │
    │  PUBLISH → Manuscript draft?        │
    └─────────────────────────────────────┘
              ↓
    ┌─────────────────────────┐
    │  ARTIFACT GENERATION    │
    │  • project-idea.md      │
    │  • Research Question    │
    │  • Survey Form          │
    │  • Analysis Report      │
    │  • Manuscript Draft     │
    └─────────────────────────┘
```

---

### 3.3 Engineering-Guided Conversation: Slop'a Asla İzin Yok

NOKTA, ISTABOT'un "algorithm-driven" DNA'sını sohbet katmanına taşır:

**Prensip:** Kullanıcıya açık uçlu "Ne istiyorsun?" yerine, **domain-specific, constrained prompts** ile kararları hızlandırır.

**Örnek Akış (DISCOVER fazı):**

```
NOKTA: "Araştırma alanınız nedir?"
USER: "Periodontoloji"

NOKTA: "Ana ilgi alanlarınızı seçin (max 3):"
[✓] İmplant  [✓] Diyabet  [ ] Periodontal hastalık  [ ] Estetik

NOKTA: "AcaVibe modülünü kullanarak benzer çalışmaları tarayalım mı?
(5 dakika içinde 20+ paper bulup, literatür boşluklarını gösterebilirim)"
[Evet, tara] [Hayır, kendi fikrim var]

→ USER: [Evet, tara]

NOKTA: ⏳ Tarama tamamlandı.
📊 17 çalışma bulundu (2020-2024, IF>3).
🔍 Tespit edilen boşluk: "Sigara + diyabet kombo etkisi Türk popülasyonunda çalışılmamış."

Bunu araştırma sorunuz yapalım mı?
[Evet] [Başka boşluk öner] [Kendi soruyu yazayım]
```

**Kritik fark:** NOKTA, kullanıcıyı "ne yazayım" krizinden kurtarır. Her adımda **seçenekler + context** sunar, **slop üretmeye asla izin vermez.**

---

### 3.4 MRLC Faz Bazlı NOKTA Davranışları

#### PHASE 1: DISCOVER (💡 Keşif)
**Tetikleyici:** Kullanıcı yeni proje başlatıyor veya "fikir aşamasında"

**NOKTA Görevleri:**
1. Anahtar kelimeleri → Research Question'a evrimleştir
2. AcaVibe ile literatür gap analizi
3. Mindmap ile "future work" boşluklarını görselleştir
4. Keşfet ile ilgili kongre/grant'leri öner
5. `project-idea.md` dosyası oluştur (Karpathy IDEA standardı)

**Artifact Çıktısı:**
```markdown
# İmplant Başarısında Sigara ve Diyabetin Kombine Etkisi

## Problem
Türk popülasyonunda sigara + diyabet kombine faktörünün
implant osseointegrasyonuna etkisi çalışılmamış.

## Research Question
"Tip 2 diyabetli sigara içen hastalarda dental implant
başarı oranı, yalnızca diyabetli veya yalnızca sigara
içenlere kıyasla anlamlı farklılık gösterir mi?"

## PICO
- P: Dental implant adayı Tip 2 diyabetli hastalar
- I: Sigara içme durumu (kombine)
- C: Sigara içmeyen diyabetliler + sigara içen non-diyabetikler
- O: 12 aylık implant başarı oranı (osseointegrasyon)

## Suggested Methodology
→ Veri toplama: Scale Module (OHIP-14 + custom smoking history)
→ Analiz: Binary Logistic Regression (outcome: success/failure)

## Timeline
- M1-2: Ethics approval + survey design
- M3-6: Data collection (target n=180)
- M7: Analysis
- M8-9: Manuscript drafting
- M10: Submit to J Periodontology (IF 5.2)
```

---

#### PHASE 2: DESIGN (📐 Tasarım)
**Tetikleyici:** Research question onaylandı, veri toplama planlaması

**NOKTA Görevleri:**
1. Sample size hesapla (Power Analysis ile)
2. Scale Module'den uygun ölçekleri öner (OHIP-14, VAS, vs.)
3. Custom soru formu oluştur (smoking history, demographics)
4. Veri toplama stratejisi (QR code, email invitation)
5. Ekip davet et (Collaboration modülü)

**Örnek Konuşma:**

```
NOKTA: "Power analysis sonucu: α=0.05, power=0.80,
effect size=0.5 için minimum 156 katılımcı gerekiyor.
%20 dropout için hedef: 187 kişi. Tamam mı?"
[Tamam] [Parametreleri değiştir]

NOKTA: "Veri toplama için şu ölçekleri öneriyorum:
1. OHIP-14 (ağız sağlığı yaşam kalitesi)
2. VAS (ağrı skalası)
3. Custom form (sigara geçmişi, HbA1c değerleri)

Hepsini tek ankette birleştirelim mi?"
[Evet, birleştir] [OHIP-14'ü çıkar]

NOKTA: ✅ Anket hazır!
🔗 Önizleme: [Link]
📱 QR Code: [Görsel]
📧 Email daveti göndermek ister misin?
```

**Artifact Çıktısı:**
- Responsive web formu (istabot.com/survey/abc123)
- QR kod (kliniğe asılacak poster için)
- Email invitation template

---

#### PHASE 3: EXECUTE (⚙️ Yürütme)
**Tetikleyici:** Veri toplama tamamlandı veya kullanıcı "Veri analiz etmek istiyorum" dedi

**NOKTA Görevleri:**
1. Veriyi diagnose et (missing data, outliers, normality)
2. Uygun analiz öner (algorithm-driven, ISTABOT core)
3. "Tek tıkla analiz" seçeneği sun
4. Rapor formatı seç (APA Turkish/English, PDF/Word)
5. Canvas ile graphical abstract/video oluştur

**Örnek Konuşma:**

```
NOKTA: "Veri yüklendi: 187 satır, 24 değişken.
✓ Missing data %3 (kabul edilebilir)
✓ Outlier analizi tamamlandı (2 veri noktası işaretlendi)
⚠ Normallik: Shapiro-Wilk p=0.03 (non-parametrik test önerilir)

Research question'ınıza göre şu analizi öneriyorum:
📊 Binary Logistic Regression
   • Outcome: İmplant başarısı (success/failure)
   • Predictors: Sigara (evet/hayır), Diyabet kontrolü (HbA1c), Yaş

Tek tıkla çalıştırayım mı?"
[Çalıştır] [Değişken ekle/çıkar]

→ USER: [Çalıştır]

NOKTA: ⏳ Analiz çalışıyor... ✅ Tamamlandı!

📈 Sonuç özeti:
   • Sigara + diyabet kombine OR: 2.8 (95% CI: 1.4-5.6, p<0.001)
   • Yalnızca sigara OR: 1.5 (p=0.12)
   • Yalnızca diyabet OR: 1.9 (p=0.04)

Bu sonuçları nasıl kullanmak istersin?
[APA rapor indir] [Graphical abstract oluştur] [Manuscript'e aktar]
```

---

#### PHASE 4: PUBLISH (📄 Yayınlama)
**Tetikleyici:** Analiz tamamlandı, manuscript hazırlama zamanı

**NOKTA Görevleri:**
1. IMRAD bölümlerini auto-populate et
2. Introduction'ı DISCOVER fazındaki literature gap ile doldur
3. Methods'u DESIGN fazındaki survey/study design ile doldur
4. Results'ı EXECUTE fazındaki analiz çıktıları ile doldur
5. Discussion'ı AI-assisted yazım ile tamamla
6. Canvas ile sunum/poster/video oluştur
7. Journal Matchfinder ile hedef dergi öner

**Örnek Konuşma:**

```
NOKTA: "Manuscript taslağını oluşturmaya hazırım.
IMRAD bölümlerini otomatik dolduracağım:

📝 Introduction:
   Kaynak → DISCOVER fazındaki literature gap analizi

📝 Methods:
   Kaynak → DESIGN fazındaki survey design + sample size

📝 Results:
   Kaynak → EXECUTE fazındaki logistic regression output

📝 Discussion:
   AI yardımıyla literatür bağlamında yorumlama

Başlayalım mı?"
[Başla] [Önce Introduction'ı göster]

→ USER: [Başla]

NOKTA: ⏳ Taslak oluşturuluyor... ✅ Hazır!

📄 Manuscript: "Combined Effect of Smoking and Diabetes
on Dental Implant Success: A Turkish Cohort Study"
   • Kelime sayısı: 3.247 (JAMA limit: 3.500 ✓)
   • Kaynaklar: 28 (DISCOVER fazından auto-import)
   • Tablolar: 3 (demographics, regression, subgroup)

Hedef dergi önerim:
🎯 Journal of Periodontology (IF 5.2, acceptance rate 18%)
   → Scope match: %92
   → Submission fee: $0 (open access $3.200)

Manuscript'i indirmek ister misin?"
[Word indir] [LaTeX indir] [Önce dergi değiştir]
```

---

## 4. Kullanım Senaryoları

### Senaryo 1: Sıfırdan Başlayan Öğrenci
**Profil:** Periodontoloji uzmanlık öğrencisi, 1. yıl, danışmanla ilk görüşme yapıldı

**Giriş:**
```
USER: "Hocamla görüştüm, 'diyabet ve implant' konusunda bir şey yapacağım ama daha ne yapacağımı bilmiyorum."
```

**NOKTA Akışı:**

1. **DISCOVER Fazı (Hafta 1-2)**
   - NOKTA: Anahtar kelimeleri toplar (diyabet, implant, sigara?)
   - AcaVibe ile 20 paper tarar, gap bulur
   - Mindmap ile boşluğu görselleştir
   - Research question formüle eder
   - `project-idea.md` oluşturur

2. **DESIGN Fazı (Hafta 3-4)**
   - Power analysis → n=187
   - Scale Module → OHIP-14 + custom form
   - Anket oluşturur, QR kod verir
   - Danışman + co-author davet eder

3. **EXECUTE Fazı (Ay 3-6)**
   - Veri toplama takibi (127/187 ✓)
   - Veri diagnose → normallik kontrolü
   - Logistic regression önerir
   - APA rapor + graphical abstract oluşturur

4. **PUBLISH Fazı (Ay 7-8)**
   - Manuscript auto-draft (IMRAD)
   - Journal Periodontology önerir
   - Kongre sunumu için slides + poster hazırlar

**Sonuç:** 8 ayda "anahtar kelime → Q1 dergiye submission" tamamlandı. Tek platform, guided conversation, zero tool-switching.

---

### Senaryo 2: Veri Olan Araştırmacı (Ara Aşama Girişi)
**Profil:** Dahiliye araştırmacısı, elinde Excel'de 200 hasta verisi var

**Giriş:**
```
USER: "Elimde Covid hastalarının IL-6 ve D-Dimer verileri var. Mortalite ile ilişkisine bakmak istiyorum ama hangi testi yapacağımı bilmiyorum."
```

**NOKTA Akışı:**

1. **Faz Tespiti:** EXECUTE fazına direkt giriş (DISCOVER/DESIGN atlanır)

2. **EXECUTE Hızlandırma:**
   - Veriyi yükle (Excel/CSV import)
   - Diagnose çalıştır (missing data, outliers)
   - Outcome: Binary (exitus: yes/no) → Binary Logistic Regression öner
   - Tek tıkla analiz
   - APA rapor + OR/CI tablosu

3. **Retroaktif DESIGN Desteği (Opsiyonel):**
   - NOKTA: "Power analysis yapmadınız. Mevcut n=200 ile effect size 0.5 tespit etme gücünüz %87. Yeterli mi?"
   - Eksik metodolojik adımları checklist ile göster

4. **PUBLISH Tamamlama:**
   - Methods bölümünü retrospektif çalışma şablonuyla doldur
   - Results'ı regression output ile oluştur
   - Canvas ile ROC curve infographic üret

**Sonuç:** 2 saatte "ham veri → yayına hazır rapor". Ek bonus: Eksik metodolojik adımları (power analysis, pre-registration) hatırlattı.

---

### Senaryo 3: Ölçek Geliştirme Projesi
**Profil:** Psikiyatri akademisyeni, yeni bir anksiyete ölçeği geliştirmek istiyor

**Giriş:**
```
USER: "Türkçe'de iyi bir sosyal anksiyete ölçeği yok. Yeni bir ölçek geliştirmek istiyorum."
```

**NOKTA Akışı:**

1. **DISCOVER:**
   - Mevcut ölçekleri tara (LSAS, SPIN, SPS)
   - Türkçe adaptasyonlarının psikometrik özelliklerini değerlendir
   - Gap: "Kültüre özgü sosyal bağlam maddeleri eksik"

2. **DESIGN (Scale Development Mode):**
   - Madde havuzu oluştur (AI-assisted item generation)
   - Uzman panel davet et (Collaboration)
   - Pilot çalışma anketi (n=50)
   - Madde eleme kriterleri belirle

3. **EXECUTE:**
   - Pilot data → Item analysis (Cronbach α, item-total correlation)
   - Final ölçek (20 madde → 15 madde)
   - Validation study (n=300)
   - Confirmatory Factor Analysis (CFA)
   - Concurrent validity (LSAS ile korelasyon)

4. **PUBLISH:**
   - Psychometric manuscript template
   - Ölçek Türkçe/İngilizce versiyonları PDF
   - Creative Commons license ile Scale Library'ye ekle

**Sonuç:** NOKTA, normal analiz dışında "ölçek geliştirme workflow" ile domain-specific orchestration sağladı.

---

## 5. Teknik Mimari

### 5.1 NOKTA Agent Orchestration Stack

```
┌──────────────────────────────────────────────────┐
│         USER INTERFACE (Mobile/Web)              │
│  Chat Interface + MRLC Progress Bar + Artifacts  │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│          NOKTA ORCHESTRATOR (Rails)              │
│  • Conversation State Machine                    │
│  • Context Manager (persona, project, phase)     │
│  • Agent Router (DISCOVER/DESIGN/EXECUTE/PUBLISH)│
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│         PHASE-SPECIFIC AGENTS (Claude API)       │
├──────────────────────────────────────────────────┤
│  💡 DISCOVER Agent:                              │
│     - AcaVibe controller                         │
│     - Mindmap generator                          │
│     - Research question formulator               │
│                                                   │
│  📐 DESIGN Agent:                                │
│     - Power analysis calculator                  │
│     - Scale recommender                          │
│     - Survey builder orchestrator                │
│                                                   │
│  ⚙️ EXECUTE Agent:                               │
│     - Data diagnose                              │
│     - Statistical test selector (ISTABOT core)   │
│     - Report formatter                           │
│                                                   │
│  📄 PUBLISH Agent:                               │
│     - IMRAD auto-population                      │
│     - Literature context injector                │
│     - Journal recommender                        │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│            ISTABOT CORE SERVICES                 │
│  • R Statistical Engine (Plumber API)            │
│  • Scale Module (PostgreSQL)                     │
│  • Canvas (DALL-E, Remotion, python-pptx)        │
│  • AcaVibe (PubMed API, Semantic Scholar)        │
│  • Collaboration (User management)               │
└──────────────────────────────────────────────────┘
```

---

### 5.2 Conversation State Machine

NOKTA, her kullanıcı mesajında "mevcut state" ve "hedef artifact" bağlamında karar verir:

```ruby
# Pseudo-kod
class NoktaOrchestrator
  def process_message(user_input)
    context = ContextManager.load(user_id)
    # context.persona, context.project, context.phase, context.last_artifact

    intent = IntentClassifier.detect(user_input, context)
    # intent: "new_project", "continue_phase", "jump_to_analysis", vb.

    agent = AgentRouter.select(intent, context.phase)
    # agent: DiscoverAgent / DesignAgent / ExecuteAgent / PublishAgent

    response = agent.generate_response(user_input, context)

    context.update(response.state_changes)

    return {
      message: response.text,
      ui_components: response.components, # buttons, cards, progress bar
      artifacts: response.artifacts        # project-idea.md, survey link, report
    }
  end
end
```

---

### 5.3 Context Memory (Karpathy autoresearch pattern)

NOKTA, her sohbette "project memory" biriktirir:

```json
{
  "project_id": "proj_abc123",
  "title": "İmplant + Diyabet Çalışması",
  "current_phase": "DESIGN",
  "conversation_history": [
    {"role": "user", "content": "implant ve diyabet çalışmak istiyorum"},
    {"role": "nokta", "content": "Periodontoloji uzmanlığınız için uygun..."}
  ],
  "artifacts": {
    "idea_md": "/storage/proj_abc123/idea.md",
    "research_question": "Tip 2 diyabetli...",
    "survey_url": "istabot.com/survey/abc123",
    "analysis_report": null
  },
  "decisions": {
    "sample_size": 187,
    "selected_scales": ["OHIP-14"],
    "statistical_test": "binary_logistic"
  },
  "milestones": [
    {"phase": "DISCOVER", "completed_at": "2026-04-10", "artifact": "idea.md"},
    {"phase": "DESIGN", "status": "in_progress", "progress": 0.6}
  ]
}
```

Bu context, her NOKTA agent'ına enjekte edilir (RAG-like retrieval):

```
USER: "Analizimi çalıştır"

NOKTA Agent:
→ Context yükle: research_question, selected_scales, sample_size
→ Veriyi çek: 187 satır (target match ✓)
→ Diagnose çalıştır
→ decision.statistical_test = "binary_logistic" (auto-select)
→ R API'ye gönder
→ Rapor oluştur
→ artifacts.analysis_report = "/storage/proj_abc123/report.pdf"
→ milestones güncelle: EXECUTE completed
```

---

### 5.4 Backend-Driven UI (A2UI - Adaptive UI)

NOKTA, her fazda farklı UI bileşenleri render eder (NOKTA.md temel içgörü 3):

```javascript
// Frontend (Angular)
onNoktaResponse(response) {
  this.chatMessages.push(response.message);

  // Dynamic UI rendering
  response.ui_components.forEach(component => {
    switch(component.type) {
      case 'button_group':
        this.renderButtons(component.options);
        break;
      case 'progress_bar':
        this.renderPhaseProgress(component.data);
        break;
      case 'scale_selector':
        this.renderScaleCards(component.scales);
        break;
      case 'artifact_preview':
        this.renderArtifact(component.artifact_url);
        break;
    }
  });
}
```

**Örnek: DESIGN fazında Scale seçimi**

NOKTA response:
```json
{
  "message": "Veri toplama için ölçek seçelim. Önerilerim:",
  "ui_components": [
    {
      "type": "scale_selector",
      "scales": [
        {
          "id": "ohip14",
          "name": "OHIP-14",
          "description": "Ağız sağlığı yaşam kalitesi",
          "items": 14,
          "validated_tr": true,
          "recommended": true
        },
        {
          "id": "vas",
          "name": "Visual Analog Scale",
          "description": "Ağrı değerlendirmesi",
          "items": 1,
          "validated_tr": true
        }
      ]
    },
    {
      "type": "button_group",
      "options": [
        {"label": "Hepsini seç", "action": "select_all"},
        {"label": "Custom form ekle", "action": "add_custom"}
      ]
    }
  ]
}
```

Frontend bu JSON'ı alır, kartlar + butonlar render eder.

---

## 6. Slop Prevention (Karpathy noslop-mobile.md alignment)

NOKTA, `10-draft-ideas/noslop-mobile.md` felsefesine **sıkı sıkıya** bağlıdır:

### 6.1 Prensip 1: No Hallucination (Engineering-Grounded)
- Her öneri, ISTABOT'un mevcut modüllerine veya literatür veritabanına dayalı
- "Belki şunu deneyin?" yerine → "Veri dağılımınız non-normal, Kruskal-Wallis öneriyorum (varsayım: ≥3 grup, bağımsız)"

### 6.2 Prensip 2: Constrained Inputs (Guided Choices)
- Açık uçlu "Ne yapmak istersiniz?" → Asla
- "3 seçenekten birini seçin: [A] Literatür tara, [B] Anket oluştur, [C] Analiz et" → Her zaman

### 6.3 Prensip 3: Artifact-First (Output Obsession)
- Her konuşma bloğu sonunda somut artifact: `idea.md`, survey link, report PDF
- Sohbet ≠ amaç. Sohbet = artifact'a ulaşma aracı.

### 6.4 Prensip 4: Domain-Specific Context (No Generic LLM Bs)
- Generic "Harika bir fikir!" → Asla
- "Periodontoloji'de 2023 sistemik review'lerde bu gap vurgulanmış (PMID: 37482910)" → Her zaman

---

## 7. Farklılaştırıcılar (vs. Genel LLM Chatbotları)

| Özellik | Generic ChatGPT | ISTABOT × NOKTA |
|---------|----------------|-----------------|
| **Orchestration** | Tek seferlik cevap | 4-faz MRLC pipeline |
| **Context Memory** | Sıfır (her chat yeni) | Project-level persistent memory |
| **Domain Knowledge** | Genel bilgi | Medical research + Turkish academia |
| **Statistical Decision** | Kullanıcıya sorar | Algorithm-driven auto-select |
| **Artifact Generation** | Markdown metin | Survey forms, APA reports, IMRAD manuscripts |
| **Integration** | Kopyala-yapıştır | Tek platform (Scale→Analysis→Publish) |
| **Slop Risk** | Yüksek (hallucination) | Sıfır (engineering-grounded constraints) |

---

## 8. Roadmap

### Phase 1: MVP (3 ay)
- **Hedef:** DISCOVER + DESIGN fazlarında guided conversation
- **Deliverables:**
  - Research question formulator bot
  - AcaVibe integration (literature gap → RQ)
  - Scale Module → Survey builder conversation
  - `project-idea.md` auto-generation
- **Tech:**
  - Rails conversation state machine
  - Claude API agent prompts (DISCOVER/DESIGN)
  - Angular chat UI + dynamic component rendering

---

### Phase 2: Full MRLC (6 ay)
- **Hedef:** EXECUTE + PUBLISH ekleme
- **Deliverables:**
  - Data diagnose conversation
  - "Tek tıkla analiz" button orchestration
  - IMRAD auto-population (Introduction from DISCOVER, Methods from DESIGN)
  - Canvas integration (graphical abstract conversation)
- **Tech:**
  - Execute Agent (R API orchestrator)
  - Publish Agent (manuscript template engine)
  - NotebookLM podcast generation (analysis → audio summary)

---

### Phase 3: Advanced Intelligence (12 ay)
- **Hedef:** Otonom research gap hunting, collaborative QA
- **Deliverables:**
  - **Proactive Gap Finder:** Kullanıcı profili analizi → "Bu hafta yeni bir systematic review yayınlandı, sizin alanınıza uygun gap buldum" bildirimi
  - **Retroaktif Metodoloji Checker:** "Analiziniz tamamlandı ama pre-registration yapmadınız, bu dergi (JAMA) için sorun olabilir" uyarısı
  - **Collaborative QA (NDA Mode):** Premium kullanıcılar, NOKTA conversation'ını dış danışmanlara (NDA altında) açabilir
  - **Marketplace Integration:** Olgunlaşmış `project-idea.md` → Satılabilir artifact (Nokta.md vision)
- **Tech:**
  - PubMed RSS feed monitoring + semantic matching
  - Redis-based notification queue
  - NDA contract smart signature (DocuSign API?)
  - Idea marketplace backend (pricing, escrow, transfer)

---

## 9. Success Metrics (KPI)

| Metrik | MVP Hedef | V2 Hedef |
|--------|-----------|----------|
| **Nokta → Artifact Tamamlanma Oranı** | %40 | %70 |
| **Ortalama "Fikir → Survey" Süresi** | 2 saat | 30 dakika |
| **Ortalama "Fikir → Manuscript Draft" Süresi** | 3 ay | 1 ay |
| **Kullanıcı Conversation Abandonment Rate** | <%50 | <%20 |
| **AI-Generated Content User Edit Rate** | <%30 | <%15 |
| **NPS (Net Promoter Score)** | >40 | >60 |

---

## 10. Özet (Executive Summary)

**ISTABOT × NOKTA**, Türk akademisyenlerine "anahtar kelime kırıntısından Q1 dergiye submission'a" uctan-uca **AI-orchestrated research lifecycle** sunar.

**Nasıl?**
- 4-faz MRLC (DISCOVER → DESIGN → EXECUTE → PUBLISH) guided conversation ile
- Engineering-constrained, slop-free, domain-specific prompting ile
- Persistent project memory ve artifact-first execution ile

**Neden şimdi?**
- ISTABOT'un mevcut modülleri (AcaVibe, Scale, R engine, Canvas) zaten var → sadece orchestration layer gerekiyor
- Turkish academia "SPSS + Google Forms + Word şablonu" toolchain fragmentation acısı zirvede
- Karpathy autoresearch pattern (idea.md → artifact) akademik research domain'e perfect-fit

**Kim kazanır?**
- Uzmanlık öğrencisi: "3 anahtar kelime" → 8 ayda tez tamamlama
- Araştırmacı: "Ham veri + soru" → 2 saatte APA rapor
- Akademisyen: "Ölçek geliştirme fikri" → validation study roadmap

**Sonuç:** NOKTA, ISTABOT'u **reactive tool'dan proactive research co-pilot'a** dönüştürür. Kullanıcı artık "hangi butona basayım?" demez; NOKTA sorar: **"Bugün ne yapmak istersiniz?"** ve onu oraya taşır.

---

*Document Version: 1.0 | Date: April 2026 | Author: NAIM (via Claude Code)*
*Aligned with: nokta.md, istabot-knowledge.md, istabot-mrlc.md*

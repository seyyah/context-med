# context-narrate

*Doğrulanmış medikal wiki içeriğinden, kontrollü ve kaynak-bağlantılı sesli özet veya podcast formatında eğitim materyali üreten, çok-sesli anlatıcı sistemi.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce context-narrate'in ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır.

---

## 1. Tez (Thesis)

Sağlık profesyonelleri ve tıp öğrencileri yoğun çalışma saatleri içinde sürekli güncellenen medikal bilgiyi takip etmek zorundadır. Bir makaleyi okumak 20-45 dakika alır; aynı içeriği dinlemek aynı süreyi alır ama eller serbest kalır — hastane yolculuğunda, ameliyathane aralarında, spor yaparken.

Mevcut "makale-to-speech" araçlarının temel sorunu **bağlam kaybı ve kaynak kontrolsüzlüğüdür**: ham PDF'i TTS'e vermek, referansları, tabloları ve kritik uyarıları gürültüye dönüştürür. Sonuç, dinlenemez ve güvenilmez bir ses dosyasıdır.

context-narrate'in çekirdek iddiası şudur: **context-wiki'nin ürettiği micro-wiki yapısı, ses anlatısının "tek gerçek kaynağı"dır.** Wiki zaten distile edilmiş, çapraz-referanslanmış, kaynak-doğrulanmış içeriği barındırır. Bu yapıdan hedefe yönelik (10 dk özet / 30 dk deep-dive / soru-cevap podcast) ses formatı üretmek bir yaratıcılık problemi değil, bir **senaryo derleme (script compilation) ve ses üretim (audio synthesis) pipeline problemidir.**

Sistem acaVibe'ın "Tinder for papers" mantığından esinlenir ama bunun yerine **"NotebookLM for medical wikis"** örüntüsünü benimser: kullanıcı wiki içeriğini veya bir medical topic'i seçer; sistem ona uygun formatta (özet, podcast, FAQ audio) Türkçe veya İngilizce ses içeriği sunar.

**Temel değer önermesi:** Medikal profesyonel konu seçer, format belirler (özet/podcast/FAQ), dil seçer; sistem micro-wiki'den senaryolaştırılmış, kaynak-bağlantılı, çok-sesli ses içeriği üretir. Kullanıcı hastane yolunda, ameliyathane arasında veya koşu sırasında bilgiyi edinir.

---

## 2. Problem

### 2.1 Bilgi Tüketim Zaman Kısıtı

Bir sağlık profesyonelinin günlük çalışma saati 10-14 saat. Bu sürede ekran başında makale okumak lüks bir aktivitedir. Ancak yolculuk, yürüyüş, spor gibi "eller-serbest" zamanlar vardır ve bu zamanlar boşa harcanır.

### 2.2 Mevcut TTS Araçlarının Yetersizliği

Ham PDF'i Google TTS veya Eleven Labs'e vermek şu sorunları üretir:
- Referans listesi ([1], [2], [3]...) gürültü olarak okunur
- Tablolar ve rakamlar anlaşılmaz hale gelir
- Önemli uyarılar (contradictions, limitations) kaybolur
- İçerik yapısı (intro, methods, results) kaybolur; dinleyici nerede olduğunu bilemez

### 2.3 Podcast Üretiminin Manuel Maliyeti

Bir medical educator'ın podcast hazırlaması 6-12 saat sürer: literatür okuma, senaryo yazma, kayıt, düzenleme. Bu maliyet her güncel konu için sürdürülemez.

### 2.4 Güven ve Kaynak Şeffaflığı

Sağlık alanında "dinlediğim bilgi hangi kaynaktan geliyor?" sorusu kritiktir. Mevcut podcast'lerde kaynak atıfları genellikle show-notes'a gömülür ve dinleme sırasında erişilemez.

---

## 3. Nasıl Çalışır (How It Works)

### Temel İçgörü 1 — Wiki Yapısı = Ses Senaryosu İskeleti

context-wiki'nin ürettiği markdown ağacı (entity pages, concept pages, procedure pages) zaten bir **anlatı yapısıdır**. Her sayfa bir bölüm, her başlık bir segment, her çapraz-referans bir geçiş noktası olarak ele alınabilir.

```
micro-wiki/cardiovascular/
  ├─ entities/
  │   └─ atrial-fibrillation.md
  ├─ concepts/
  │   ├─ anticoagulation-strategy.md
  │   └─ stroke-risk-assessment.md
  └─ procedures/
      └─ chads-vasc-scoring.md
```

Kullanıcı "Atrial Fibrillation özeti" seçerse:
1. `atrial-fibrillation.md` ana senaryo olur
2. İlişkili concept ve procedure sayfaları segmentlere dönüşür
3. Çapraz-referanslar "daha fazla bilgi için X bölümüne bakın" cümlesine çevrilir

### Temel İçgörü 2 — Format Konfigürasyonu = Anlatı Derinliği

```yaml
# config/medical-summary-10min.yaml
duration_min: 10
format: summary
audience: healthcare-professional
language: tr
voice_config:
  narrator: professional-female     # Ana anlatıcı
  emphasis_style: clinical          # Sayısal değerler ve uyarılar vurgulanır
sections:
  - intro: 1min
  - key_points: 5min
  - clinical_implications: 2min
  - limitations: 1min
  - outro: 1min
source_citations: timestamps        # "Bu bilgi kaynak 3'ten alınmıştır — 2:34"
```

```yaml
# config/medical-podcast-30min.yaml
duration_min: 30
format: conversational-podcast
audience: medical-student
language: tr
voice_config:
  host: professional-male
  expert: professional-female
  style: dialogue                   # Soru-cevap formatı
sections:
  - intro: 2min
  - background: 5min
  - deep_dive: 15min
  - qa: 5min
  - takeaways: 2min
  - outro: 1min
source_citations: inline            # "Araştırma X'e göre..."
```

### Temel İçgörü 3 — Çok-Sesli Anlatı = Bilgi Katmanları

Tek bir monoton ses yerine, **içerik tipine göre farklı ses profilleri**:

- **Ana Anlatıcı (Narrator):** Genel akış, bağlam, geçişler
- **Vurgulayıcı (Emphasizer):** Sayısal değerler, kritik uyarılar, contradictions
- **Kaynak Okuyucu (Citation Voice):** "Bu bilgi 2023 ESC Guideline'dan alınmıştır"
- **Podcast Modunda İkinci Ses (Expert/Co-host):** Soru sorar, açıklama ister, özetler

Örnek senaryo snippet'i:

```
[NARRATOR - Professional Female]
"Atriyal fibrilasyon en sık görülen kalıcı aritmidir. Prevalans yaşla birlikte artış gösterir."

[EMPHASIZER - Clinical Tone]
"65 yaş üstü popülasyonda prevalans yüzde 5 ila 8 arasındadır."

[CITATION - Neutral]
"Kaynak: European Heart Journal, 2023."

[NARRATOR]
"Stroke riski değerlendirmesinde en yaygın kullanılan araç CHA2DS2-VASc skorudur."
```

### Temel İçgörü 4 — Kaynak Şeffaflığı = Timestamp + Show Notes

Her ses dosyası iki çıktı üretir:

1. **Audio File** (MP3/M4A): Dinlenebilir içerik
2. **Transcript + Show Notes** (Markdown/HTML):
   - Tam metin transkripsiyon
   - Timestamp'li kaynak listesi
   - Segment atlama linkleri (00:34 - Introduction, 02:15 - Key Findings)
   - Orijinal wiki sayfalarına direkt linkler

Örnek show-notes:

```markdown
# Atrial Fibrillation: 10-Minute Clinical Summary

**Duration:** 9:47
**Language:** Turkish
**Generated from:** micro-wiki/cardiovascular/atrial-fibrillation.md

## Segments
- [00:00] Introduction
- [01:23] Epidemiology & Risk Factors
- [03:45] Stroke Risk Assessment (CHA2DS2-VASc)
- [06:12] Anticoagulation Strategy
- [08:30] Clinical Implications
- [09:15] Limitations & Future Directions

## Sources Referenced
1. [01:34] European Heart Journal 2023 → wiki/sources/ESC-2023-AF.md
2. [03:55] CHADS-VASc validation study → wiki/sources/chads-vasc-2010.md
3. [06:45] NOAC meta-analysis → wiki/sources/noac-meta-2022.md

## Full Transcript
[Available as downloadable PDF]
```

### Temel İçgörü 5 — Free & Open-Source TTS Stack

context-narrate **açık-kaynak ve ücretsiz araçları** önceliklendirir:

**TTS Engines (Öncelik Sırasıyla):**
1. **Coqui TTS** (Open-source, self-hosted, multilingual) — Türkçe desteği iyi
2. **Piper TTS** (Fast, local, neural voices)
3. **Mozilla TTS** (Community-driven)
4. **Fallback:** ElevenLabs API (ücretli, ancak kalite gerektiren özel durumlar için)

**Ses İşleme:**
- **ffmpeg**: Ses birleştirme, normalizasyon, segment kesme
- **pydub** (Python): Programatik audio manipulation
- **audiowaveform**: Dalga formu görselleri (show-notes için)

**Multilingual Support:**
- **Türkçe (default):** Coqui TTS Turkish models
- **İngilizce (optional):** Piper TTS English models

---

## 4. Mimari (Architecture)

### Katman 1 — Bilgi Katmanı (Knowledge Layer)

- **micro-wiki/** — context-wiki tarafından derlenmiş medikal bilgi ağacı
- **operational-schema.yaml** — hangi wiki sayfalarının hangi formatta ses üretebileceği
- **audio-configs/** — format YAML dosyaları (summary-10min, podcast-30min, faq-15min)
- **prompts/** — senaryo yazım prompt'ları (narrator_script_v1.md, dialogue_script_v1.md)

### Katman 2 — Runtime Katmanı (Audio Pipeline)

```
Wiki Page Selection + Config Loader
       ↓
ScriptWriterAgent — wiki'den senaryo üretir (markdown → timed-script)
       ↓
SourceLinkerAgent — her claim için kaynak timestamp ekler
       ↓
VoiceMapperAgent — hangi satırı hangi ses profili okumalı?
       ↓
TTS Engine (Coqui/Piper/Mozilla) — script → audio segments
       ↓
AudioAssembler (ffmpeg/pydub) — segment'leri birleştir, normalize et
       ↓
ShowNotesGenerator — transcript + timeline + kaynak listesi
       ↓
Output: MP3/M4A + HTML show-notes + PDF transcript
```

### Katman 3 — Geri Yazma Katmanı (Writeback & Analytics)

Kullanıcı ses içeriğini dinler ve şu aksiyonları gerçekleştirebilir:
- **Thumbs up/down:** Bu segment faydalı mıydı?
- **Pause points:** Nerede duraksadı? (Analytics: hangi bölüm karmaşık?)
- **Replay count:** Hangi segment tekrar dinlendi? (Analytics: o bölüm senaryoda revize edilmeli)

Analytics → PromptRefiner → ScriptWriterAgent için yeni kurallar

---

## 5. Operasyonlar (Operations)

### Senaryo 1 — Hızlı Özet Üretimi

```bash
context-narrate generate \
  --wiki micro-wiki/cardiovascular/atrial-fibrillation.md \
  --config summary-10min \
  --language tr \
  --output audio/afib-summary.mp3
```

**Çıktı:**
- `afib-summary.mp3` (9:47)
- `afib-summary-shownotes.html`
- `afib-summary-transcript.pdf`

### Senaryo 2 — Podcast Formatı (Konuşma Stili)

```bash
context-narrate generate \
  --wiki micro-wiki/cardiology/ \
  --config podcast-30min \
  --style dialogue \
  --language tr \
  --output podcast/cardio-update-ep01.mp3
```

Sistem wiki klasöründeki tüm ilgili sayfaları okur, bir "host + expert" diyaloğu senaryosu yazar, iki farklı ses profiliyle üretir.

### Senaryo 3 — FAQ Audio (Soru-Cevap)

```bash
context-narrate faq \
  --wiki micro-wiki/oncology/breast-cancer.md \
  --questions questions/breast-cancer-faq.yaml \
  --language en \
  --output audio/bc-faq.mp3
```

`questions.yaml`:
```yaml
questions:
  - "What are the main risk factors for breast cancer?"
  - "How is HER2 status determined?"
  - "What are the treatment options for triple-negative breast cancer?"
```

Her soru bir segment, cevaplar wiki'den çekilir.

### Senaryo 4 — Çoklu Dil Üretimi

```bash
context-narrate batch \
  --wiki micro-wiki/emergency/sepsis.md \
  --configs summary-10min,podcast-30min \
  --languages tr,en \
  --output audio/sepsis/
```

**Çıktı:**
- `sepsis-summary-tr.mp3`
- `sepsis-summary-en.mp3`
- `sepsis-podcast-tr.mp3`
- `sepsis-podcast-en.mp3`

---

## 6. Ne Yapmaz (What It Does Not Do)

- **Müzik veya sound-effect üretmez.** Saf bilgi odaklı ses içeriğidir; intro/outro müziği manuel eklenebilir ama sistem üretmez.
- **Gerçek zamanlı sohbet chatbot değildir.** Önceden derlenmiş içerikten ses üretir; dinamik kullanıcı sorusuna anında cevap vermez.
- **Halüsinasyon yapmaz.** Her cümle wiki'deki doğrulanmış içerikten gelir. Wiki'de yoksa senaryoya girmez.
- **Video üretmez.** Sadece audio + show-notes. Gelecekte dalga formu animasyonu eklenebilir ama MVP kapsamı dışı.
- **Sosyal medya paylaşım optimizasyonu yapmaz.** Uzun-formatlı içerik üretir; kısa clip'lere kesme kullanıcının inisiyatifindedir.

---

## 7. Neden Şimdi (Why Now)

**Açık-kaynak TTS kalitesi klinik kullanıma ulaştı:** Coqui TTS ve Piper TTS Türkçe ve İngilizce için profesyonel kalitede ses üretebiliyor. 2022 öncesi TTS robotik ve kullanılamaz durumdaydı.

**NotebookLM'nin podcast özelliği medical community'de viral oldu:** Kullanıcılar PDF yükleyip "podcast üret" özelliğini kullanıyor ama **kaynak kontrolsüzlüğü** ve **medikal doğruluk** sorunları var. context-narrate bu problemi çözer: wiki-tabanlı, kaynak-şeffaf, klinik-doğrulanmış içerik.

**context-wiki altyapısı hazır:** Micro-wiki derleme, writeback, ratchet eval — hepsi çalışıyor. context-narrate bunların üstüne oturup ses çıktısı üretir.

**Sağlık profesyonellerinin mobil içerik tüketimi %72'ye ulaştı:** (acaVibe verisi). Ancak mevcut araçlar akademik makalelere odaklı; medikal wiki içeriğinden sesli özet üreten bir araç yok.

---

## 8. Kim Fayda Sağlar (Who Benefits)

**Klinik Doktorlar:** Hastane yolculuğunda, nöbet aralarında, spor yaparken güncel kılavuzları ve literatür özetlerini dinleyerek bilgi edinir.

**Tıp Öğrencileri:** Ders notlarını, klinik rehberleri sesli format olarak dinleyerek çalışma verimliliğini artırır.

**Medikal Eğitimciler:** Manuel podcast hazırlama maliyetini sıfıra indirir; wiki'yi güncelledikçe yeni ses içeriği otomatik üretilebilir.

**Araştırmacılar:** Literatür taraması yaparken context-wiki'de derlenen makalelerin sesli özetlerini dinleyerek hızlı filtreleme yapar.

**Sağlık Kurumları:** Personel eğitimi için standart, kaynak-doğrulanmış audio materyali üretir. Yeni guideline yayınlandığında audio güncelleme otomatik olur.

---

## 9. Teknik Mimari (Technical Architecture)

**Stack:**
- Python 3.11+, Pydantic v2, Typer
- **TTS Engines:** Coqui TTS (primary), Piper TTS (fallback), Mozilla TTS
- **Audio Processing:** ffmpeg, pydub, audiowaveform
- **LLM Providers:** Claude Sonnet (script generation), Gemini Flash (fallback)
- **Wiki Integration:** context-wiki API / file system
- **Output Formats:** MP3, M4A (audio) + HTML, PDF (show-notes)

**Ajan Rolleri:**

- **ScriptWriterAgent:** Wiki içeriğinden timed-script üretir; hangi cümle hangi dakikada okunacak?
- **SourceLinkerAgent:** Her klinik iddia için kaynak timestamp ekler.
- **VoiceMapperAgent:** Cümle tipine göre (narration/emphasis/citation) ses profili atar.
- **DialogueAgent:** Podcast modunda host-expert diyaloğu senaryosu yazar.
- **TTSOrchestrator:** Script'i segment'lere böler, her segment için uygun TTS engine'i çağırır.
- **AudioAssembler:** Segment'leri birleştirir, volüm normalize eder, pauses ekler.
- **ShowNotesGenerator:** Transcript, timeline, kaynak listesi, segment navigation üretir.
- **PromptRefiner:** Kullanıcı analytics'inden öğrenir; hangi segment türleri revize edilmeli?

**Config Tipleri (MVP):**
- `summary-10min.yaml` — Hızlı özet, tek ses
- `podcast-30min.yaml` — Konuşma formatı, iki ses
- `faq-15min.yaml` — Soru-cevap, tek ses
- `deep-dive-45min.yaml` — Detaylı inceleme, çok ses

---

## 10. Kısıtlamalar (Constraints)

- **TTS kalitesi dile bağlıdır:** Türkçe için Coqui TTS yeterli; İngilizce için Piper TTS daha iyi. Dil seçimi otomatik engine selection'ı tetikler.
- **Ses profili çeşitliliği sınırlıdır:** Açık-kaynak TTS'lerde 4-6 farklı kaliteli ses profili var; ticari API'ler (ElevenLabs) daha fazla seçenek sunar ama ücretlidir.
- **Müzik/SFX yoktur:** İçerik odaklı; prodüksiyon kalitesi podcast için manuel post-processing gerektirebilir.
- **Gerçek-zamanlı değildir:** Senaryo yazım + TTS üretim 10 dakikalık audio için ~2-3 dakika sürer.
- **Wiki kalitesi = Audio kalitesi:** Eğer wiki eksik veya yanlış bilgi içeriyorsa, audio da aynı hatayı taşır. Bu yüzden context-wiki'nin ratchet eval disiplini kritiktir.

---

## 11. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **TTS Türkçe aksanı/vurgusu yanlış** | Orta | Orta | Coqui TTS fine-tune; kullanıcı feedback ile problematik kelimeler pronunciation dictionary'e eklenir |
| **Kaynak timestamp'leri manuel doğrulanmadan yayınlanır** | Orta | Yüksek | SourceLinkerAgent her claim için wiki source quote validation yapar; Ethics Checker devreye girer |
| **Podcast diyaloğu yapay/monoton duyulur** | Yüksek (başlangıçta) | Orta | DialogueAgent prompt'u ratchet ile iyileştirilir; gerçek podcast örnekleriyle few-shot learning |
| **Audio segment'leri arasında ani geçişler** | Orta | Düşük | AudioAssembler cross-fade ve pause ekler; config'de ayarlanabilir |
| **Halüsinasyon (wiki'de olmayan bilgi)** | Düşük | Çok Yüksek | ScriptWriterAgent'ın her cümlesi wiki'den quote ile doğrulanır; doğrulanamayanlar senaryoya girmez |

---

## 12. Açık Sorular (Open Questions)

1. **Türkçe medikal terminoloji TTS doğruluğu:** Bazı ilaç isimleri veya Latince terimler yanlış telaffuz edilebilir. Pronunciation dictionary'nin kapsamı ne olmalı?
2. **Podcast diyalog formatı ne kadar interaktif olmalı?** "Host soruyor, expert cevaplıyor" yapısı mı, yoksa "iki uzman tartışıyor" formatı mı daha iyi?
3. **Audio güncelleme stratejisi:** Wiki güncellendi; tüm audio yeniden mi üretilmeli, yoksa sadece değişen segment mi yenilenecek?
4. **Show-notes embedding:** Audio player HTML widget show-notes'u direkt göstermeli mi, yoksa ayrı sayfa mı olmalı?
5. **Offline kullanım:** Audio dosyaları CDN'den mi sunulacak, yoksa kullanıcı download edip offline dinleyebilmeli mi?
6. **Çoklu-ses senkronizasyonu:** Podcast modunda iki ses profili aynı anda konuşursa (örn. tartışma anı), senkronizasyon nasıl sağlanır?

---

## 13. Değerlendirme — Ratchet Beklentisi

**Her format için altın-standart test seti:**
- **Summary-10min:** 20 adet wiki sayfası → manuel yazılmış referans script → TTS çıktısı karşılaştırması
- **Podcast-30min:** 10 adet diyalog script → insan dinleyici skoru (1-5: naturalness, informativeness)
- **FAQ-15min:** 15 adet soru-cevap → kaynak doğruluk oranı %100 olmalı

**Her iterasyonda sorulacak sorular:**
- ScriptWriterAgent'ın ürettiği her cümle wiki'den doğrulanabiliyor mu?
- SourceLinkerAgent'ın eklediği timestamp'ler show-notes'da doğru mu?
- Kullanıcılar hangi segment'lerde pause/replay yapıyor? (Analytics)
- Yeni prompt versiyonu önceki benchmark set'inden daha iyi skor alıyor mu?

**Başarısızlık Örnekleri → Writeback:**
- Dinleyici bir segment'i "kafa karıştırıcı" olarak işaretlerse → ScriptWriterAgent için kural eklenir
- Bir kaynak timestamp yanlışsa → SourceLinkerAgent validation kuralı güncellenir

---

## 14. Başarı Kriterleri (Success Criteria)

**Teknik Metrikler (zorunlu):**
- **%100 kaynak doğrulanabilirliği:** Her klinik iddia wiki'deki bir sayfaya trace edilebilir.
- **TTS akıcılığı:** İnsan dinleyici değerlendirmesi ortalama ≥ 3.5/5 (naturalness).
- **Audio üretim süresi:** 10 dakikalık içerik için toplam pipeline süresi < 5 dakika.
- **Ratchet geçerliliği:** Yeni ScriptWriterAgent versiyonu önceki test set'ini bozmuyor.

**Kullanım Metrikleri:**
- **Dinleme tamamlama oranı:** Kullanıcıların %60'ı audio'nun %80'ini dinliyor.
- **Tekrar dinleme oranı:** Kritik segment'ler (clinical implications) %30+ replay alıyor.
- **Show-notes kullanımı:** Kullanıcıların %40'ı show-notes HTML'i açıyor ve kaynak linklerine tıklıyor.
- **Dil dağılımı:** Türkçe %70, İngilizce %30 (hedef kitle medikal profesyoneller TR).

**Kalite Metrikleri:**
- **Halüsinasyon oranı:** < %1 (100 üretilen segment'te 1'den az doğrulanamayan iddia).
- **Kaynak timestamp doğruluğu:** %95+ (manuel spot-check ile).

---

## 15. Bağlam / Referanslar (Context / References)

**Sistem Bağlamı:**
- `context-wiki (rag-wiki.md)` — micro-wiki derleme ve bilgi kaynağı; context-narrate'in bilgi tabanı
- `context-core.md` — zincir koordinasyonu; context-narrate bir çıktı modülü olarak context-core'a entegre olur
- `context-gate.md` — kaynak doğrulama; audio'da kullanılan her claim gate'den geçmiş olmalı
- `context-shield.md` — PII maskeleme; hasta verisi içeren wiki sayfalarından audio üretilirse devreye girer

**İlham Kaynakları:**
- **NotebookLM (Google):** PDF'den podcast üretimi — ancak kaynak kontrolsüzlüğü sorunu var
- **acaVibe:** Akademik içerik keşfi için swipe mekanizması — context-narrate'de kullanıcı wiki sayfalarını swipe edip "bunu dinlemek istiyorum" seçebilir (gelecek iterasyon)
- **Podcastle, Descript:** Audio editing araçları — ama AI-generated medical script'e odaklı değil

**Teknik Araçlar:**
- **Coqui TTS:** https://github.com/coqui-ai/TTS — Open-source, multilingual
- **Piper TTS:** https://github.com/rhasspy/piper — Fast neural TTS
- **ffmpeg:** Audio manipulation
- **pydub:** Python audio library

**Standartlar:**
- Karpathy IDEA.md (2024) — bu dosyanın format standardı
- context-med ekosistem kontratlı (operational-schema, ratchet eval, writeback)

---

## 16. Cerebra ile İlişki (Dual-mode)

**Standalone Mod:** context-narrate kendi `micro-wiki/` klasöründen okur, audio üretir, analytics'i lokal tutar. Bağımsız bir ses üretim aracıdır.

**Cerebra-composed Mod:**
- context-wiki substrate'ine bağlanır; tüm micro-wiki'lere erişir
- Kullanıcı analytics'i (pause points, replay count) cerebra provenance grafiğine yazılır
- Audio üretim başarısızlıkları (halüsinasyon, kaynak eşleşmemesi) cerebra'nın `human-in-loop-agent`'ına eskalasyon yapar
- Ratchet eval yetenekleri framework'ten miras alınır

---

## 17. acaVibe ile İlişki

acaVibe "Tinder for research papers" iken, context-narrate **"Tinder for medical audio"** olabilir (gelecek iterasyon):

**Potansiyel Entegrasyon:**
- Kullanıcı medikal wiki sayfalarını swipe eder: sağa kaydır = "bunu podcast olarak dinlemek istiyorum"
- Kullanıcı tercihleri (cardiovascular > oncology, summary > podcast) öğrenilir
- Her sabah kullanıcının ilgi alanına göre 10-15 dakikalık kişiselleştirilmiş audio özet üretilir

**Fark:**
- acaVibe: akademik literatür keşfi, gerçek-zamanlı search
- context-narrate: medikal wiki içeriğinden audio üretimi, önceden derlenmiş içerik

İki sistem birleşirse: **"Senin için bugünkü kardiyoloji güncellemesi — 12 dakika"** şeklinde kişiselleştirilmiş, kaynak-doğrulanmış, sesli medikal haber bülteni üretilebilir.

---

> **Living Artifact Notu.** Bu belge yaşayan bir artefakttır. Yeni TTS engine'leri eklendikçe, ses profili çeşitliliği arttıkça, kullanıcı analytics'i daha fazla öğrendikçe güncellenir. Tezdeki "wiki yapısı = senaryo iskeleti, format config = anlatı derinliği" çerçevesi değişmedikçe teze dokunma; değiştiyse tezi yeniden yaz.

---

**Son Not:** context-narrate, context-med ekosisteminde **bilgi tüketim modunu genişleten** bir modüldür. context-va grafik özet üretir (görsel), context-paper manuscript yazar (metin), context-slides sunum destesi oluşturur (görsel+metin), **context-narrate sesli özet/podcast üretir (audio)**. Dört modül birlikte, tek bir micro-wiki kaynağından farklı öğrenme stillerine hitap eden çıktılar sunar.

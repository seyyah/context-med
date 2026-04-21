# context-gate

*Ham belgeyi context-wiki'ye kabul etmeden önce, kullanıcıdan kısa bir niyet tanımı alarak kaynağı SWOT çerçevesinde inceleyen, yalnızca ayıklayan (asla üretmeyen), insan onayıyla aşama aşama rafine eden ve tam provenans kaydıyla ham klasöre teslim eden, Karpathy autoresearch tarzı bir kaynak kalite kapısı.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce source-curator'ın ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır — slop yoktur.

---

## 1. Tez (Thesis)

RAG sistemlerinin çoğu "garbage in, garbage out" problemiyle yaşar. Ham kaynak kalitesizse, wiki yanlış derlenir; wiki yanlış derlendiyse, cevaplar güvenilmez olur. Bu zincirin en zayıf halkası, ham kaynağın sisteme ilk girdiği andır: kullanıcı bir dosya yükler, sisteme düşer, işlenir — kimse "bu kaynak ne kadar uygun?" diye sormaz.

Sorun teknolojik değil yapısaldır. Kullanıcılar karışık içerikli belgeler yükler (toplantı notu içinde ofis tadilat kararları, araştırma verisi içinde kişisel yazışmalar), yanlış etiket verir ("ürün roadmap'i" derler ama müşteri şikayeti listesi çıkar), farklı dönemlere ait çelişkili belgeleri ayrı ayrı ingest eder ve birbirini çürüten iki kaynağın wiki'de yan yana durduğunu fark etmez.

**source-curator'ın çekirdek iddiası şudur:** rag-wiki'ye giren her kaynağın bir kapıdan geçmesi gerekir. Bu kapı kullanıcının niyetini anlar, kaynağı o niyet çerçevesinde SWOT ile değerlendirir, yalnızca ilgili bölümleri ayıklar (asla yeni metin üretmez), insan tarafından onaylanan içgörüleri seçtikten sonra tam provenans kaydıyla ham klasöre teslim eder.

Müze küratörü metaforu doğrudur: küratör eseri yaratmaz, orijinaline dokunmaz; değerli olanı seçer, koşullarını belgelendirir, doğru yere yerleştirir. source-curator da bunu yapar — kaynağı değil, kaynağın wiki'ye uygunluğunu üretir.

**Temel değer önermesi:** Kullanıcı dosyayı ve tek cümlelik niyetini yükler; sistem kaynağı reddeder, rafine eder ya da onaylar — her kararın gerekçesi ve geçmişi kalıcı olarak kayıt altındadır. rag-wiki'ye yalnızca geçen kaynaklar girer.

---

## 2. Problem

### 2.1 Yükleme Anındaki Yapısal Belirsizlik

Kullanıcı bir belge yüklediğinde sistem onu kabul eder ya da reddeder; ikisi arasında bir şey yoktur. Oysa gerçek dünyada yüklenen belgelerin büyük çoğunluğu "ne tam ilgili ne tam ilgisiz"dir. Belgenin %60'ı işe yarıyor, %40'ı gürültü. Mevcut sistemler bu durumu ya tamamıyla reddederek (zararlı) ya da tamamıyla kabul ederek (daha zararlı) ele alır.

### 2.2 Niyet-İçerik Uyumsuzluğu

Kullanıcı "ürün roadmap'i" diye yüklediği belgede o hafta yapılan toplantı tutanağı, ofis tadilat bütçesi ve bir rakip analizi bir arada duruyor. Sistem bunu bilemez; wiki bu çöpü "ürün roadmap'i" olarak işler. İlerleyen sorgularda "ürün planımız ne?" sorusuna ofis tadilat kararı karışır.

### 2.3 Çelişkili Kaynakların Sessizce Birikmesi

"Ürün lansmanı Q1 2026" diyen belge ve "Ürün lansmanı Q2 2026" diyen belge aynı wiki'ye girer. rag-wiki bu çelişkiyi fark edebilir ama güvenilir cevap vermek için hangisinin daha güncel ya da yetkili olduğunu bilmesi gerekir. Bu kararı ingest aşamasında vermek, wiki derleme aşamasında vermekten hem doğru hem de ucuzdur.

### 2.4 Halüsinasyonun Gerçek Kaynağı

LLM'e "yanlış cevap verdi" denmesi büyük ölçüde adil değildir. LLM çoğunlukla wiki'de ne varsa ondan cevap üretir. Eğer wiki yanlış ya da çelişkili kaynaklarla doluysa, cevap da yanlış olacaktır. Halüsinasyonu retrieval katmanında avcılamak, asıl sorunu ingest kalitesizliğinin üstünü örtmek demektir. Sorun kaynaktadır — oradan çözülmesi gerekir.

### 2.5 Provenansın Yokluğu

Altı ay sonra bir wiki sayfasında yanlış bir karar bulunduğunda "bu bilgi nereden geldi?" sorusu cevaplanamaz. Hangi kaynak ne zaman, kim tarafından, hangi niyetle yüklendi; hangi bölümler ayıklandı, hangisi reddedildi — bunların hiçbiri kayıt altında değildir. Audit, compliance ya da sadece düzeltme için bu bilgi yoktur.

---

## 3. Nasıl Çalışır (How It Works)

Pipeline yedi aşamadan oluşur. Her aşamanın HITL (Human-in-the-Loop) statüsü açıkça tanımlıdır.

### Temel İçgörü 1 — Niyet Önce Gelir, Profil Sonra

Sistem dosyayı analiz etmeden önce kullanıcıdan tek bir şey ister: *"Bu kaynak ne hakkında ve neden yüklüyorsunuz?"* Bu kısa tanım, tüm pipeline'ın pusuladır. Profiling ve SWOT aşamaları bu tanıma karşı çalışır; "Kullanıcı X dedi ama belge Y diyor" tespiti buradan çıkar. Dosya adına ya da formatına güvenmek yanlıştır — niyet beyanı zorunludur.

### Temel İçgörü 2 — SWOT Karar Girdisidir, Rapor Değil

SWOT analizi bir sunum belgesi değildir. Her SWOT çıktısı doğrudan insan kararına bağlanır:

- **Strengths:** Hangi bölümler niyetle uyumlu → ayıklama öncelikleri
- **Weaknesses:** Hangi bölümler gürültü → çıkarma adayları
- **Opportunities:** Hangi içgörüler başka wiki sayfalarını besleyebilir → cross-link önerileri
- **Threats:** Gizlilik riski, çelişki, stale içerik → ya redaksiyon ya ret

SWOT sonucunda sistem üç yoldan birini önerir: tam ayıklama, kısmi ayıklama, ret. İnsan onaylamadan hiçbiri uygulanmaz.

### Temel İçgörü 3 — "Extract, Never Generate" Kırılmaz Kısıttır

Extraction aşamasında sistemin yapabileceği ve yapamayacağı net çizgiyle ayrılmıştır:

| İzin Verilen | Yasak |
|---|---|
| İlgisiz paragrafları silmek | İçeriği başka kelimelerle yeniden yazmak |
| Kişisel adları anonim etiketle değiştirmek (John → PM-A) | Eksik kısımları tamamlamak |
| Kopyalı bölümleri tespit edip çıkarmak | Özet üretmek (yeni sözdizimi ile) |
| Bölümleri sıralamak | Bölümlere açıklama notu eklemek |
| Farklı dosya formatına dönüştürmek | Dilden dile çevirmek |

Redaksiyon (kişisel isim → anonim etiket) extraction kapsamındadır çünkü anlam değişmez, yalnızca kimlik gizlenir. Özetleme ise yasaktır çünkü yeni bir yorumlama üretir. Bu sınır sistemin tıbbi, hukuki ve finansal alanlarda güvenilir olmasının garantisidir.

### Temel İçgörü 4 — İterasyon Sınırlıdır, Sonsuz Değil

İteratif refinement maksimum 3 turla sınırlıdır. Kullanıcı "daha iyi" diye sürekli gönderemez; üçüncü turdan sonra sistem iki yoldan birini sunar: mevcut haliyle kabul et ya da manuel kürasyon için eskalasyon. Bu sınır "analysis paralysis"i önler ve pipeline'ın throughput'unu korur.

---

## 4. Yedi Aşamalı Pipeline

```
Kullanıcı Yüklemesi + Niyet Tanımı
         │
         ▼  [HITL: Zorunlu]
┌─────────────────────────────┐
│ 1. INTAKE                   │
│ Dosya parse, format tespiti │
│ Niyet beyanı alınır         │
└──────────────┬──────────────┘
               │
               ▼  [Otomatik]
┌─────────────────────────────┐
│ 2. PROFİLLEME               │
│ Konu, ton, yapı, entity     │
│ Kopya tespiti (mevcut wiki) │
└──────────────┬──────────────┘
               │
               ▼  [HITL: İnceleme]
┌─────────────────────────────┐
│ 3. SWOT ANALİZİ             │
│ Niyet-içerik uyum kontrolü  │
│ Çelişki, risk, fırsat       │
└──────────────┬──────────────┘
               │
               ▼  [HITL: Örnekleme]
┌─────────────────────────────┐
│ 4. AYIKLAMA                 │
│ İlgili bölümler alınır      │
│ Gürültü, kopya, PII çıkar   │
│ (Üretme kesinlikle yasak)   │
└──────────────┬──────────────┘
               │
               ▼  [HITL: Zorunlu Seçim]
┌─────────────────────────────┐
│ 5. İÇGÖRÜ SUNUMU           │
│ 5-10 verbatim içgörü liste  │
│ İnsan seçim yapar           │
└──────────────┬──────────────┘
               │
               ▼  [HITL: Gerektiğinde, maks. 3 tur]
┌─────────────────────────────┐
│ 6. İTERATİF REFİNEMENT     │
│ Seçime göre yeniden ayıkla  │
│ Güven skoru hesaplanır      │
└──────────────┬──────────────┘
               │
               ▼  [HITL: Son Onay]
┌─────────────────────────────┐
│ 7. HAM INGEST               │
│ raw/ klasörüne teslim       │
│ Provenans manifesti yazılır │
│ rag-wiki tetiklenir         │
└─────────────────────────────┘
```

**Risk Stratifikasyonu:** HITL yoğunluğu kaynak riskine göre değişir.

| Risk Seviyesi | Kaynak Tipi | HITL Checkpoint'leri |
|---|---|---|
| Düşük | Resmi belgeler, bilinen alanlar, yapılandırılmış veri | 1, 3, 7 |
| Orta | Blog, kullanıcı yüklemeleri, topluluk içeriği | 1, 3, 5, 6, 7 |
| Yüksek | Harici API, kazınmış içerik, doğrulanmamış kaynak | Tüm aşamalar, çoklu onay |

---

## 5. Mimari (Architecture)

source-curator üç katmandan oluşur. rag-wiki'nin bilgi katmanı örüntüsünün kaynak kalitesi kapısına uyarlanmış biçimidir.

### Katman 1 — Bilgi Katmanı (Knowledge Layer)

Ham kaynak gerçeğini ve sistemin öğrendiklerini tutar. Değişmez veya yalnızca insan kararıyla güncellenir.

```
source-curator/
├── raw/
│   ├── uploads/          # Kullanıcı yüklemeleri (ham, değişmez)
│   └── rejected/         # Reddedilen kaynaklar (audit için saklanır)
│
├── wiki/
│   ├── guidelines/       # Alan-bazlı kürasyon kuralları
│   │   ├── medical.md
│   │   ├── product-docs.md
│   │   └── legal.md
│   ├── patterns/         # Öğrenilmiş kürasyon örüntüleri
│   │   ├── redaction.md
│   │   ├── extraction.md
│   │   └── rejection.md
│   └── decisions/        # İnsan kürasyon kararları (provenans)
│
├── eval/
│   ├── known-good/       # Geçmesi gereken test kaynakları
│   ├── known-bad/        # Reddedilmesi gereken test kaynakları
│   └── edge-cases/       # İnsan oracle'a bırakılan sınır vakalar
│
└── artifacts/
    ├── provenance-manifests/   # Her kaynak için YAML
    ├── swot-reports/           # Üretilen SWOT analizleri
    └── insight-summaries/      # Seçim öncesi içgörü listeleri
```

### Katman 2 — Runtime Katmanı (Operational Layer)

7 aşamalı pipeline'ı çalıştırır. Her ajan stateless; aynı kaynak farklı domain config'leriyle paralel işlenebilir.

- **IntakeAgent:** Dosya parse, format tespiti, niyet beyanı toplama, clarifying questions
- **ProfilerAgent:** Konu modellemesi, ton tespiti, entity çıkarma, kopya tespiti (mevcut raw/ ile diff)
- **SWOTAgent:** Niyet-içerik karşılaştırması, risk/fırsat tespiti, karar önerisi üretimi
- **ExtractionAgent:** Bölüm izolasyonu, PII redaksiyonu, kopya eleme — yalnızca ayıklama
- **InsightAgent:** Verbatim içgörü çıkarma (kaynak alıntılarıyla), kategori etiketleme
- **RefinementAgent:** İnsan seçimine göre ayıklama kapsamını daraltır veya genişletir; güven skoru hesaplar
- **IngestAgent:** Provenans manifesti yazar, raw/ klasörüne teslim eder, rag-wiki'yi tetikler

### Katman 3 — Geri Yazma Katmanı (Writeback Layer)

İnsan kararlarından örüntü öğrenir; kürasyon kurallarını günceller.

```
İnsan Kararı
   ↓
PatternExtractor: "Kullanıcı toplantı notlarından
  'Facilities' bölümlerini sürekli çıkarıyor"
   ↓
RuleWriter: guidelines/product-docs.md'ye
  "Toplantı notlarında 'Facilities' başlıklı
   bölümler ayıklama dışında bırak" ekle
   ↓
EvalRunner: Yeni kural known-good/known-bad
  setine karşı test edilir
   ↓
Ratchet: Geçerse aktif, geçmezse pending
```

---

## 6. Provenans Manifesti (Provenance Manifest)

Her başarılı ingest işlemi bir YAML manifesti üretir. Bu manifest değişmezdir; kaynak wiki'den silinse bile saklanır.

```yaml
# artifacts/provenance-manifests/2026-04-19-q1-planning.yaml

source:
  original_file: uploads/2026-q1-planning.pdf
  original_hash: abc123
  uploaded_by: user@company.com
  uploaded_at: 2026-04-19T10:30:00Z
  user_description: "Q1 planlama toplantısı notları"
  intended_use: "Ürün roadmap referansı"
  risk_level: medium

curation:
  curator_version: v1.2.3
  profiling:
    detected_topics: [product, roadmap, timeline, features]
    tone: informal_70pct_technical_30pct
    duplication: "raw/meetings/2025-q4.txt ile %40 örtüşme"
  swot:
    strengths: ["somut kararlar var", "müşteri alıntıları"]
    weaknesses: ["bölüm ofis tadilat içeriyor", "%40 kopya"]
    threats: ["tarih belirsiz", "onaylanmamış kararlar"]
  extraction:
    decisions:
      - "Bölüm 1 çıkarıldı: ofis tadilat (kapsam dışı)"
      - "Bölüm 3 çıkarıldı: %40 kopya"
      - "'John' → 'PM-A' redaksiyon"
    filtered_hash: def456
  insights_selected:
    - text: "Ürün X v2 lansmanı Q2 2026'ya ertelendi"
      source_section: "Bölüm 2, paragraf 3"
    - text: "Kullanıcılar toplu export özelliği istiyor"
      source_section: "Bölüm 5, müşteri geri bildirimi"
  iterations: 2
  final_confidence: 85

human_review:
  reviewed_by: user@company.com
  reviewed_at: 2026-04-19T11:00:00Z
  approval_status: approved
  notes: "Tarih geçici, yönetim onayı bekliyor"

ingestion:
  ingested_at: 2026-04-19T11:05:00Z
  target_wiki: product-wiki
  linked_pages:
    - wiki/product/roadmap.md
    - wiki/product/feature-x.md
```

---

## 7. Operasyonlar (Operations)

### Senaryo 1 — Standalone Tek Kaynak Ingest

```bash
curator ingest ./meeting-notes.pdf \
  --description "Q1 planlama toplantısı notları" \
  --intended-use "Ürün roadmap referansı" \
  --domain product
```

Pipeline 7 aşamayı çalıştırır, HITL checkpoint'lerde terminal üzerinden insan onayı ister, provenans manifesti yazar.

### Senaryo 2 — Cerebra-Composed Ingest

```bash
cerebra curator ingest ./meeting-notes.pdf \
  --target-wiki product-wiki
```

Aynı pipeline, ek olarak: cerebra `core-wiki` kurallarını inherit eder, onay sonrası rag-wiki recompilation tetiklenir, persona-wiki ilgili içgörülerden haberdar edilir.

### Senaryo 3 — Risk Bazlı Toplu İşleme

```bash
curator batch ./sources/ \
  --domain medical \
  --risk-threshold high \
  --async
```

Klasördeki tüm dosyalar risk skorlanır. Düşük risk otomatik profillenir ve onay kuyruğuna girer. Yüksek risk her aşamada senkron onay gerektirir. Kullanıcı tamamlanan batch'i onay dashboardında inceler.

### Senaryo 4 — Ratchet Eval

```bash
curator eval --suite eval/known-good/ eval/known-bad/
```

Tüm bilinen-iyi kaynakların geçtiğini, bilinen-kötü kaynakların reddedildiğini doğrular. Yeni kural değişikliği bu testten geçmeden aktive olmaz.

### Senaryo 5 — Tarayıcı İçi Bağımsız Kürasyon (context-gate-ext)

Sistem mimarisi yalnızca yerelleştirilmiş bir `context-core` pipeline'ına hizmet etmek zorunda değildir. Bir Chrome Eklentisi (`context-gate-ext`) formuna bürünerek `context-core`'dan bağımsız bir şekilde dış web uygulamalarında da çalışabilir.

Örneğin, kullanıcı Gemini veya ChatGPT'ye yapılandırılmamış, uzun ve dağınık bir metin (text) belgesi yüklemek istediğinde eklenti upload anında araya girer. Kullanıcıdan kısa bir niyet tanımı alır ve şuna benzer otonom bir destek sunar: *"Bu belgede odaklanmak istediğiniz konu dışında kalan gürültülü metinleri (ör: toplantı dışı sohbetler) ayıklayıp, rafine edilmiş temiz bir 'Source' üreterek LLM'e yüklememi ister misiniz?"* 

Kullanıcı onayladığında, belgenin ham hali tarayıcı düzeyinde SWOT analizinden geçirilir ve gereksiz bölümler budanarak yalnızca ilgili, temiz metin LLM'in promptuna/bağlamına iletilir. Bu sayede üretken yapay zekanın girdi kalitesi güvence altına alınmış olur.

---

## 8. Ne Yapmaz (What It Does Not Do)

- **İçerik üretmez.** Boşlukları doldurma, özetleme (yeni sözdizimi), parafraz, çeviri — bunların hiçbiri extraction kapsamında değildir. Kaynak ne diyorsa o kalır, eksiltilebilir ama artırılamaz.
- **Otomatik ingest yapmaz.** İnsan onayı olmadan hiçbir kaynak raw/ klasörüne girmez. Risk seviyesi ne olursa olsun son onay HITL'dir.
- **Wiki derlemez.** source-curator kaynağı raw/ klasörüne teslim eder. Wiki derleme rag-wiki'nin görevidir. İki sistem arasındaki sınır bu noktadadır.
- **Kararı tartışmaz.** Güven skoru eşiğin altındaysa ve 3 iterasyon tükenmişse, sistem manuel eskalasyon önerir ve bekler. Döngüye girmez.
- **Kaynak oluşturmaz.** Kullanıcının yüklediği belge yoksa curator'ın çalışacak bir şeyi yoktur. Kaynak retrieval, web scraping, API çekme ayrı bir modülün görevidir.

---

## 9. Neden Şimdi (Why Now)

**RAG olgunlaştı, kaynak kalitesi sorunu görünür hale geldi:** İlk RAG uygulamalarında "daha fazla belge = daha iyi cevap" anlayışı hakimdi. Üretim ortamına taşınan sistemler gürültülü ve çelişkili kaynakların cevap kalitesini doğrudan düşürdüğünü gösterdi. Sorun artık "daha iyi retrieval" değil, "daha temiz kaynak" olarak tanımlanıyor.

**LLM'lerin profiling ve SWOT kapasitesi ölçeklenebilir hale geldi:** SWOT analizi için 2024 öncesinde pahalı ve tutarsız olan long-context LLM çağrıları artık Gemini 2.5 Flash ve Claude Sonnet sınıfı modellerle makul maliyette ve tutarlı çıktıyla yapılabiliyor.

**Cerebra ekosistemi kaynak kalite kapısına hazır:** rag-wiki `raw/` klasöründen beslenecek şekilde tasarlandı; curator bu klasörün single-source-of-truth olmasını garantiler. demo-wiki, ManuscriptForge ve DeckForge'un doğrulanmış kaynaklara ihtiyacı curator'ın ekosistem içindeki pozisyonunu netleştiriyor.

**Provenans zorunluluğu artık sektör standardı:** GDPR, SOC2 ve akademik integrity gereksinimleri "bu bilgi nereden geldi?" sorusunun cevaplanabilmesini zorunlu kılıyor. Provenans-first tasarım bir fark değil, minimum beklenti haline geliyor.

---

## 10. Kim Fayda Sağlar (Who Benefits)

**rag-wiki Operatörleri:** Sisteme giren kaynakları kontrol edemez hale gelmeden önce bir kalite kapısına ihtiyaçları var. source-curator bu kapıyı sistematik hale getirir.

**Araştırmacılar ve Analistler:** Tez notlarını, toplantı kayıtlarını ve literatür taramasını aynı wiki'ye yüklemek isteyen ama "ne ne için?" sorusunu yanıtlamadan yükleyen kullanıcılar için curator bir yapı sunar.

**Tıbbi ve Hukuki Uygulama Ekipleri:** Yanlış ya da eski kaynaktan gelen cevabın maliyeti yüksek olan alanlarda, her kaynağın provenans kaydı compliance açısından zorunludur.

**ManuscriptForge / AutoVA Kullanıcıları:** DeckForge ve ManuscriptForge'un giriş noktası doğrulanmış JSON'dur. Bu JSON'un güvenilirliği, kaynağının curator'dan geçmiş olmasına bağlıdır. Üçlü pipeline — curator → rag-wiki → ManuscriptForge/DeckForge — kalite zinciri olarak çalışır.

**Cerebra Ekosistemi:** source-curator tüm micro-wiki'lerin ortak giriş kapısıdır. Bir kaynak demo-wiki, product-wiki ya da medical-wiki için yüklensin; her biri aynı curator pipeline'ından geçer, aynı provenans standardını taşır.

---

## 11. Teknik Mimari (Technical Architecture)

**Stack:**
- Python 3.11+, Pydantic v2, Typer (CLI)
- LLM: Haiku (Profiling, Insight Surfacing — düşük maliyet), Sonnet (SWOT, Extraction — yüksek hassasiyet)
- Dosya işleme: PyMuPDF (PDF), python-docx (Word), pypandoc (format dönüşüm)
- Provenans: YAML manifesti + SHA-256 hash (değişmezlik garantisi)
- Ratchet eval: pytest tabanlı, CI/CD'ye entegre

**Maliyet tahmini (kaynak başına):**
| Aşama | Model | Tahmini Token | Tahmini Maliyet |
|---|---|---|---|
| Profiling | Haiku | ~30K | ~$0.01 |
| SWOT | Sonnet | ~50K | ~$0.15 |
| Extraction | Sonnet | ~100K | ~$0.30 |
| Insights | Haiku | ~20K | ~$0.01 |
| **Toplam** | | **~200K** | **~$0.47** |

Hedef: < $0.50 / kaynak. Haiku'nun profiling ve insight aşamalarında kullanımı maliyeti Sonnet-only seçeneğe göre %40 düşürür.

---

## 12. Kısıtlamalar (Constraints)

- **Yalnızca tam metin kaynaklara çalışır:** OCR gerektiren taranmış PDF ve sadece görsel içeren belgeler `INSUFFICIENT_CONTEXT` hatası alır. Full-text parse edilemeyen kaynak pipeline'a girmez.
- **Maks. 3 iterasyon:** Dördüncü turda sistem mevcut haliyle kabul ya da manuel eskalasyon sunar; "biraz daha" seçeneği yoktur.
- **Üretme yasağı runtime'da kontrol edilmez:** Extraction ajanının "üretme" yasağını ihlal edip etmediği her yeni prompt versiyonunda eval seti ile test edilir; runtime'da inline kontrol eklenmesi planlanmaktadır.
- **Domain config MVP:** İlk versiyonda ürün belgeleri, toplantı notları, akademik kaynak için üç domain kuralı. Yeni domain ≈ 4–6 saat.
- **Çok kiracılı izolasyon MVP dışı:** İlk versiyonda tek kiracı. Multi-tenant izolasyon (Customer A / Customer B) fiziksel dosya sistemi ve erişim kontrolüyle ayrı bir iterasyonda.

---

## 13. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **ExtractionAgent verbatim yerine parafraz üretir** | Orta | Yüksek | Eval seti "extraction-only" test vakalarını içerir; her prompt güncellemesinde ratchet çalışır |
| **SWOT yanlış risk seviyesi atar (düşük → yüksek risk kaçar)** | Orta | Yüksek | Risk skoru bileşik metrikle hesaplanır; edge-case eval seti insan oracle ile etiketlenmiştir |
| **Güven skoru manipüle edilemez eşik seçimi** | Yüksek (başlangıçta) | Orta | İlk 50 canlı kürasyon kararından kalibre; eşik tek parametredir, model değişikliği gerektirmez |
| **İterasyon döngüsü 3 turda bitmiyor, kullanıcı eskale etmek istemiyor** | Orta | Orta | Eskalasyon = mevcut haliyle kabul veya hard-reject; üçüncü turda sistem zorunlu seçim sunar |
| **Writeback rule overfitting** | Orta | Orta | Yeni kural known-good/known-bad setinin tamamına karşı test edilir; tek vakadan genel kural yazılmaz |
| **Provenans manifesti silinirse audit imkânsız** | Düşük | Yüksek | `artifacts/` git altında; silme işlemi PR gerektiriyor |

---

## 14. Açık Sorular (Open Questions)

1. **Extraction sınırı: "Section başlığı ekleme" yasak mı?** Yapısız bir belgede başlık eklemek okumayı kolaylaştırır ama yeni metin üretmektir. Yasak listesine girmeli mi yoksa "yapı annotasyonu" olarak izin verilen kategoriye mi?

2. **Çelişkili kaynak kararı kim verir?** "Q1 2026" ve "Q2 2026" diyen iki kaynak aynı anda ingest edilmek istendiğinde curator çelişkiyi işaretleyip insan kararı mı beklemeli, yoksa rag-wiki'nin kendi çelişki yönetimine mi bırakmalı?

3. **Async vs sync workflow:** Kullanıcı yükleme sonrası bekleyecek mi? Düşük-risk kaynaklar için async (bildirim gelince onayla), yüksek-risk için sync tercih edilebilir. Karma workflow tasarımı ne kadar karmaşıklık ekler?

4. **Cross-module bildirim protokolü:** Curator, demo-wiki'yi etkileyen bir müşteri geri bildirim kaynağını ingest etti. demo-wiki'yi nasıl haberdar eder — event bus, dosya sistemi tag, yoksa insan elle mi yönlendirmeli?

5. **Eval set büyüklüğü ve canlılığı:** 100 kürasyon kararından sonra eval set yüz test vakasına ulaşır. CI'da çalışması uzar. Örneklem bazlı (stratified sampling) mı yoksa son N ay mı tutulacak?

6. **Redaksiyon düzeyi kimin kararı?** Kişi adını anonim etikete çevirmek (Level 1) ile tam anonimizasyon (Level 3 — "Satış Direktörü" → "Çalışan A") arasında kim karar verir? Domain config mi, kullanıcı seçimi mi, curator'ın risk tespiti mi?

---

## 15. Değerlendirme — Ratchet Beklentisi

source-curator'da kaynak kalitesi yalnızca ileriye gider. Bu politikadır.

**Ratchet kuralı:** Yeni bir kürasyon kuralı veya prompt güncellemesi yalnızca `eval/known-good/` setinin tamamını geçer ve `eval/known-bad/` setinin tamamını reddederse aktive olur. Aksi halde `wiki/patterns/history/` altında kalır.

**Her iterasyonda sorulacak sorular:**
- ExtractionAgent hiçbir kaynak alıntı verbatim'ini değiştirdi mi?
- SWOTAgent risk seviyesi tespiti eval edge-case'lerinden kaçtı mı?
- Yeni kural eski geçen test vakalarından birini bozuyor mu?
- İnsanın hangi HITL aşamasında en fazla değişiklik yaptığı ölçüldü mü? (Bu, o aşamanın prompt'una odaklanılacağını gösterir.)
- Yazılan yeni kural tek bir vakadan mı yoksa görülen bir örüntüden mi geliyor?

Eşit koşullarda daha kısa kural kazanır.

---

## 16. Başarı Kriterleri (Success Criteria)

**Kalite metrikleri (zorunlu):**
- **Precision:** İngest edilen kaynakların değerliliği — hedef > %85 (kullanıcı değerlendirmesiyle)
- **Recall:** Değerli kaynakların yanlış reddedilme oranı — hedef < %5
- **Tutarlılık:** Aynı kaynak iki kez yüklendiğinde aynı karar — %100
- **Ratchet geçerlilik:** eval seti passing rate hiçbir zaman düşmez

**Verimlilik metrikleri:**
- **Throughput:** Gün başına source (hedef: 50–100)
- **Latency:** Intake → ingest toplam süre < 10 dakika
- **İnsan süresi:** HITL review time / kaynak < 3 dakika
- **Maliyet:** LLM maliyeti / kaynak < $0.50

**Öğrenme metrikleri:**
- **Otomasyon oranı:** 100 kaynaktan sonra insan müdahalesi gerektirmeyen % — hedef > %30
- **Eskalasyon oranı:** Manuel review gerektiren kaynak % — hedef < %20
- **Kural kapsama:** İnsan kararlarının öğrenilmiş kurallarla açıklanma oranı — hedef > %60

---

## 17. Bağlam / Referanslar (Context / References)

**Sistem Bağlamı**
- `rag-wiki.md` — birincil tüketici: curator'ın raw/ çıktısını derleyen sistem
- `demo-wiki.md` — ikincil tüketici: persona ve müşteri kaynaklarından haberdar edilmeli
- `notebooklm-reports (manuscript).md` → ManuscriptForge — curator çıktısından beslenen JSON pipeline'ı
- `notebooklm-infographic (autova).md` → AutoVA — curator'ın doğruladığı kaynaktan görsel özet pipeline'ı
- `notebooklm-slide.md` → DeckForge — curator zincirinin son çıktı formatlarından biri

**Karpathy Pattern**
- Karpathy LLM-Wiki (2024) — raw → compiled wiki örüntüsü
- Karpathy AutoResearch (2024) — writeback learning loop ve ratchet disiplini
- Karpathy IDEA.md (2024) — bu dosyanın format standardı

**Teknik Stack**
- Python 3.11+, Pydantic v2, Typer
- PyMuPDF, python-docx, pypandoc
- LLM: Claude Haiku 4.5 (profiling/insights), Claude Sonnet 4.6 (SWOT/extraction)
- Provenans: YAML + SHA-256, git-tracked

---

> **Living Artifact Notu.** Bu belge yaşayan bir artefakttır. Extraction sınırları netleştikçe, yeni domain config'leri eklendikçe ve ratchet deneyiminden yeni kısıtlamalar öğrenildikçe güncellenir. Tezdeki "ayıkla, üretme" çerçevesi değişmedikçe teze dokunma; değiştiyse tezi yeniden yaz, önceki versiyonu `## Eski Tez` olarak altına bırak.

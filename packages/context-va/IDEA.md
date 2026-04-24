# context-va

*Tıbbi bir makale PDF'ini, Vision LLM + Playwright tabanlı otonom bir pipeline ile JAMA standartlarına uygun, yayına hazır graphical abstract PNG'sine dönüştüren; halüsinasyonsuz çıkarım, piksel mükemmeliyetinde render ve Karpathy autoresearch döngüsüyle kendi kendini iyileştiren özerk bir görsel soyut üretim sistemi.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce AutoVA'nın ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına (Claude Code, Cursor, Antigravity...) doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır — slop yoktur.

---

## 1. Tez (Thesis)

Tıbbi bir graphical abstract üretmek bugün **yaratıcı bir problem değil, bir derleme (compilation) problemidir.** Makale zaten yazılmıştır. PICO yapısı zaten içindedir. İstatistikler zaten mevcuttur. Geriye kalan tek iş, bu ham bilgiyi belirli bir journal'ın tasarım standardına göre derleyip render etmektir. Yine de bu iş, araştırmacı + editör + grafik tasarımcı üçlüsünü gerektiriyor ve makale başına **3–8 saat** sürüyor.

AutoVA'nın merkezindeki teknik iddia şudur: **2024–2025 nesil Vision LLM'ler, ilk kez, tıbbi PDF manuscriptinden sıfır halüsinasyonla yapılandırılmış JSON çıkarabilecek olgunluğa ulaştı; Playwright da bu JSON'u yayın kalitesinde pixel-perfect PNG'ye derleyebilir.** Bu iki yeteneğin aynı anda mevcut olması, graphical abstract üretimini insan emeğine bağlı bir sanat işinden otomatik bir derleme sürecine dönüştürür.

Üstüne Karpathy'nin autoresearch döngüsü oturur: pipeline çalıştıkça kendi çıktısını değerlendirir, başarısızlık örüntülerini öğrenir ve extraction prompt'unu otomatik olarak günceller. Sistem **her iterasyonla daha iyiye gider** — bir kez kurulur, sürekli rafine olur.

**Temel değer önermesi:** Araştırmacının makaleyi yayına hazır görsel soyuta dönüştürmesi için haftalar değil, **dakikalar** yeterlidir — halüsinasyonsuz, standart-uyumlu ve insan müdahalesi olmadan.

---

## 2. Problem

Graphical abstract, akademik yayıncılıkta artık zorunluluk haline geliyor. Nature, JAMA, Lancet ve onlarca major journal bunu aktif olarak talep ediyor. Ibrahim et al. (2017) çalışması bu talebin neden olduğunu verilerle gösterdi: graphical abstract olan makaleler **7.7× daha fazla impression** ve **8.4× daha fazla retweet** alıyor. Yani bir makalenin bilimsel etkisi, büyük ölçüde onun görsel özetinin varlığına bağlı.

Sorun şu: üretim süreci hâlâ manueldir ve ölçeklenemiyor.

### Kök Problem — Graphical Abstract Üretimi İnsan Emeğine Kilitli

Standart JAMA graphical abstract şunları gerektirir:
- **Araştırmacı:** PICO'yu doğrular, anahtar istatistikleri seçer, mesajı özetler
- **Editör:** Yazı uzunluklarını kısar, panel yapısını onaylar
- **Grafik tasarımcı:** AMA §4.2.10 uyumlu ikonlar seçer, 1600×900px grid'i kurar, renk/font standartlarına uyar

Bu üçlü, makale başına **3–8 saat** harcıyor. Bir araştırmacının yılda 5–10 makale yayımladığını varsayarsak, sadece graphical abstract üretimi için **30–80 saat/yıl** harcanıyor. Büyük dergiler yılda binlerce makale yayımlıyor — bu süreç hiçbir zaman paralel ölçeklenemez.

### Bariyer 1 — Journal Standardı Kırılgan ve Opak

JAMA, JAMA Cardiology, JAMA Internal Medicine — her birinin farklı renk paleti, farklı font boyutu, farklı panel düzeni var. Bu standartlar PDF kılavuzlar olarak yayımlanıyor, ama makine tarafından tüketilebilir değil. Tasarımcının hafızasında yaşıyor. Kişi değiştiğinde ya da journal kılavuzu güncellendiğinde bütün bilgi sıfırlanıyor.

### Bariyer 2 — Mevcut AI Araçları ya Halüsinasyon Yapıyor ya da Estetik Slop Üretiyor

DALL-E / Midjourney ile "graphical abstract üret" yazmak istatistik uyduruyor, PICO yapısını ihlal ediyor, journal standardından bihaber PNG üretiyor. ChatGPT ile yapılandırılmış özet çıkarmak ise sayıları yuvarlıyor, p-değerlerini uydururken "yaklaşık doğru" sayıyor. Tıbbi bağlamda bu tolerans edilemez — bir p=0.049 ile p=0.051 farkı klinik sonuçları değiştirir.

### Pazar Boşluğu

| Kriter | Canva (manuel) | BioRender | DALL-E / GenAI | AutoVA |
|---|:---:|:---:|:---:|:---:|
| JAMA standart uyumu | ✗ (manuel) | Kısmi | ✗ | ✓ (otomatik) |
| PDF'den tam otomatik üretim | ✗ | ✗ | ✗ | ✓ |
| Sıfır halüsinasyon garantisi | N/A | N/A | ✗ | ✓ |
| AMA §4.2.10 ikon uyumu | ✗ | Kısmi | ✗ | ✓ |
| Kendi kendini iyileştiren döngü | ✗ | ✗ | ✗ | ✓ (autoresearch) |
| Makale başına süre | 3–8 saat | 2–5 saat | Hızlı ama güvensiz | Dakikalar |

Kesişim boşluğu nettir: **JAMA-uyumlu + halüsinasyonsuz + PDF'den otomatik + kendi kendini iyileştiren** kombinasyonunu sunan bir araç mevcut değil.

---

## 3. Nasıl Çalışır (How It Works)

Pipeline tek bir **çekirdek içgörü** ve onu destekleyen **iki ana gruptaki katmanlar** üzerine kuruludur.

### Kalp — Graphical Abstract Üretimi Bir Derleme Problemidir

**Tek cümle çekirdek:** Tıbbi PDF manuscriptini, Vision LLM ile sıfır halüsinasyonlu yapılandırılmış JSON'a çevir; Playwright + Jinja2 ile JAMA journal konfigürasyonuna göre pixel-perfect 1600×900px PNG'ye derle.

```
PDF Manuscript
      ↓
  PyMuPDF — Bölüm Tespiti
  (Abstract, Methods, Results, Conclusions)
      ↓
  ManuscriptContext.to_prompt_block()
  (verbatim facts, sıfır paraphrase)
      ↓
  Vision LLM (Gemini / GPT-4o / Claude)
  + extraction_v1.md prompt (9 direktif)
      ↓
  VisualAbstract JSON (Pydantic v2 validation)
      ↓
  Playwright + Jinja2 Template
  + jama.yaml (renk, font, boyut)
      ↓
  1600×900px Yayın Kalitesinde PNG
```

### Özütleme ve Doğrulama Katmanları (Extraction & Validation)

Bu gruptaki katmanlar çekirdeğin "halüsinasyonsuz" kalmasını garanti eder.

#### Katman 1 — Katı Pydantic v2 Şeması: Halüsinasyonun Yapısal Engeli
İlk prototiplerde serbest biçimli JSON denenildi. İki sorun çıktı: LLM sayıları yuvarlıyor, panel sınırlarını aşıyordu. Çözüm katı Pydantic v2 şemasıydı. `source_quote` alanı her sayısal değer için zorunludur. LLM "0.049" yazıyorsa, manuscriptte nerede gördüğünü birebir alıntıyla kanıtlamak zorunda. Manuscript'te olmayan bir sayı bu katmanda şema validasyonunda düşer.

#### Katman 2 — ManuscriptContext: Sıfır Halüsinasyon için Verbatim Anchor
PDF'den çıkarılan bölümler doğrudan LLM'e verilmiyor. Önce `ManuscriptContext` nesnesi (title, abstract, methods, results vb.) oluşturulup etiketlerle sarılarak bir bloğa hapsediliyor. Extraction prompt'unda ilk kural şudur: **"Sadece MANUSCRIPT_CONTEXT bloğundaki bilgileri kullan. Dışarıdan bilgi getirme."**

#### Katman 3 — Evaluation Sistemi: Nesnel Skor, Öznel Değil
Pipeline çıktısını "güzel görünüyor" ile değil, istatistik tokenlarının ground truth ile örtüşmesi (`value_accuracy_score`), Şema eşleşmesi (`structural_score`) ve İkon uyumu (`icon_compliance_score`) gibi ölçülebilir metriklerle değerlendirir. `value_accuracy` ağırlığı en yüksektir çünkü hatalı bir "p" değeri telafi edilemez bir klinik yanılgıdır.

### Derleme ve İyileştirme Katmanları (Compilation & Refinement)

Bu gruptaki katmanlar, şemaya bağlı veriyi kusursuz bir görsel çıktıya dönüştürür ve sistemi sürekli iyileştirir.

#### Katman 4 — Journal Config Sistemi: Standart Bilgisini Makinede Tut
JAMA standartları YAML olarak kodlandı (dimensions, colors, typography, layout, icons). Bu sistem, journal standartları değiştiğinde veya yeni dergiler eklendiğinde sıfır kod değişimi garantisi sağlar. Standart bilgisi insan hafızasında değil repoda yaşar.

#### Katman 5 — Icon Normalizer Sub-Pipeline: AMA Uyumluluğu Otomatik
Medical ikonlar AMA §4.2.10 standardını takip etmeli (2px stroke, fill yok, özel alan). Icon Normalizer alt projesi, Servier library'deki tutarsız SVG'leri otonom olarak JAMA-uyumlu formata çevirerek sistem kütüphanesine çeker. 

#### Katman 6 — PromptRefiner: Karpathy Autoresearch Döngüsü
Evaluation'dan sonra skor hedefin altındaysa, PromptRefiner devreye girip başarısızlık örüntüsünü analiz eder ve extraction prompt'una yeni bir kural ekleyerek history altına yazar. Iterasyon zinciri ile, prompt projenin kendi veri setine göre bizzat kendi hatalarından öğrenerek spesifikleşir.

---

## 4. Mimari (Architecture)

AutoVA üç katmandan oluşur. Karpathy'nin autoresearch + LLM-wiki pattern'ının bu projeye uyarlanmış biçimidir.

### Katman 1 — Bilgi Katmanı (Knowledge Layer)
**Rolü:** Ham kaynak gerçeğini tutar. Değişmez.
Makale kaynakları (`data/originals/`), ground truth'lar, prompt'lar (`extraction_v1.md`), Journal Config'ler (`jama.yaml`) ve İkon kütüphanesi buradadır. Bilgi bozunmadan aşağı akar.

### Katman 2 — Runtime Katmanı (Operational Layer)
**Rolü:** Bilgi katmanındaki kaynakları birleştirip çıktı üretir.
Stateless execution (durumsuz yürütme) felsefesine dayanır. PDFParser -> UnifiedExtractor -> PlaywrightRenderer dizilişiyle 1600x900px çıktıyı oluşturur.

### Katman 3 — Geri Yazma Katmanı (Writeback Layer)
**Rolü:** Runtime çıktılarını öğrenmeye dönüştürür.
Skor geçmişlerini formüller ve `PromptRefiner` üzerinden alınan yeni dersleri, yeni nesil promptlar olarak Bilgi Katmanı'na (Version Tracking ile) geri yazar.

---

## 5. Operasyonlar (Operations)

### Senaryo 1 — Tam Otomatik Pipeline (PDF → PNG)
```bash
autova generate manuscript.pdf --journal jama --provider google
```
Sırasıyla context ayrıştırılır, VLM json çıkartır, Pydantic doğrulama anında test eder ve Playwright Jinja2'yi yaml tablosu ile render edip PNG verir.

### Senaryo 2 — Evaluation + Self-Improvement Döngüsü
```bash
autova run --journal jama --image data/originals/jama_001.png --max-iter 5 --target-score 0.85
```
Görülen extraction, ground truth'la eval edilir. Eğer skor hedef 0.85'in altındaysa refine çalıştırılır; döngü 5'ci iterasyona veya beklenen puana ulaştığında CSV delta kaydıyla sonuçlanır.

### Senaryo 3 — Batch Evaluation (Rapor Üretimi)
```bash
autova report --input-dir data/originals/ --ground-truth-dir data/ground_truth/
```
Dizin içindeki PDF'leri eşzamanlı tüketir, başarısız extraction'ı flag'ler toplu csv çıkartır.

---

## 6. Ne Yapmaz (What It Does Not Do)

- **Yeni araştırma üretmez.** AutoVA mevcut manuscript'teki bilgiyi yapılandırır. Hipotez üretmez, istatistiksel analiz yapmaz, sonuç yorumlamaz.
- **Halüsinasyona tolerans göstermez.** `source_quote` validasyonu geçemeyen değer JSON'a girmez. Kırpma, yumuşatma ("yaklaşık doğru") tıbbi alanda kabul edilemez.
- **Açık uçlu görsel tasarım yapmaz.** Pipeline JAMA grid sistemi + journal config içinde çalışır. "Şu paneli sağa kaydır" yapamazsınız; bu kısıtlama değil "disiplindir."
- **Real-time veya streaming üretim yapmaz.** Pipeline senkron ve batch tasarımlıdır.

---

## 7. Neden Şimdi (Why Now)

Grafiksel özet üretiminin pahalı kısmı "yaratıcılık" değildir; akademik kaostaki verişmişleri toplayıp spesifik, standartlaşmış bir formata sıkıştırma zahmetidir.
Peki bu mekanik "derleme" işi neden 2 yıl önce çözülmedi de şimdi çözülüyor?

1. **Vision LLM Şema Olgunluğu (Threshold of Reasoning):** Modeller (Claude 3.5 Sonnet, Gemini 2.5 Flash, GPT-4o), 2024'e kadar katı polimorfik Pydantic yapılarında "halüsinasyon" veriyor veya şemayı kırarak yanıt dönüyordu. Ancak şu an, Pydantic formatının yanı sıra `source_quote` disipliniyle sıfır halüsinasyon eşiğini atlamış durumdalar.
2. **Headless Tarayıcı İhtişamı:** Playwright'ın web-kit temelli kısıtlamalardan sıyrılarak bir Jinja2 HTML'ini "Yayın kalitesinde ve tıbbi piksellerinde (Pixel-Perfect)" render edebilecek kıvama ulaşması, derleme mantığını uygulanabilir yaptı.

---

## 8. Kim Fayda Sağlar (Who Benefits)

- **Klinik Araştırmacılar ve Makale Yazarları:** Makalelerini büyük dergilere sunarken saatler sürebilecek, son anda eklenen "JAMA Standartlarında Görsel Özet İstiyoruz" geri bildirimleri ile karşılaşmamalarını sağlar. Red ya da revizyon riskini sıfırlar.
- **Dergi Editörleri ve Asistanları:** Dışarıdan gelen amatör düzey farklı renk, tipografi veya ikon standardındaki (tasarım slop'ları) abstract belgelerini saniyeler içinde kabul edilen yayın formatına (homojenize ederek) normalize edebilirler.
- **Kurumsal Hastaneler ve Akademik Ekipler:** Yayınladıkları PDF'leri kurumsal sosyal medya portallerinde "viral etkiyi maksimum seviyeye ulaştıran" görsel kartlara dönüştürmelerini, zaman baskısı hissetmeden yaparlar. 

---

## 9. Nereden Başlanmalı (Where To Start)

**İlk içgüdü Playwright template'lerini yazıp HTML/CSS piksellerini hizalamak olacaktır. Bunu yapmayın.**

Projenin kalbi, Vision LLM'in PDF'den sıfır halüsinasyonla JSON çıkarttığı *Extraction Pipeline*'ıdır. AutoVA'yı sıradan bir render aracı olmaktan kurtaran "Sıfır Halüsinasyon" iddiasıdır.
Geliştirme sırası kesinlikle şudur:
- **Veri Çekirdeğinin İnşası:** PyMuPDF ile PDF'i ManuscriptContext'e çevirin, prompt ile API çağrısını bağlayıp saf Pydantic tabanlı JSON çıktısını stabilize edin.
- **Zorlu Doğrulama (Evaluation):** Rastgele seçilmiş birkaç makale PDF'sinde istatistiklerin %100 birebir geçtiğinden, uydurma `p değeri` olmadığından emin olun (accuracy_score = 1.0 testleri).
- **En Son UX ve Render:** Veri tarafı kusursuz hale geldiğinde JSON verilerini bir Jinja2 template üzerinden Playwright ile YAML dosyasındaki formata aktarın.

---

## 10. Kısıtlamalar (Constraints)

MVP kapsamında taviz verilmeyecek sınırlar. **Dürüstlük notu:** Aşağıdaki maliyet sayıları API açık pricing'den hesaplandı; latency sayıları *henüz üretim ortamında ölçülmedi.*

### Ölçülen / Hesaplanan Sınırlar

- **Sadece Tam Metinli (Full-Text) veya Okunabilir PDF'ler:** Pipeline OCR yapmaz. Taranmış imaj PDF'lerde veya Abstract-only metinlerde değerlendirmeyi keser (INSUFFICIENT_CONTEXT) çünkü tam metni görmeden doğruluğu garanti edemez.
- **Sınırlı Dergi Ailesi (MVP için):** İlk versiyonda yalnızca JAMA Dergi Konfigürasyonu (JAMA Cardiology, JAMA Internal Med.) desteklenir. Yeni journal formları (Lancet vs.) config + template yamaları (PR'ları) isteyecektir.
- **LLM maliyeti / çağrı:** Vision LLM çağrısı PDF sayfaları + prompt ile tipik 5.000-8.000 input token. Gemini 2.5 Flash ile **≈ $0.01-0.02/çağrı**, GPT-4o ile **≈ $0.05-0.10/çağrı**. Journal config ve icon normalization ek maliyet getirmez.
- **Çıktı boyutu:** PNG 1600×900px, tipik 200-500 KB. JSON ara temsil tipik 3-6 KB.
- **`source_quote` zorunluluğu:** Her sayısal değer manuscript'te verbatim olarak bulunmalıdır. Bu kural pazarlık edilemez.

### Tahmini / Henüz Ölçülmemiş Sınırlar

- **Pipeline end-to-end latency:** PDF parse (~2s) + VLM çağrısı (~5-15s) + Playwright render (~3-5s). **Tahmini P50: 15-20 saniye, P95: 30-45 saniye.** Manuscriptin sayfa sayısına bağlı; MVP öncesi ölçülecek.
- **Autoresearch iterasyon süresi:** Tek bir refine döngüsü ~30-60 saniye (eval + prompt güncelleme + yeniden extraction). 5 iterasyon hedefi ~3-5 dakika.
- **Journal config genişletme maliyeti:** Yeni bir dergi (Lancet, Nature) eklemek tahmini 4-8 saat mühendislik çalışması — config YAML + Jinja2 template + test datası.

---

## 11. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **API model güncellemesi prompt'u kırar** | Yüksek | Yüksek | Ratchet kuralı: yeni prompt versiyonu önceki benchmark setinin tamamını geçmelidir; her provider geçişinde regression testi mecburi |
| **Çevresel piksel kırılganlığı** | Orta | Yüksek | Headless Chrome farklı OS'lerde farklı font padding çıkarır — render motoru Docker container'da çalıştırılmalı |
| **İkon semantik kayması (false mapping)** | Orta | Orta | LLM "diabetes" etiketi üretirken manuscript'te spesifik olmayan bağlamdaysa yanlış ikon atanır — ikon eşlem tablosu + manuel spot-check |
| **PDF layout çeşitliliği extraction'ı kırar** | Yüksek (başlangıçta) | Yüksek | PyMuPDF bölüm tespiti farklı dergilerde farklı yapılarda — ilk sürüm yalnızca JAMA PDF formatı; diğerleri iteratif eklenir |
| **Vision LLM maliyet artışı** | Düşük-Orta | Orta | Gemini Flash default (ucuz); GPT-4o ve Claude yalnızca fallback; cache ile aynı manuscript tekrar işlenmez |
| **Autoresearch döngüsü overfitting** | Orta | Orta | Prompt küçük bir test setine aşırı uyum sağlar — ratchet kuralı + çeşitlendirilmiş benchmark seti (farklı dergiler, farklı çalışma tipleri) |

---

## 12. Açık Sorular (Open Questions)

Henüz netleşmemiş kararlar — topluluk/danışman geri bildirimiyle çözülecek:

1. **Değerlendirmede VLM Kullanımı Mantıklı Mı?** Şu an sadece veri tabanlı JSON score kullanılıyor. LLM'in vizyon kabiliyetiyle çıkan PNG'yi "JAMA stil standardına uyuyor mu?" diye değerlendirmek güvenli ve maliyet-etkin bir yol mudur?
2. **Prompt Optimizasyonu mu Küresel Fine-Tuning mi?** Karpathy döngüsü ile problemleri tek büyük prompta yığmak mı, yoksa iterasyonlardan süzülen geçmişle küçük bir modelde fine-tune mu efektif?
3. **AcaVibe pipeline'ı ile şema birleştirme:** AcaVibe abstract'tan JSON üretir, AutoVA full-text PDF'den JSON üretir. İki pipeline'ın çıktı şeması (`structural` + `narrative_panels` vs Pydantic VisualAbstract) birleştirilebilir mi? Ortak bir ara temsil (intermediate representation) her iki sistemi güçlendirir.
4. **Multi-journal config yönetimi:** JAMA'dan Lancet'e geçerken yalnızca YAML mı değişecek, yoksa Jinja2 template yapısı da mı? Config genişletme maliyetini ölçmek için pilot journal eklenmeli.
5. **Batch processing vs on-demand:** Bir dergi editörü 50 makaleyi toplu işletmek isterse pipeline nasıl ölçeklenir? Parallelization stratejisi (concurrent VLM çağrıları, rate limiting) tanımlanmalı.

---

## 13. Değerlendirme — Ratchet Beklentisi

AutoVA'da kalite **sadece ileriye gider.** Bu politikadır, istektir.

Ratchet kuralı: `extraction_v{N+1}.md` yalnızca `extraction_v{N}.md`'nin geçtiği benchmark setini geçerse aktif olur. Aksi halde `prompts/history/` altında kalır, `extraction_v1.md` geçerliliğini korur.

**Her iterasyonda sorulacak sorular:**
- `value_accuracy_score` ≥ önceki iterasyon mu?
- Yeni eklenen kural eski geçen test vakalarından birini bozuyor mu?
- Prompt uzunluğu context window'u tehdit ediyor mu?
- Bu başarısızlık tek bir vakadan mı yoksa örüntüden mi geliyor? (Tek vakaya override kural yazma)
- Daha kısa bir kural aynı sonucu veriyor mu?

Eşit koşullarda daha kısa prompt kazanır.

---

## 14. Başarı Kriterleri (Success Criteria)

MVP'nin "başarılı" olduğunu nasıl ölçeceğiz:

**Teknik metrikler (zorunlu):**
- **Sıfır Halüsinasyon (değer düzeyinde):** İlk 50 gerçek manuscript üzerinde `value_accuracy_score` ≥ 0.90. Hiçbir sayısal değer manuscript'te olmadan JSON'a girmiyor.
- **JAMA Standart Uyumu:** Üretilen PNG'lerin tümü 1600×900px, AMA §4.2.10 ikon kurallarına uygun, JAMA renk/font spesifikasyonunu karşılıyor.
- **Ratchet Geçerliliği:** Her yeni prompt versiyonu bir önceki benchmark setinin tamamını geçiyor. Regresyon sıfır.

**Performans metrikleri (ölçülecek):**
- **Pipeline Hızı:** Manuscript başına end-to-end süre (PDF giriş → PNG çıkış) ≤ 90 saniye hedef, P50 < 30 saniye hedef (henüz ölçülmedi, MVP ile birlikte).
- **LLM maliyeti/manuscript:** Ortalama < $0.05 (Gemini Flash) veya < $0.15 (GPT-4o fallback dahil).
- **Autoresearch Döngüsü Etkinliği:** 5 iterasyon içinde başlangıç skoru ≥ %20 artıyor.

**Kullanım metrikleri (üründe):**
- **Manuel düzeltme oranı:** Üretilen PNG'lerin kaçı araştırmacı tarafından "düzelt ve yeniden üret" istiyor — < %10 hedef.
- **Journal kabul oranı:** AutoVA ile üretilen graphical abstract'ların dergi tarafından reddi < %5.

---

## 15. Bağlam / Referanslar (Context / References)

**Temel Teknik Standartlar**
- Andrew Ibrahim Visual Abstract Primer v4.1 — PICO yapısı, okuma yönü, panel düzeni
- AMA Manual of Style §4.2.10 — İkon piksel spesifikasyonları
- JAMA Network Visual Abstracts Portal — Journal-specific kılavuz
- Ibrahim et al. (2017) — 7.7× impression, 8.4× retweet impact study

**Karpathy Pattern**
- Karpathy AutoResearch (2024) — Otonom araştırma döngüsü, kendi kendini iyileştiren pipeline
- Karpathy LLM-Wiki + IDEA.md (2024) — Bu dosyanın formatını belirleyen standart

**Teknik Stack**
- Python 3.11+, Pydantic v2, Typer, Jinja2, Playwright/Chromium
- PyMuPDF (PDF parsing), Matplotlib (chart generation)
- google-genai, httpx (OpenAI/Anthropic REST), python-dotenv
- LLM Providers: Gemini 2.5 Flash (default), GPT-4o, Claude Sonnet

**Repo ve Sibling Belgeler**
- `/home/seyyah/works/dev/autova` — AutoVA ana repo
- [`autoVa--acaVibe.md`](./autoVa--acaVibe.md) — Aynı tıbbi domain, consumption odaklı karşıt parça (AcaVibe tüketir, AutoVA üretir). AcaVibe abstract'tan JSON üretir (pipeline çekirdeği), AutoVA full-text PDF'den PNG üretir — iki yaklaşım aynı halüsinasyon-bariyer felsefesini (`source_quote` disiplini) paylaşır.
- `SPEC.md`, `ROADMAP.md`, `PLAN.md`, `AGENT.md` — AutoVA repo içi planlama belgeleri

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-va",
  "version": "0.1.0",
  "bin": { "context-va": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-va generate` | Generate visual abstract from single source | `--input`, `--output` | `--config`, `--format`, `--language`, `--dry-run` |
| `context-va batch` | Process multiple sources from directory | `--input`, `--output` | `--config`, `--format`, `--concurrency` |
| `context-va eval` | Run ratchet evaluation against baseline | `--input`, `--baseline` | `--output`, `--format` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Single Visual Abstract

```bash
context-va generate \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/va-result.json \
  --config fixtures/config/jama-visual-abstract.yaml \
  --format json
```

**Input:** Raw thesis abstract text file.
**Expected Output:** JSON file containing `study_id`, `title`, `pico`, `key_results[]` (each with `source_quote`).
**Exit Code:** `0`

#### Scenario 2 — Batch Processing

```bash
context-va batch \
  --input fixtures/raw/ \
  --output output/va-batch/ \
  --config fixtures/config/jama-visual-abstract.yaml
```

**Input:** Directory of raw source text files.
**Expected Output:** One JSON file per input in `output/va-batch/`.
**Exit Code:** `0`

#### Scenario 3 — Ratchet Evaluation

```bash
context-va eval \
  --input output/va-result-v2.json \
  --baseline output/va-result-v1.json \
  --output output/eval-report.json
```

**Input:** New output + baseline output.
**Expected Output:** Evaluation report with pass/fail per metric. New version must ≥ baseline.
**Exit Code:** `0` if pass, `2` if regression detected.

#### Scenario 4 — Missing Input (Error)

```bash
context-va generate --output output/va.json
```

**Expected:** `Error: required option '--input <path>' not specified`
**Exit Code:** `1`

#### Scenario 5 — Nonexistent Input File (Error)

```bash
context-va generate \
  --input nonexistent/abstract.txt \
  --output output/va.json
```

**Expected:** `Error: Input file not found: nonexistent/abstract.txt`
**Exit Code:** `1`

#### Scenario 6 — Dry Run

```bash
context-va generate \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/va.json \
  --dry-run
```

**Expected:** Prints planned operations to stdout. No files written.
**Exit Code:** `0`

#### Scenario 7 — Invalid Config (Error)

```bash
context-va generate \
  --input fixtures/raw/sample-thesis-abstract.txt \
  --output output/va.json \
  --config broken.yaml
```

**Expected:** `Error: Config file not found: broken.yaml`
**Exit Code:** `1`

#### Scenario 8 — source_quote Discipline Violation

```bash
context-va eval \
  --input output/va-missing-quotes.json \
  --baseline output/va-baseline.json
```

**Expected:** `Error: Validation failed — key_results[2].source_quote is empty`
**Exit Code:** `2`


#### Scenario (Extension) — Invalid Config (Error)

```bash
context-va generate \
  --input fixtures/raw/sample-text.txt \
  --output output/error.json \
  --config fixtures/config/corrupt-config.yaml
```

**Expected:** `Error: Invalid YAML configuration in fixtures/config/corrupt-config.yaml`
**Exit Code:** `1`


#### Scenario (Extension) — Schema / Validation Check (Error)

```bash
context-va generate \
  --input fixtures/json/invalid-schema-sample.json \
  --output output/failed.json
```

**Expected:** `Error: Validation failed — schema mismatch or hallucination detected.`
**Exit Code:** `2`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Normal VA generation completed |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | source_quote missing, hallucination detected |
| `3` | External dependency error | LLM API timeout |

### Output Schema

```json
{
  "study_id": "string (required)",
  "title": "string (required)",
  "journal_target": "string",
  "pico": {
    "population": "string",
    "intervention": "string",
    "comparator": "string",
    "outcome": "string"
  },
  "key_results": [
    {
      "metric": "string (required)",
      "value": "string (required)",
      "n": "string",
      "source_quote": "string (required, verbatim from source)"
    }
  ],
  "conclusion": "string",
  "conclusion_source_quote": "string (required)"
}
```

---

> **Living Artifact Notu.** Bu belge "yaşayan bir artefakt"tır: pipeline geliştikçe belge de güncellenir. Pipeline'ın temel felsefesi, journal kapsama listesi veya autoresearch döngüsünün mekanizması belirgin biçimde değişirse ilgili bölümü güncelle — geçmişi silme, farkı yansıt. AutoVA'nın "derleme problemi" çerçevesi değişmedikçe tez bölümüne dokunma; değiştiyse tezi yeniden yaz, önceki versiyonu `## Eski Tez` olarak altına bırak. Revision notları repository commit geçmişinde izlenebilir.

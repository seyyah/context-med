# context-qualitative

*Kullanıcının context-med üzerinden wiki/raw katmanına yüklediği mülakat, anket ve serbest metin külliyatını; yerel PII maskelemeli, asenkron MapReduce boru hattıyla işleyip otonom akademik nitel analiz raporuna dönüştüren, çok-ajanlı ve maliyet-etkin analiz motoru.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce context-qualitative'in ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır.

> **Köken notu:** Bu modül, `10-draft-ideas/bitirme-proje/bp-Med-AgentLab.md` taslağındaki "Med-AgentLab" tezinin context-med ekosistemine yeniden konumlandırılmış halidir. Orijinal MapReduce felsefesi, yerel gizlilik bekçisi ve heterojen multi-agent orkestrasyon iddiası korunur; fakat artık bağımsız bir terminal scripti değil, context-wiki/context-shield altyapılarının üstüne oturan bir context-med modülüdür.

---

## 1. Tez (Thesis)

Yapay zeka çağında "zeka" pahalı donanımlarda veya devasa modellere atılan tekil, uzun promptlarda değil; **akıllı mimarilerde ve maliyet-etkin orkestrasyonlarda** saklıdır. Büyük Dil Modellerini (LLM) her işi yapan tek bir devasa sohbet botu olarak kullanmak yerine; veriyi parçalayan, her biri farklı "uzmanlığa" sahip asenkron bir ajan filosuna (Multi-Agent System) dağıtan altyapılar, akademik nitel araştırmanın geleceğidir.

context-qualitative'ın çekirdek iddiası şudur: **context-med'in wiki/raw katmanına yüklenen ham nitel külliyat (mülakat transkriptleri, açık uçlu anket cevapları, odak grubu kayıtları, serbest alan notları) zaten normalize edilmiş bir girdidir; bu girdiden tematik kodlama ve akademik sentez üretmek bir yaratıcılık problemi değil, bir chunking + heterojen ajan orkestrasyonu + medikal doğrulama problemidir.**

Donanım kısıtlarını (örn. 4 GB VRAM) bir zafiyet değil, dağıtık ve inovatif bir altyapı kurmak için itici güç olarak kullanan bir "DeepSeek Moment" manifestosudur. Binlerce sayfalık mülakat külliyatı, artık MAXQDA gibi on binlerce liralık lisanslı yazılımların tekelinde değildir; yerel bir PII bekçisi + bulutta heterojen mapper/validator/reducer ajanları kombinasyonu, aynı işi **dakikalar içinde ve sıfıra yakın maliyetle** yapabilir.

**Temel değer önermesi:** Tıp akademisyeni context-med arayüzünden mülakat külliyatını yükler, bir analiz çerçevesi (tematik kodlama / fenomenolojik analiz / içerik analizi) seçer; context-qualitative külliyatı yerel olarak anonimleştirir, MapReduce boru hattıyla parçalara böler, heterojen ajan filosuyla kodlar, medikal teyitten geçirir ve tek-sayfalık akademik sentez + kod kitabı (codebook) üretir.

---

## 2. Problem

Tıp akademisyenleri, araştırmacılar ve veri bilimciler klinik nitel veriyi işlerken üç büyük darboğazla karşılaşırlar:

### 2.1 Zaman ve Maliyet (Tekel) Darboğazı

Yüzlerce sayfalık mülakat ve açık uçlu anket külliyatının okunup tematik olarak "kodlanması" aylar sürer. Bu işlem için kullanılan geleneksel yazılımların (MAXQDA, NVivo, ATLAS.ti) lisans maliyetleri on binlerce lirayı bulur. Doktora öğrencileri ve bağımsız araştırmacılar için bu maliyet prohibitive'dir.

### 2.2 Context Window (Bağlam Penceresi) Çöküşü

Yüzlerce sayfalık nitel veri, özetlenmesi için doğrudan tek bir modele (örn. GPT-4, Claude) yığıldığında bağlam penceresi taşar; sistem halüsinasyon görmeye başlar, önceki bölümleri unutur veya tamamen çöker. "Tek bir uzun prompt" yaklaşımı, nitel veri hacmiyle ölçeklenmez.

### 2.3 Veri Gizliliği ve KVKK/HIPAA İhlali

Tıbbi nitel verilerin (hasta adları, kimlik numaraları, teşhisler, ilaç kullanımı, mahrem ifadeler) anonimleştirilmeden doğrudan üçüncü parti bulut API'lerine gönderilmesi açık bir veri güvenliği ve etik ihlalidir. Mevcut ticari nitel analiz araçları "verilerinizi buluta yükleyin" mantığıyla çalışır; KVKK/HIPAA uyumu genelde bir onay kutusundan ibarettir.

### 2.4 Tekil LLM Kilidi ve Halüsinasyon Riski

Mevcut "AI destekli nitel analiz" araçları genellikle tek bir sağlayıcıya (OpenAI veya Anthropic) kilitlenmiştir. Bu hem maliyet hem de halüsinasyon riski yaratır: tek bir modelin çıktısını doğrulayacak bağımsız bir ikinci model yoktur. Tıbbi semptom veya teşhis bağlamında halüsinasyon akademik yayına sızarsa geri dönüşsüzdür.

---

## 3. Nasıl Çalışır (How It Works)

context-qualitative, "ucuz prompt jenerasyonu" yapmaz. Nitel veriyi olgun bir akademik senteze dönüştürmek için **5 adımlı katı bir MapReduce (Parçala ve Birleştir) boru hattı** işletir.

### Temel İçgörü 1 — MapReduce ile Bağlam Yönetimi (Chunking)

Sistem, devasa veriyi tek parça okumaz. context-med wiki/raw katmanından gelen metni, bağlam sınırlarına uygun ~3000 tokenlik **mantıksal parçalara (chunks)** böler. Parçalama rastgele değildir:

- Mülakat transkriptleri → soru-cevap sınırlarında bölünür (bir soru-cevap bir chunk)
- Açık uçlu anket cevapları → katılımcı bazında gruplanır
- Odak grubu kayıtları → konuşmacı değişim noktalarında bölünür

Her chunk'a benzersiz bir `chunk_id` ve kaynak referansı (`source_file:line_range`) atanır; böylece reduce aşamasında kaynak-trace mümkün olur.

### Temel İçgörü 2 — Yerel (Local) Gizlilik Bekçisi Ajanı

**Bulutla hiçbir teması olmayan Ollama tabanlı yerel bir ajan** (4 GB VRAM'de çalışabilir, örn. Llama-3.2-3B veya Phi-3-mini), metinleri chunk-chunk analiz eder ve tüm PII (Kişisel Tanımlanabilir Bilgi) verilerini internete çıkmadan önce maskeler:

```
"Hastam Ahmet Yılmaz 2023'te KOAH tanısı aldı, TC 12345678901"
         ↓ (local PII agent — internet kapalı)
"Hastam [REDACTED_NAME] 2023'te KOAH tanısı aldı, TC [REDACTED_ID]"
         ↓ (artık buluta gönderilebilir)
```

**Maskeleme sözlüğü** yerel olarak tutulur; reduce aşamasında isterse de-anonymize edilebilir (sadece araştırmacının diskinde). Bu mimari context-med ekosistemindeki **context-shield** modülüne güvenir ve onu nitel veri bağlamına özelleştirir.

### Temel İçgörü 3 — Heterojen Multi-Agent Yönlendirmesi (Map Phase)

Sistem tek bir modele kilitlenmez. **LiteLLM orkestrasyonu** üzerinden eşzamanlı olarak farklı modeller koşturulur:

- **Mapper Ajanlar (Groq + Llama-3 veya Gemini Flash):** Asenkron olarak (`asyncio.gather`) saniyeler içinde binlerce kelimeyi okur ve her chunk'tan **ham temaları, in-vivo kodları, duygu tonunu** çıkarır.
- **Tenacity kütüphanesi:** API hız sınırı (429) çöküşlerini engeller; exponential backoff ile retry yapar.
- **Paralelizm:** 50 chunk'lık bir külliyat, tek-modelli senkron yaklaşımda 25 dakika sürerken, heterojen asenkron filoda ~90 saniyede biter.

Her mapper çıktısı yapılandırılmış JSON'dur:
```json
{
  "chunk_id": "interview_07_q3",
  "themes": ["tedavi uyumsuzluğu", "ekonomik kaygı", "güven eksikliği"],
  "in_vivo_codes": ["ilacı aldım almadım bilmiyorum", "doktoru gördüğüm tek gün"],
  "sentiment": "kaygılı",
  "source": "interview_07.md:L142-L189"
}
```

### Temel İçgörü 4 — Medikal Teyit ve Çapraz Sorgulama (Validate Phase)

Sentezlenen ham veriler doğrudan rapora yazılmaz. **Gemini tabanlı "Medikal Teyit Ajanı" (Validator)**, mapper'ların ürettiği semptom, teşhis ve tedavi ifadelerini tıp literatürüyle karşılaştırarak AI halüsinasyonlarını filtreler:

- Mapper "KOAH akut enfarktüs tedavisi" dediyse → validator bunu sahte-eşleşme olarak işaretler
- Mapper "NSAID kullanımı hipertansiyon tetikleyicisi" dediyse → validator literatürde doğrular
- Şüpheli temalar `needs_human_review: true` bayrağıyla işaretlenir

Validator'ın farklı bir model sağlayıcıdan olması kritiktir — aynı modelin kendi halüsinasyonunu doğrulamasını engeller (çapraz-sağlayıcı doğrulama).

### Temel İçgörü 5 — Otonom Akademik Sentez (Master Reducer)

Doğrulanmış argümanlar **OpenAI (GPT-4o-mini) veya DeepSeek destekli Baş Ajan (Master Reducer)** tarafından alınır:

1. Yinelenen temalar birleştirilir (deduplication)
2. Tema hiyerarşisi çıkarılır (axial coding: ana tema → alt tema → kod)
3. Her tema için **frekans, katılımcı kapsamı ve örnek alıntılar** eklenir
4. Formata uygun **tek sayfalık nihai araştırma özeti + kod kitabı (codebook) + ham alıntı haritası** üretilir

Reducer'ın çıktısı akademik makale yazımında doğrudan kullanılabilir bulgular bölümüne yerleştirilebilir.

---

## 4. Mimari (Architecture)

### Katman 1 — Bilgi Katmanı (Knowledge Layer)

- **wiki/raw/** — context-med aracılığıyla yüklenen ham nitel külliyat (markdown, txt, pdf-çıkarılmış)
- **wiki/anonymized/** — yerel PII bekçisinden geçmiş, buluta gönderilmeye hazır maskeli külliyat
- **analysis-frameworks/** — tematik kodlama / fenomenolojik / içerik analizi prompt şablonları
- **codebooks/** — üretilen kod kitapları (insan tarafından revize edilebilir)
- **pii-dictionary/** — yerel, şifrelenmiş maskeleme sözlüğü (sadece araştırmacının diskinde)

### Katman 2 — Runtime Katmanı (Analysis Pipeline)

```
Wiki/Raw Upload (context-med UI)
       ↓
ChunkerAgent — soru-cevap / katılımcı sınırlarında bölme
       ↓
LocalPIIAgent (Ollama, internet kapalı) — PII maskele, sözlüğü yerel kaydet
       ↓
MapperFleet (Groq/Llama-3, Gemini Flash — async) — ham tema + kod çıkar
       ↓
ValidatorAgent (Gemini, farklı sağlayıcı) — medikal teyit + halüsinasyon filtresi
       ↓
ReducerAgent (GPT-4o-mini / DeepSeek) — sentez, deduplication, codebook
       ↓
ReportRenderer — tek sayfalık özet + codebook + alıntı haritası (markdown + PDF)
       ↓
Output: wiki/analysis/{study_id}/report.md + codebook.yaml + quotes.json
```

### Katman 3 — Gözlenebilirlik ve İnsan-İçinde Döngü

**Streamlit destekli modern arayüz** (veya context-ui'a entegre panel) üzerinden:
- Hangi ajanın hangi chunk'ı işlediği canlı ilerleme çubuklarıyla izlenir
- `needs_human_review: true` bayraklı temalar araştırmacıya sorulur
- Kod kitabı revizyonu insan-içinde yapılır; revizyon sonrası reducer yeniden tetiklenebilir
- PII maskeleme sözlüğü sadece araştırmacının tarayıcı oturumunda görünür

---

## 5. Operasyonlar (Operations)

### Senaryo 1 — Tematik Kodlama (Doktora Tezi)

```bash
context-qualitative analyze \
  --wiki wiki/raw/phd-thesis-diabetes-interviews/ \
  --framework thematic-coding \
  --language tr \
  --output wiki/analysis/diabetes-thematic/
```

**Girdi:** 25 adet mülakat transkripti (~450 sayfa)
**Çıktı:**
- `report.md` — tek sayfalık akademik sentez
- `codebook.yaml` — 3 ana tema, 12 alt tema, 47 kod
- `quotes.json` — her kod için örnek alıntılar + kaynak trace
- `pii-dictionary.enc` — yerel, şifrelenmiş maskeleme sözlüğü
- Süre: ~8 dakika (geleneksel: 3-4 ay)

### Senaryo 2 — Açık Uçlu Anket Analizi

```bash
context-qualitative analyze \
  --wiki wiki/raw/covid-survey-responses/ \
  --framework content-analysis \
  --language tr \
  --participant-field "respondent_id" \
  --output wiki/analysis/covid-survey/
```

1000+ açık uçlu cevap, katılımcı bazında gruplanır, frekans tabloları + tema hiyerarşisi üretilir.

### Senaryo 3 — Karma Analiz (Fenomenolojik + İçerik)

```bash
context-qualitative analyze \
  --wiki wiki/raw/palliative-care-focus-groups/ \
  --framework phenomenological,content-analysis \
  --validator medical-literature-cross-check \
  --output wiki/analysis/palliative-care/
```

İki farklı analiz çerçevesi paralel çalışır; reducer aşamasında çıktılar karşılaştırılır ve örtüşen/çelişen bulgular raporlanır.

### Senaryo 4 — Kodbook Revizyonu ve Yeniden Sentez

```bash
context-qualitative refine \
  --study wiki/analysis/diabetes-thematic/ \
  --codebook-revision wiki/analysis/diabetes-thematic/codebook-v2.yaml \
  --output wiki/analysis/diabetes-thematic-v2/
```

Araştırmacı codebook'u manuel revize ettikten sonra reducer yeniden çalışır; tüm alıntılar yeni tema yapısına göre yeniden haritalanır.

---

## 6. Ne Yapmaz (What It Does Not Do)

- **Siyah bir terminal scripti değildir.** Görünmez asenkron süreçler arkasında kaybolmaz. Streamlit/context-ui entegrasyonu ile her ajan adımı şeffafça izlenir.
- **KVKK/HIPAA'yı ihlal etmez.** İşlenecek veriler yerel ajanlardan geçmeden ve anonimleşmeden asla buluta gönderilmez.
- **Senkron (bloklayıcı) çalışmaz.** `async def` ve `await` mimarileriyle görevler eşzamanlı işletilir; geleneksel kodlamanın hantallığını taşımaz.
- **Nicel analiz yapmaz.** İstatistiksel anlamlılık testleri, regresyon, faktör analizi kapsam dışıdır. Nicel modül `context-quantitative` (gelecekte) olarak ayrıştırılır.
- **Otomatik akademik makale yazmaz.** Bulgular bölümünü üretir; giriş, yöntem, tartışma bölümleri `context-paper` modülünün işidir.
- **Ses/video transkripsiyonu yapmaz.** Girdinin metin formatına (markdown, txt, pdf-extracted) dönüştürülmesi yukarı akıştaki işlem adımıdır (context-med upload pipeline veya manuel).
- **Tek bir LLM sağlayıcısına kilitlenmez.** LiteLLM üzerinden Groq, Gemini, OpenAI, DeepSeek, Anthropic eşit yurttaşlıkta çalışır; bir sağlayıcı çökerse fallback otomatiktir.

---

## 7. Neden Şimdi (Why Now)

**The "DeepSeek" Moment:** Devasa API faturalarına mahkum olduğumuz dönem bitti. LiteLLM gibi orkestrasyon araçları ve küçük ama yetenekli açık kaynak modeller (Groq, Llama-3, Ollama, DeepSeek) sayesinde **sıfıra yakın maliyetle** akademik nitel analiz yapmak ilk kez mümkün hale geldi.

**Donanım Demokratikleşmesi:** Güçlü bir laboratuvar kurmak için binlerce dolarlık GPU'lara gerek kalmadı. 4 GB VRAM'li bir dizüstü bilgisayar, yerel PII bekçisi için yeterli; gerisi heterojen bulut ajanlarına dağıtılır. Zekice tasarlanmış bir MapReduce mimarisi, mütevazı donanımı devasa bir işlem merkezine çevirir.

**context-med altyapısı hazır:** wiki/raw katmanı, context-shield PII altyapısı, context-core zincir koordinasyonu — hepsi çalışıyor. context-qualitative bunların üstüne oturup nitel analiz motoru olarak devreye girer.

**Akademik yayın baskısı nitel araştırmayı sıkıştırıyor:** Tıp akademisyenleri her yıl daha fazla yayın üretmek zorunda ama nitel analiz süresi sabit kalıyor. Otomatize edilmeden bu denklem çözülemiyor; manuel analizin geri dönüşü 3-6 ay, otomatize analizin geri dönüşü saatler.

**Ticari nitel analiz yazılımlarının fiyatı 2023-2026 arasında %40+ arttı:** MAXQDA tek-kullanıcı lisansı yıllık ~€1200, kurumsal çok-kullanıcı ~€8000+. Açık-kaynak alternatif artık opsiyonel değil, zorunlu hale geldi.

---

## 8. Kim Fayda Sağlar (Who Benefits)

**Tıp Akademisyenleri ve Araştırmacılar:** Nitel mülakat analizinde aylar kaybeden, geleneksel yazılımlara on binlerce lira ödemek istemeyen klinisyenler ve veri bilimciler.

**Doktora Öğrencileri:** Tez araştırması için 50+ mülakat yapması gereken ama MAXQDA lisansını karşılayamayan doktora adayları; özellikle gelişmekte olan ülkelerde kritik demokratikleştirici bir araç.

**Donanım Kısıtlı Öğrenciler / Geliştiriciler (Solo-Engineers):** 4 GB VRAM gibi dar kaynaklarla otonom araştırmalar yürütmek isteyen girişimciler ve mühendisler.

**Sağlık Kurumları (Kalite İyileştirme Birimleri):** Hasta memnuniyet anketleri, personel geri bildirimleri, şikâyet kayıtları gibi nitel verilerden hızlı tematik özet çıkarması gereken kalite birimleri.

**Halk Sağlığı Araştırmacıları:** Salgın dönemi mülakatları, odak grubu çalışmaları, ajans kayıtları gibi büyük hacimli nitel külliyatı hızlıca işlemesi gereken epidemiyologlar.

---

## 9. Teknik Mimari (Technical Architecture)

**Stack:**
- Python 3.11+, Pydantic v2, Typer, asyncio
- **Orkestrasyon:** LiteLLM (çok-sağlayıcı rooting)
- **Yerel Ajan:** Ollama (Llama-3.2-3B / Phi-3-mini) — 4 GB VRAM yeterli
- **Bulut Mapper'lar:** Groq (Llama-3.3-70B), Gemini Flash
- **Validator:** Gemini Pro (tıp literatürü teyit)
- **Reducer:** GPT-4o-mini veya DeepSeek-Chat
- **Dayanıklılık:** Tenacity (retry + exponential backoff)
- **UI:** Streamlit (standalone) veya context-ui entegrasyonu
- **Depolama:** context-med wiki dosya sistemi (yerel) + opsiyonel S3

**Ajan Rolleri:**

- **ChunkerAgent:** Ham külliyatı mantıksal sınırlarda böler, chunk_id atar, source trace tutar.
- **LocalPIIAgent:** Ollama tabanlı, internet kapalı; PII tespiti + maskeleme + yerel sözlük yazma.
- **MapperFleet:** Asenkron heterojen ajan filosu; her chunk için tema + kod + duygu JSON çıkarır.
- **ValidatorAgent:** Farklı sağlayıcı LLM; medikal ifadeleri literatür ile çapraz-kontrol eder.
- **ReducerAgent:** Tek Master, doğrulanmış argümanları sentezler; codebook ve rapor üretir.
- **ReportRenderer:** Markdown + PDF + HTML çıktı; show-notes benzeri timeline/navigation.
- **PromptRefiner:** Araştırmacı feedback'inden öğrenir; mapper/validator prompt'larını ratchet ile iyileştirir.

**Analiz Çerçeveleri (MVP):**
- `thematic-coding` — Braun & Clarke (2006) 6-adımlı
- `content-analysis` — frekans tablosu + kategori hiyerarşisi
- `phenomenological` — Colaizzi / Van Kaam yaklaşımı
- `grounded-theory-lite` — açık kodlama + axial coding (teori üretimi insan-içinde)

---

## 10. Kısıtlamalar (Constraints)

- **LLM kalitesi dile bağlıdır:** Türkçe tıbbi terminoloji için Gemini ve GPT-4o-mini iyi; Groq/Llama-3 bazı medikal terimleri yanlış yorumlayabilir. Validator aşaması bunu telafi eder.
- **Yerel PII ajanı hassasiyeti sınırlıdır:** 3B-parametre yerel modeller %95+ PII yakalar ama %100 değil. Kritik hasta verileri için insan-içinde review zorunlu.
- **Halüsinasyon asla sıfır değildir:** Validator + çapraz-sağlayıcı yaklaşımı riski düşürür ama %1-2 civarında kalır. Bu yüzden her bulgu için ham alıntı izi zorunludur.
- **Ses/video doğrudan işlenmez:** Külliyat metne dönüştürülmüş olmalıdır. Whisper entegrasyonu yukarı akışta ayrı bir context-med modülünün işidir.
- **Nicel metrik üretmez:** İstatistiksel anlamlılık, etki büyüklüğü, p-değerleri gibi kavramlar kapsam dışıdır.

---

## 11. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **Yerel PII ajanı bir ismi kaçırır → buluta PII sızar** | Düşük | Çok Yüksek | Çift-geçiş PII tarama (yerel + bulut öncesi regex); araştırmacıya "maskeleme raporu" gösterilir; opsiyonel insan-onayı kilidi |
| **Mapper halüsinasyonu (hasta hiç söylemediği temayı uydurma)** | Orta | Yüksek | Her tema için chunk-içi alıntı zorunluluğu (quote_grounding); validator'da cross-provider doğrulama |
| **Medikal teyit ajanı da yanlış yönlendirilir** | Düşük | Yüksek | Validator prompt'u ratchet test seti ile eval edilir; `needs_human_review` bayrağı eşik altında otomatik tetiklenir |
| **LLM sağlayıcı çökmesi / rate limit** | Yüksek | Orta | Tenacity + LiteLLM fallback chain (Groq → Gemini → OpenAI → DeepSeek) |
| **Analiz çerçevesi akademik standartlara uymuyor** | Orta | Yüksek | Braun & Clarke, Colaizzi, Elo & Kyngäs gibi yayınlanmış metodolojilere prompt-level sadakat; akademik danışman review gate |
| **Araştırmacı codebook'u hiç revize etmeden yayınlar** | Orta | Yüksek | UI'da "insan revizyonu yapılmadı" uyarısı; rapor dipnotunda AI-assisted oranı açıkça belirtilir |
| **KVKK denetimi → yerel sözlük şifreleme talebi** | Düşük | Orta | PII sözlüğü AES-256 ile şifreli saklanır; anahtar sadece araştırmacıda |

---

## 12. Açık Sorular (Open Questions)

1. **Analiz çerçevesi seçimi araştırmacıya mı bırakılmalı, yoksa sistem külliyatı analiz edip öneride mi bulunmalı?** (Mülakat transkripti → tematik; açık uçlu anket → içerik analizi gibi)
2. **Inter-rater reliability simülasyonu:** Aynı külliyatı iki farklı mapper fleet ile çalıştırıp Cohen's kappa üretmeli miyiz? (Akademik dergiler genelde istiyor)
3. **Çoklu dil desteği:** Türkçe + İngilizce karışık külliyatlar (örn. uluslararası multi-site çalışma) nasıl işlenmeli?
4. **Codebook versiyonlama:** Araştırmacı revizyonu sonrası eski versiyona geri dönüş mümkün mü? Git benzeri versiyonlama mı, snapshot mı?
5. **Yayın hazırlığı çıktısı:** Rapor doğrudan `context-paper`'a fed mi edilmeli, yoksa araştırmacı manuel aktarmalı mı?
6. **Akademik etik onayı:** AI-assisted analiz kullanıldığı yayın dipnotunda nasıl ifade edilmeli? (COPE, ICMJE kılavuzları takip edilecek)
7. **Offline-first mod:** Tüm pipeline (mapper + validator + reducer) yerel modellerle çalıştırılabilir mi? Kalite kaybı ne düzeyde?

---

## 13. Değerlendirme — Ratchet Beklentisi

**Altın standart test seti:**
- **Tematik kodlama benchmark:** 10 adet yayınlanmış doktora tezi mülakat külliyatı + yazarın manuel codebook'u → sistem çıktısı ile karşılaştırma (tema örtüşme %, kod frekans korelasyonu)
- **İçerik analizi benchmark:** 5 adet yayınlanmış nitel makale (açık uçlu anket bazlı) → sistem frekans tablosu vs. makalenin tablosu
- **PII maskeleme benchmark:** 1000 sentetik hasta-benzeri ifade → yerel ajan recall/precision

**Her iterasyonda sorulacak sorular:**
- Yeni mapper prompt versiyonu önceki benchmark setini bozuyor mu?
- Validator'ın halüsinasyon yakalama oranı düştü mü? (Regression ise alert)
- Reducer'ın ürettiği codebook insan-revizyon oranı düşüyor mu? (Kalite artışı indikatörü)
- Yerel PII ajanı yeni bir isim türü kaçırıyor mu? (Continuous improvement)

**Başarısızlık Örnekleri → Writeback:**
- Mapper bir alıntıyı yanlış temaya bağladıysa → ChunkerAgent veya MapperFleet prompt'una yeni kural
- Validator bir medikal uydurmayı kaçırdıysa → Validator prompt'una negative example eklenir
- Araştırmacı codebook'u büyük oranda revize ettiyse → Reducer prompt'u bu paternden öğrenir

---

## 14. Başarı Kriterleri (Success Criteria)

**Teknik Metrikler (zorunlu):**
- **%100 kaynak trace:** Her kod ve tema, en az bir chunk alıntısına geri bağlanabilir.
- **PII maskeleme recall ≥ %99:** Benchmark sentetik külliyatta yakalanma oranı.
- **Halüsinasyon oranı < %2:** Validator sonrası ham temalarda literatür-çelişkili iddia oranı.
- **Analiz süresi:** 500 sayfalık külliyat için uçtan uca < 15 dakika (insan 3-4 ay).

**Kullanım Metrikleri:**
- **Codebook revizyon oranı:** Araştırmacıların %70'i en az bir kod düzenler (sağlıklı insan-içinde döngü).
- **Yayınlanan makale dipnotu:** Sistemi kullanan araştırmacıların %50+'ı makale metodoloji bölümünde AI-assisted analiz olarak atıf yapar.
- **Maliyet:** Bir doktora tezi kapsamında toplam LLM faturası < 10 USD (karşılaştırma: MAXQDA yıllık ~1200 EUR).

**Kalite Metrikleri:**
- **Manuel codebook ile örtüşme:** Benchmark setlerinde ≥ %75 tema örtüşmesi (Cohen's kappa ≥ 0.70).
- **Akademik danışman onayı:** Pilot kullanıcı grubunda (5 doktora danışmanı), çıktının "yayın-öncesi revize edilebilir" sayılma oranı ≥ %80.

---

## 15. Bağlam / Referanslar (Context / References)

**Sistem Bağlamı:**
- `context-wiki` — ham külliyatın yüklendiği wiki/raw katmanını sağlar; context-qualitative girdisini buradan okur
- `context-shield` — PII maskeleme altyapısı; LocalPIIAgent bu modüle güvenir ve nitel veri bağlamına özelleştirir
- `context-core` — zincir koordinasyonu; context-qualitative bir analiz modülü olarak core'a entegre olur
- `context-paper` — makale yazımı; context-qualitative'ın `report.md` ve `codebook.yaml` çıktıları context-paper'a fed edilir
- `context-narrate` — analiz raporunun sesli özeti üretilmek istenirse devreye girer (araştırma toplantısı sunumu için)
- `context-gate` — analiz çerçevesi ve codebook doğrulama kapıları; yayın öncesi quality-gate

**İlham Kaynakları:**
- **Med-AgentLab (bp-Med-AgentLab.md)** — bu modülün köken taslağı; MapReduce + heterojen ajan felsefesi bu tezden gelir
- **MAXQDA / NVivo / ATLAS.ti** — kod tabanlı nitel analiz yazılımları; context-qualitative bunların açık-kaynak, AI-otomatize alternatifidir
- **Braun & Clarke (2006)** — Thematic Analysis metodolojisi
- **DeepSeek Moment** — maliyet-etkin LLM orkestrasyonu felsefesi; tekel-kıran inovasyon

**Teknik Araçlar:**
- **LiteLLM:** https://github.com/BerriAI/litellm — çok-sağlayıcı LLM proxy
- **Ollama:** https://ollama.ai — yerel model runtime
- **Tenacity:** Python retry kütüphanesi
- **Streamlit:** Observability arayüzü
- **Groq:** Hızlı Llama-3 inference
- **Gemini / OpenAI / DeepSeek / Anthropic:** Mapper/Validator/Reducer sağlayıcıları

**Standartlar:**
- **Karpathy IDEA.md (2024)** — bu dosyanın format standardı
- **Braun & Clarke (2006)** — thematic analysis protokolü
- **Elo & Kyngäs (2008)** — content analysis protokolü
- **Colaizzi (1978) / Van Kaam (1959)** — fenomenolojik analiz
- **COPE / ICMJE AI disclosure guidelines** — AI-assisted analiz atıf standartları
- **context-med ekosistem kontratı** — operational-schema, ratchet eval, writeback

---

## 16. Cerebra ile İlişki (Dual-mode)

**Standalone Mod:** context-qualitative kendi `wiki/raw/` klasöründen okur, analiz üretir, codebook'u yerel tutar. Bağımsız bir nitel analiz motorudur; context-med dışında da (örn. saf akademik çalışma) kullanılabilir.

**Cerebra-composed Mod:**
- context-wiki substrate'ine bağlanır; tüm wiki külliyatına erişir
- PII maskeleme sözlüğü context-shield'in merkezi yönetimine devredilir
- Araştırmacı codebook revizyonları cerebra provenance grafiğine yazılır (hangi revizyon ne zaman, niye)
- Halüsinasyon tespitleri cerebra'nın `human-in-loop-agent`'ına eskalasyon yapar
- Ratchet eval yetenekleri framework'ten miras alınır
- Çıktı `context-paper`'a otomatik fed edilerek "bulgular bölümü" taslağı üretilir

---

## 17. context-med Ekosistemindeki Yeri

context-med dört temel analiz modunu destekler:

- **context-va:** Grafik özet üretir (görsel / dashboard)
- **context-paper:** Manuscript yazar (akademik metin)
- **context-slides:** Sunum destesi oluşturur (görsel + metin)
- **context-narrate:** Sesli özet / podcast üretir (audio)
- **context-qualitative (bu modül):** Ham nitel külliyatı tematik/fenomenolojik/içerik analizine dönüştürür (yapılandırılmış sentez)

context-qualitative, diğer modüllerin **yukarı akışındaki motor**dur: ham külliyattan yapılandırılmış bulgu seti üretir; bu bulgular context-paper tarafından makaleye, context-slides tarafından sunuma, context-narrate tarafından podcast'e, context-va tarafından grafiğe dönüştürülür.

Tek bir wiki/raw külliyatından, beş farklı çıktı formatına ulaşan doğrusal olmayan bir bilgi üretim hattının **nitel analiz düğümüdür**.

---

> **Living Artifact Notu.** Bu belge yaşayan bir artefakttır. Yeni analiz çerçeveleri eklendikçe, yeni LLM sağlayıcıları entegre edildikçe, araştırmacı geri bildirimleri pipeline'ı iyileştirdikçe güncellenir. Tezdeki "MapReduce + yerel PII bekçisi + heterojen ajan + çapraz-sağlayıcı validator" çerçevesi değişmedikçe teze dokunma; değiştiyse tezi yeniden yaz.

---

**Son Not:** context-qualitative, bitirme projesi "Med-AgentLab"ın context-med ekosistemine yerleştirilmiş, üretim-hazır halidir. Orijinal taslağın "DeepSeek Moment" manifestosu korunur; fakat artık izole bir Streamlit scripti değil, context-wiki/context-shield/context-core altyapılarına yaslanan, context-paper/context-narrate/context-slides çıktılarını besleyen **ekosistem-yerli bir modüldür**.

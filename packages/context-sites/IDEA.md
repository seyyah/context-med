# context-sites — IDEA.md

> **Okuma Notu:** Bu bir *idea file*'dır. Karpathy'nin LLM-wiki gist felsefesine göre tasarlanmıştır: tek başına bir LLM ajanına (Claude Code, Codex vb.) copy-paste edilebilir, yüksek seviye mimariyi ve motivasyonu net şekilde aktarır; kodun detaylarını ajanla birlikte evrimleştirmeyi hedefler. Kod yazmadan önce *neden* sorusunu yanıtlar.

---

## 0. Tek Cümle Özeti

> **context-sites, kullanıcının context-med üzerinden `raw/` ve `wiki/` katmanlarına yüklediği akademik/tıbbi içeriği, tek komutla yayına hazır bir statik web sitesine dönüştüren; sayfa mimarisini wiki hiyerarşisinden otomatik çıkaran, içeriğe yeni bilgi üretmeyen (extract-only) ve provenance zincirini koruyan bir yayın ajan pipeline'ıdır.**

---

## 1. Tez

Context-med boru hattı, araştırmacının bilgisini `raw/` → `context-gate` → `context-wiki` zinciriyle yapılandırılmış bir hale getirir. Bu noktada araştırmacı somut bir "aha" çıktısına — görsel özet (`context-va`), makale (`context-paper`), slayt (`context-slides`), seslendirme (`context-narrate`) — ulaşabilir. Ama bu çıktıların hepsi **dosya**dır: dergiye yollanır, sunumda açılır, drive'a yüklenir. İçerik yaşamaz, paylaşılmaz, aranabilir değildir.

Oysa wiki'de olan yapı — entity, kavram, prosedür sayfaları, çapraz referanslar, provenance metadata — aslında zaten bir web sitesinin iskeletidir. Bu iskeleti ayrıca bir CMS'e taşımak, tema seçmek, navigasyon yazmak, hosting kurmak — hepsi ayrı bir proje olur ve çoğu araştırmacı o projeye asla başlayamaz.

**context-sites bu denklemi tersine çevirir:**

- **Geleneksel akademik site:** WordPress kurulumu + tema seçimi + sayfa sayfa içerik girişi + manuel güncelleme → haftalarca emek, bir süre sonra güncelleme bırakılır
- **context-sites:** `context-med run sites --notebook my-thesis` → wiki ağacından türetilmiş sayfa yapısı, `raw/` içinden otomatik referans listesi, tema konfigürasyonundan üretilmiş statik HTML, `deploy/` klasöründe yayına hazır bundle → aynı dakika, insan emeği minimumda

Değer önerisi şudur: **Araştırmacı bilgisini wiki'ye yüklediği anda, o bilgi artık bir web sitesidir.** Ayrı bir içerik yönetim sistemi, ayrı bir ingest akışı, ayrı bir güncelleme disiplini yoktur. Wiki güncellenirse site güncellenir; `raw/` değişirse referans listesi yenilenir. Tek kaynak, tek hakikat.

---

## 2. Problem Uzayı

### 2.1 Birincil Problem — Yayınlanmayan Bilgi

Araştırmacılar, tez jürisine veya dergi editörüne teslim ettikleri içeriğin ötesinde büyük miktarda yapılandırılmış bilgi biriktirir: literatür notları, prosedür taslakları, hasta veri özetleri (anonimize), metodolojik kararlar. Bu bilgi context-med'e yüklenince güzelce derlenir — ama sonra **görünmez kalır**. Ne aynı laboratuvardaki öğrenci ondan yararlanabilir, ne kurum dışındaki meslektaşlar atıf yapabilir, ne halk bilim iletişimi için kullanabilir.

Wiki'de duran bilgi, web'de olmayan bilgidir.

### 2.2 İkincil Problem — Yayın Sürtünmesi

Akademik bir web sitesi kurmak isteyen araştırmacının önündeki sürtünme uzun listedir:

1. **Platform seçimi**: WordPress, Hugo, Jekyll, Notion, Webflow — her birinin kendi öğrenme eğrisi
2. **Tema ve stil**: Akademik bir sitenin neye benzemesi gerektiğini tariflemek zor; jenerik temalar tıp dergisi estetiğini yakalamaz
3. **İçerik göçü**: Wiki'deki markdown'ı, referans metadata'sını, DOI bağlantılarını hedef platforma çevirme
4. **Senkron kalmama**: Wiki güncellenir, site eski kalır; iki gerçeğin farklı dönemlere ait olması kurumsal güvensizlik üretir
5. **Hosting ve güvenlik**: Özellikle hasta verisi içeriyorsa yanlış ifşa ediliş endişesi

### 2.3 Üçüncül Problem — Tek Kaynaktan Çoklu Çıktı Zorunluluğu

Aynı bilgi farklı kitlelere farklı biçimde sunulmak zorundadır:

- **Akademik meslektaş**: Tam referans, yöntem detayı, ham veri bağlantısı
- **Klinisyen**: Kısa özet, karar ağacı, uygulanabilir protokol
- **Hasta / halk**: Sade dil, görsel abstract, sık sorulanlar

Bunların her biri ayrı bir site gibi davranır ama **aynı wiki'den türer**. Context-sites, wiki üzerinde "view" kavramını gerçek kılmalıdır: aynı içerik, farklı tema + farklı filtre + farklı kitle ayarı.

---

## 3. Çözüm Mimarisi — Pipeline Özeti

context-sites, zincir halinde çalışan beş otonom ajandan oluşur. Her ajan bir öncekinin çıktısını tüketir ve bir sonrakine yapılandırılmış veri aktarır. Tüm zincir context-med `raw/` + `wiki/` kontratları üzerinde çalışır; dış ingest yoktur.

```
wiki_scanner → site_planner → page_renderer → asset_resolver → deploy_packager
      ↑                                                             |
      └──────── context-wiki writeback (wiki değişince rebuild) ───┘
```

### Ajan Sorumlulukları

| # | Ajan | Temel İşlev | Girdi | Çıktı |
|---|------|-------------|-------|-------|
| 1 | `wiki_scanner` | Micro-wiki ağacını okur, sayfa grafiğini çıkarır | `wiki/<notebook>/` | `site_graph.json` |
| 2 | `site_planner` | Site yapısını (navigasyon, bölüm, taksonomi) planlar | `site_graph.json` + `theme.yaml` | `site_plan.json` |
| 3 | `page_renderer` | Her wiki sayfasını tema şablonuna uyarlar | `site_plan.json` + wiki markdown | `dist/<slug>.html` |
| 4 | `asset_resolver` | `raw/` içindeki PDF/görsel referanslarını çözer, bağlantıları yeniler | `dist/` + `raw/` manifest | Güncellenmiş `dist/` + asset tablosu |
| 5 | `deploy_packager` | Yayına hazır bundle üretir (statik HTML + sitemap + robots) | `dist/` | `deploy/<notebook>.zip` + manifest |

### Veri Akışı Prensipleri

- **Loosely coupled**: Her ajan bağımsız çalışır. Bir ajan çökerse diğerleri son geçerli JSON çıktısıyla devam eder.
- **Idempotent**: Aynı wiki içeriği iki kez build edilse de aynı hash'li çıktı üretilir. Değişmeyen sayfa yeniden render edilmez.
- **Wiki is source of truth**: Site sadece wiki'den türer. Tema ve config haricinde site içinde manuel yazılan içerik **yoktur**. Wiki değişmeden site değişmez.
- **Provenance korunur**: Her render edilmiş sayfa, kaynaklandığı wiki sayfasının path'ini ve hash'ini footer metadata olarak taşır.

---

## 4. Temel İçgörüler

### İçgörü 1 — "Wiki Zaten Bir Site"

Geleneksel yayın akışı şunu der: *"İçerik wiki'de, sitesi sonra kurulur."*

context-sites ile akış şudur: *"İçerik wiki'de ise site zaten vardır — sadece render edilmemiştir."*

Bu fark, bp-autoSite'ın *endowment effect* kaldıracının akademik karşılığıdır: araştırmacı yüklediği anda bilgisinin bir sitede nasıl göründüğünü görür. Bu görünürlük, wiki disiplinini de besler — sayfaları özenle yazmak için tek sebep artık "wiki temiz olsun" değil, "sitede güzel görünsün"dür.

### İçgörü 2 — "Extract, Never Generate" Mirası

context-gate'den miras alınan kırılmaz kısıt buraya da uygulanır. Site üretici:

| İzin Verilen | Yasak |
|---|---|
| Wiki markdown'ı HTML'e çevirmek | Wiki'de olmayan paragraf eklemek |
| Navigasyon ve menü oluşturmak | Wiki sayfalarını "daha iyi anlatan" versiyonlar yazmak |
| Tema/stil uygulamak | İçerik özetlemek (yeni metinle) |
| Çapraz referans linklerini yeniden yazmak | Wiki'de olmayan "okuyucu dostu" açıklamalar üretmek |
| Metadata tablosundan sayfa başlığı türetmek | Eksik bölümleri LLM ile tamamlamak |

Bu sınır, tıbbi ve akademik içeriğin sadakati için kritiktir. Halüsine bir cümle bir bildiri sitesinde durmaz; aynı cümle wiki'ye geri yazılırsa tüm context-wiki kontratı bozulur. Site katmanı görselleştirir, yorumlamaz.

### İçgörü 3 — Pipeline Hızı Fark Yaratır

Yüksek lisans öğrencisi tez savunmasından bir hafta önce jüriye erişilebilir bir portföy linki atmak ister → 2 dakika içinde `context-med run sites --notebook thesis` komutu çalışır → wiki'deki literatür özeti, methods taslağı, sonuç grafikleri birbirine linkli sayfalar olarak yayınlanır.

Hız, yayında disiplinden önce gelir. "Siteyi kurmaya vaktim yok" cümlesi, "zaten kurulu, sadece güncelleyeceğim" ile değişir.

### İçgörü 4 — Tek Wiki, Çoklu View

Aynı `thesis` notebook'u üç farklı `theme.yaml` ile build edilebilir:

- `academic.yaml` → Tam referanslı, bölüm hiyerarşili, JAMA estetiği
- `clinic.yaml` → Kısa özet + karar ağacı, klinisyen hızlı-bakış
- `public.yaml` → Sade dil sayfaları (wiki'de "public" etiketli sayfalar), görsel abstract vurgulu

Üçü de aynı wiki'den türer, aynı provenance'a bağlıdır, aynı anda yayınlanabilir. "Site" artık monolitik bir proje değil, wiki üstünde bir "lens"tir.

### İçgörü 5 — Ölçek, İçerik Sayısıyla Değil Wiki Kalitesiyle Gelir

100 sayfalık bir wiki ile 10 sayfalık bir wiki arasında site üretim maliyeti farkı birim başına neredeyse sıfırdır. İnsan emeği yalnızca **wiki disiplini** noktasına ayrılır — tema/config/deploy tamamen otomatiktir. Yayın tekrarlandıkça wiki yatırımı kendini amortize eder.

---

## 5. Ne Yapmaz (Kapsam Dışı)

Bu netlik, scope creep'i önlemek için kritiktir:

- ❌ Genel amaçlı statik site üretici değildir — yalnızca context-med wiki/raw kontratıyla çalışır
- ❌ WYSIWYG editör sunmaz — içerik düzenleme wiki seviyesinde yapılır
- ❌ Wiki'de olmayan içerik üretmez (no LLM generation at render time)
- ❌ Domain satın alma, DNS yönetimi, SSL sertifika üretmez — sadece static bundle çıkarır
- ❌ Dinamik form, yorum sistemi, login/auth yoktur — statik yayın
- ❌ E-ticaret, kurumsal CMS, blog platformu değildir
- ❌ `context-shield` yokken kişisel veri içeren wiki'ler yayına çıkarılmaz (guardrail zorunlu)

---

## 6. Faz Planı

### Faz 1 — Core Rendering 🔜 (Öncelikli)

`wiki_scanner → site_planner → page_renderer`

Minimum viable build: bir notebook wiki'sinden statik HTML üretimi. Tek tema (`academic.yaml`), tek dil (Türkçe), tek çıktı (yerel `dist/`).

**Tamamlanma kriteri:** Bir örnek tez wiki'sinden (20-30 sayfa) hatasız, linkleri çalışan statik site üretilir; provenance footer her sayfada görünür.

### Faz 2 — Asset Resolution ve Raw Referansları 🔜

`asset_resolver` devreye girer. `raw/` klasöründeki PDF, görsel ve tablolar için indirme/önizleme bağlantıları otomatik üretilir. Provenance manifest site'a dahil edilir.

**Tamamlanma kriteri:** Wiki sayfalarındaki `[[raw/paper-01.pdf]]` benzeri referanslar, site içinde hem önizleme kartı hem indirme linki olarak görünür.

### Faz 3 — Theme & Multi-View 🔮

`theme.yaml` altyapısı. Minimum üç tema (academic / clinic / public). Aynı notebook'un üç farklı lens ile yayınlanabilmesi.

**Tamamlanma kriteri:** Aynı wiki'den `--theme academic` ve `--theme clinic` ile build edilen iki site, hiçbir manuel müdahale olmadan farklı ama tutarlı çıkar.

### Faz 4 — Deploy Packaging 🔮

`deploy_packager` — yayına hazır bundle (zip / tarball). Netlify, Vercel, GitHub Pages ve basit Nginx için hazır manifest dosyaları. Domain bağlama ve hosting hâlâ kullanıcı sorumluluğundadır; context-sites sadece bundle verir.

**Tamamlanma kriteri:** Üretilen zip açılıp `python -m http.server`'a atıldığında site lokal olarak sorunsuz çalışır.

### Faz 5 — Watch Mode & Sürekli Rebuild 🔮

Wiki writeback (context-wiki insan onaylı eklemeler) sonrası site otomatik rebuild. İdeal olarak `context-med wiki watch --rebuild-sites` komutu ile.

### Faz 6 — Shield Entegrasyonu 🔮

`context-shield` olmadan kişisel/hasta verisi içeren notebook'lar build edilemez. `pre-build` aşamasında PII taraması zorunlu; bir eşleşme varsa build durur ve insan kararı beklenir.

---

## 7. Teknik Sınır Kararları (Constraint Log)

Bu kararlar bilinçli olarak alınmıştır; gelecekte revize edilebilir ama şimdilik değiştirilmez:

| Karar | Gerekçe |
|-------|---------|
| Statik HTML çıktısı (SSG) | Hosting bağımsızlığı, güvenlik kolaylığı, SEO iyi, ömürlü |
| Render zamanında LLM çağrısı **yok** | "Extract, never generate" kontratı, tekrarlanabilirlik, offline build |
| Wiki markdown birincil format | context-wiki zaten markdown üretir; dönüşüm katmanı yok |
| Tema = YAML + Jinja/MDX şablon | Beyaz listeden dışarı çıkmayan, deterministik render |
| İçerik Türkçe-birincil, çok-dil opsiyonel | Hedef kitle Türk akademik ekosistemi; context-wiki zaten Türkçe |
| Per-notebook izolasyon | Bir notebook'un build'i diğerini etkileyemez; idempotent |
| Provenance footer zorunlu | Akademik güven; hangi wiki sayfasından türediği görünür olmalı |
| No dynamic features | Form, login, yorum → statik kontratı bozar; gerekiyorsa ayrı modül |

---

## 8. Riskler ve Azaltma Stratejileri

| Risk | Olasılık | Etki | Azaltma |
|------|----------|------|---------|
| Wiki değişikliği sonrası eski sitenin yayında kalması | Yüksek | Orta | Build manifest'inde wiki SHA tutulur; stale banner gösterilir |
| PII sızıntısı (shield yokken public build) | Düşük | Çok Yüksek | Faz 6 öncesi build guard: `shield_required: true` notebook'larda build reddedilir |
| Tema değişikliğinde broken linkler | Orta | Orta | Pre-deploy link checker; CI'da build edilir |
| Wiki çapraz referanslarının site slug'larıyla eşleşmemesi | Orta | Yüksek | `site_planner` aşamasında canonical slug tablosu üretilir; `page_renderer` bunu kullanır |
| Büyük `raw/` asset'lerinin bundle'ı şişirmesi | Orta | Orta | Varsayılan: raw asset link, indirme; `--embed-assets` opsiyonel |
| Tema estetik tutarsızlığı | Orta | Düşük | Faz 3'te minimum 10 referans notebook ile ratchet eval |

---

## 9. Başarı Metrikleri

| Metrik | Hedef |
|--------|-------|
| Wiki → Site build süresi (50 sayfa) | < 30 saniye |
| Broken internal link sayısı | 0 |
| Provenance footer kapsama (sayfa başına) | %100 |
| Aynı wiki + aynı theme → aynı hash (reproducibility) | %100 |
| Tema değişiminde manuel müdahale ihtiyacı | 0 |
| Shield guard yakalama oranı (hedefli PII test seti) | ≥ %99 |

---

## 10. LLM Ajan Rehberi (Bu Dosyayı Kullanan Ajana)

> Bu bölüm, bu IDEA.md'yi bir LLM ajana (Claude Code, Codex vb.) verdiğinizde onun takip etmesi gereken prensipleri açıklar.

**Ne yapılmalı:**
1. Önce context-med `PLAN.md` ve kardeş paket IDEA dosyalarını (`context-wiki`, `context-gate`) oku — kontratlar buradan türer.
2. Her ajan için önce input/output JSON şemasını tanımla, sonra implementasyona geç.
3. `Teknik Sınır Kararları` tablosundaki kararları sorgulamadan uygula; değiştirmek istersen önce kullanıcıya sor.
4. "Extract, never generate" kuralını render hattına gömerek kodla — test edilebilir bir invariant olarak tut.
5. Faz 1 bitmeden Faz 3 veya 4'e atlama; her faz kendi tamamlanma kriteriyle kapanır.

**Ne yapılmamalı:**
- Render sırasında LLM çağrısı koyma. İçerik wiki'de değilse sitede de olmayacak.
- "Daha güzel" bir site yapmak için wiki'de olmayan açıklayıcı metinler ekleme.
- Tek notebook için özel-kodlanmış şablon yazma; her şey `theme.yaml` + wiki sayfa tipine göre kurallanmalı.
- Dinamik özellik (form, login, arama motoru backend) ekleme; statik kontratı bozar.
- `context-shield` hazır değilken hasta verisi içeren notebook'larda build'i çalıştırma.

**Öncelik sırası (şu an):**
1. Faz 1 — `wiki_scanner` + `site_planner` + `page_renderer` ile minimum viable build
2. Örnek notebook ile end-to-end duman testi (Türkçe tez örneği)
3. Faz 2 — `asset_resolver` ile `raw/` referanslarının çözümlenmesi

---

## 11. Bağlantılı Dosyalar

```
context-sites/
├── IDEA.md              ← Bu dosya. Oku, anla, uygula.
├── src/
│   └── context_sites/
│       ├── __init__.py
│       ├── cli.py              ← Typer entry (context-med run sites)
│       ├── scanner.py          ← wiki_scanner
│       ├── planner.py          ← site_planner
│       ├── renderer.py         ← page_renderer
│       ├── assets.py           ← asset_resolver
│       └── packager.py         ← deploy_packager
├── themes/
│   ├── academic.yaml
│   ├── clinic.yaml
│   └── public.yaml
├── templates/                  ← Jinja2 / MDX şablonları
├── tests/
│   └── fixtures/               ← Örnek wiki notebook + beklenen çıktı
└── pyproject.toml
```

Context-med köküyle ilişki:

- Okur: `wiki/<notebook>/`, `raw/<notebook>/`, `configs/*.yaml`
- Yazar: `dist/<notebook>/`, `deploy/<notebook>.zip`
- Bağımlı: `context-med-wiki>=1.0` (wiki kontratı), opsiyonel `@context-med/shield` (Faz 6)

---

## 12. Referans ve İlham

- **Karpathy, A. (2026)** — LLM Wiki: Persisted knowledge base pattern.
  > "The knowledge is compiled once and then kept current, not re-derived on every query."
  context-sites bunu yayın katmanına taşır: wiki bir kez derlenir, site her build'de wiki'den yeniden türetilir; site içinde başka bir bilgi yoktur.

- **Bush, V. (1945)** — Memex: kişisel, küratörlü bilgi havuzu, belgeler arası ilişki ağı.
  context-sites, memex'i kamuya açık yayın katmanına terfi ettirir: kişisel wiki bir lensle (theme + view) dışa görünür hale gelir.

- **bp-autoSite (Cerebra)** — Orijinal auto-site pipeline'ı. Google Maps tabanlı B2B satış hattı için tasarlanmıştı; loosely coupled ajan mimarisi, idempotent pipeline ve "elinde demo ile kapıya git" içgörüsü bu dokümanın mimari iskeletine ilham kaynağıdır. context-sites o desenin akademik/tıbbi yayın ekosistemine uyarlanmış versiyonudur.

- **context-gate** — "Extract, never generate" kontratı buradan miras alınır. Render katmanına dokunuldu mu generative olma yasağı aynı şekilde geçerlidir.

- **context-wiki** — Micro-wiki izolasyonu, provenance disiplini ve writeback döngüsü, site katmanının da bağlı olduğu kaynaktır.

---

*Bu dosya yaşayan bir belgedir. Pipeline evrimleştikçe, yeni faz kararları alındıkça veya teknik kısıtlar değiştikçe güncellenmelidir. Son güncelleme: Nisan 2026.*

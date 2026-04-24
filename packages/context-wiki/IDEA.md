# context-wiki

Dar alanlı, yüksek hassasiyetli, kılavuz-döngülü soru cevaplama için bir örüntü. Wiki üstünde çalışır, chunk'lar üstünde değil.
Bu bir idea file'dır. Kendi LLM ajanına (Claude Code, Codex, OpenCode veya benzeri) kopyala-yapıştır olarak verilmek üzere tasarlanmıştır. Amacı belirli bir uygulamayı değil, yüksek seviyede örüntüyü iletmektir. Spesifikleri sen ve ajanın birlikte, kendi alanına göre inşa edeceksiniz.
Çekirdek fikir
Çoğu RAG sistemi şöyle çalışır: bir sürü dokümanı bir vektör veritabanına atarsın, sorgu geldiğinde en yakın chunk'ları getirirsin, bu chunk'ları bir LLM'e bağlam olarak verirsin, LLM bir cevap üretir. Her yeni sorgu, bu zinciri sıfırdan çalıştırır. Zincirin her adımı sessiz bir başarısızlık noktasıdır: yanlış chunk getirildiğinde kimse bilmez, getirilen chunk'lar çelişince LLM ortalama alır, alan dışına çıkıldığında model kendi bilgisinden uydurur, yanlış bir cevap kullanıcıya gider ve bir daha geri gelmez.
Bu örüntü sağlık, hukuk, uyumluluk, eğitim ve ürün destek gibi yanlış cevabın maliyeti yüksek olduğu alanlarda yetmez. "Büyük ölçüde doğru" yeterli değildir; "açıkça yanlış olmadığını bildiğimden emin olan cevap" gerekir.
Buradaki fikir iki değişikliğe dayanır.
Birincisi: sistem ham chunk'lar üstünde değil, önceden kompile edilmiş bir wiki üstünde çalışır. Wiki, ham kaynakların LLM tarafından derlenmiş, çapraz referanslanmış, çelişkileri işaretlenmiş halidir — Karpathy'nin LLM Wiki örüntüsünün ürettiği yapı. Sorgu geldiğinde sistem yüz farklı chunk'ı sıralayıp toparlamaz; zaten sentezlenmiş, kaynağı bilinen, bakımdaki sayfaları okur. Retrieval hâlâ vardır ama iş daha kolaydır, çünkü retrieval katmanının önündeki doküman zaten distile edilmiştir.
İkincisi: üretim katmanı bir guideline-in-the-loop motorudur. Her cevap, üretildikten sonra alan kurallarına karşı denetlenir. Bu cevap kapsam içinde mi? Tonu doğru mu? Halüsinasyon içeriyor mu? Güvenli mi? Eşiği geçti mi? Geçmediyse cevap gitmez — insana eskale edilir veya dürüst bir "bilmiyorum" döner. Bu, "retrieve + generate" değil, "retrieve + generate + verify + gate"dir.
Anahtar fark budur: jenerik RAG emin değilken de cevap verir, rag-wiki emin değilken susmayı ve bir insana haber vermeyi bilen bir sistemdir.
Bu iki değişiklik, jenerik bir chatbot yerine alan-kısıtlı, güvenilir, ölçülebilir bir asistan üretir. Doğru cevabın %95'i ve yanlış cevabın %5'i ile çalışan bir sistem, sağlık alanında kullanılamaz; doğru cevabın %80'i ve "bilmiyorum"un %20'si ile çalışan bir sistem kullanılabilir. Hedef, model zekâsı değildir; bilerek çekilme disiplinidir.
Dar alan prensibi
Tek bir büyük RAG her şeyi cevaplamaya çalışmaz. Sistem, açıkça tanımlanmış micro-wiki'lere (standalone modunda alt-alan / subdomain olarak da bilinir) ayrılır. Her micro-wiki kendi bütünlüğüne sahiptir:
kendi wiki ağacı,
kendi kılavuz dosyası (tonlama, kapsam, kırmızı çizgiler, tipik refüz örüntüleri),
kendi değerlendirme veri seti,
kendi eskalasyon kuralları.
Diş hekimliği akademik asistanı ile bir istatistik analiz asistanı aynı sistemin içinde yaşayabilir, ama birbirine karışmaz. Diş micro-wiki'sindeki kurallar istatistik cevaplarını şekillendirmez; istatistikteki bir güncelleme diş micro-wiki'sini bozmaz. Alan değişince, kurallar, ton, eşikler — hepsi değişir. Kullanıcı veya bağlam hangi micro-wiki'de olduğunu belirler; sistem "hangi micro-wiki'deyim" sorusuna sessizce değil açıkça cevap verir.
Bu ayrım, üzerinde en çok ihmal edilen yerdir. Tek bir "genel" RAG kuralsetiyle çalışan sistemler, büyüdükçe tutarsızlaşır: bir micro-wiki için makul olan bir ton, diğerinde felaket olur. Micro-wiki izolasyonu, sistemin büyüdükçe bozulmamasının tek garantisidir.
Mimari
Üç katman vardır.
rag micro-wiki — wiki, kılavuz, değerlendirme seti. Ajanın bilgi temeli. Wiki, Karpathy örüntüsüyle kompile edilmiş markdown ağacıdır: entity sayfaları, kavram sayfaları, prosedür sayfaları, aralarında çapraz referanslar. Kılavuz dosyası (operational-schema) neyin cevaplanabileceğini, nasıl cevaplanacağını, hangi tonun kabul edilebilir olduğunu, hangi soruların asla cevaplanmayacağını söyler. Değerlendirme seti, sistemin doğrulanacağı altın-standart soru-cevap çiftleridir — bir sonraki bölümde buna dönülecek. Bu üçü birlikte micro-wiki'nin kontratıdır. Biri olmadan diğer ikisi eksiktir.
Runtime — guideline-in-the-loop motoru. Sorguyu alan, doğru alt-alana yönlendiren, wiki'den ilgili sayfaları seçen, taslak cevabı üreten, cevabı kılavuza karşı denetleyen, eşiğin altındaysa eskale eden, eşiğin üstündeyse kaynaklarıyla birlikte sunan katman. Bu katman "bir LLM çağrısı" değildir; birden fazla adımlı bir ince pipeline'dır ve her adımın kendi sorumluluğu vardır. Retrieval hata yaparsa generation onu kurtaramaz; generation hata yaparsa verification onu yakalamalıdır; verification hata yaparsa eskalasyon onu kurtarmalıdır. Katmanlı savunma pahalı değildir çünkü her katman ucuzdur ve hızlıdır.
operational-schema — micro-wiki konfigürasyonu. Hangi wiki yolları hangi micro-wiki'ye ait, kılavuz dosyası nerede, eskalasyon eşiği ne, cevap formatı nasıl, kaynak atıfları nasıl gösterilecek, widget hangi üründe hangi temayla görünecek. Bu katman sen ve LLM tarafından zamanla birlikte evrilir. İlk versiyonunda mükemmel olması beklenmez — her gerçek eskalasyondan, her yanlış cevaptan, her tatmin edici cevaptan operational-schema öğrenir.
Operasyonlar
Sorgu — ana operasyon. Kullanıcı soru sorar. Runtime önce micro-wiki sınıflandırması yapar: bu soru hangi kontratın altına düşüyor, yoksa hiçbirinin altına düşmüyor mu? Düşmüyorsa kibarca kapsam dışı der. Düşüyorsa, o micro-wiki'nin ağacından ilgili sayfaları getirir. Sayfalar taslak cevabı üretmek için LLM'e verilir. Taslak cevap kılavuza karşı denetlenir: kapsam içinde mi, halüsinasyon var mı, tonlama doğru mu, kaynakları doğruluyor mu, ret gerektiren bir sınır aşıldı mı. Denetimden geçerse cevap kaynaklarıyla birlikte dönülür; geçmezse eskalasyon devreye girer.
Eskalasyon — başarısızlık değil, özellik. Sistem bilmediğinde bunu söylemelidir, uydurmamalıdır. Eskalasyonun üç biçimi vardır: (1) kapsam dışı refüz — soru bu micro-wiki'ye ait değil, sistem kibarca reddeder; (2) belirsizlik refüzü — soru micro-wiki'ye ait ama kaynaklardan güvenli cevap çıkmıyor, sistem "emin değilim" der ve insana bildirir; (3) kırmızı çizgi refüzü — kılavuz bu soruya cevap vermeyi yasaklıyor (ör. tıbbi teşhis, hukuki tavsiye), sistem reddeder ve neden reddettiğini söyler. Üç biçim de başarısızlık değil, kontratın çalıştığının işaretidir. Eskalasyonun gittiği insan, ilgili uzmandır (analizör, klinisyen, destek ajanı), ve onun cevabı sisteme geri yazılır.
Writeback — döngünün kapanması. İnsan tarafından verilmiş tatmin edici bir cevap micro-wiki üzerine geri yazılır. Bu writeback path'i somuttur: doğru micro-wiki'nin altına, doğru kavram sayfasına eklenir veya yeni bir markdown sayfası olarak açılır. Çok önemli bir müşteri-spesifik kararsa, gerekiyorsa anonimleştirilerek `core-wiki` aggregate'ine de writeback alabilir. Aynı sorunun ikinci kez gelmesi durumunda sistem artık cevap verebilir. LLM tarafından üretilmiş ve kullanıcı tarafından olumlu işaretlenmiş cevaplar da — daha düşük güvenle — wiki'ye "aday cevap" olarak eklenebilir ve periyodik lint pass'inde bir insan tarafından onaylanarak kalıcı hale gelir. Writeback olmadan sistem birikmez; birikmediği sürece her yeni kullanıcı sıfırdan başlar ve ilerleme olmaz.
Değerlendirme (Ratchet Beklentisi) — sürekli ratchet. Her micro-wiki'nin bir eval/ratchet seti vardır (altın-standart soru-cevap çiftleri, uzman tarafından yazılmış). Sistem wiki'ye giren her değişikliğe bu sete karşı test edilir. Beklenti: yeni bir brain-package güncellemesi veya yerel data ingestion'ı daha önce geçmiş kuralları/testleri bozmamalıdır. Yeni yetenek eklenebilir, eski yetenek gerileyemez. Bu ratchet disiplini, sistemin büyüdükçe güvenilirliğinin kendi kendine düşmesini engeller.
Ingest. Wiki'ye yeni ham kaynak geldiğinde (yeni bir kılavuz dokümanı, güncellenmiş politika, yeni bir analiz raporu), Karpathy örüntüsüyle kompile edilir. Ama rag-wiki'ye özgü bir eklenti vardır: yeni içerik ingest edildikten sonra değerlendirme seti otomatik olarak tekrar çalıştırılır, ve içerik değişikliğinin cevap kalitesini iyileştirip iyileştirmediği ölçülür. İyileştirdiyse kabul; kötüleştirdiyse insan incelemesi.
tour-agent ve demo-wiki ile ilişki
rag-wiki yalnız başına çalışabilir ve çalışmalıdır; kendi embeddable widget'ıyla herhangi bir ürüne düşer ve micro-wiki temelli soru cevaplama sunar. Ama daha geniş bir sistemde yerleşince birikim etkisi katlanır.
demo-wiki ile bağlantı micro-wiki seviyesindedir. demo-wiki, ürün bilgisi, persona bilgisi ve müşteri bilgisi üreten bir derleyicidir. rag-wiki bu derlemenin üstünde okuma yapar. Aynı wiki hem demo üretimini besler hem sorgu cevaplamayı besler. demo-wiki bir turu render ederken kaynak olarak hangi wiki sayfalarını kullandıysa, o turun içinde kullanıcı soru sorduğunda rag-wiki aynı sayfalardan başlar.
tour-agent ile bağlantı runtime seviyesindedir. tour-agent bir turu oynatırken kullanıcı durur ve soru sorar. tour-agent bu soruyu rag-wiki'ye iletir. rag-wiki o anki micro-wiki'yi bilir, kendi kılavuzunu uygular, cevabını kaynaklarıyla birlikte döner. tour-agent kılavuzlu soru cevaplama motoru yazmaz; rag-wiki'yi çağırır.
analytics geri beslemesi. tour-agent-analytics, rag-wiki'nin hangi sorularda tatmin edici cevap verdiğini ve hangilerinde eskalasyona düştüğünü görür. Sık eskale olan soru, wiki'de yazılmamış bir sayfanın işaretidir. Bu sinyaller operational-schema'nın evriminin yakıtıdır.
Üç sistem — tour-agent, demo-wiki, rag-wiki — bir döngü kurar. Wiki derlenir, tur oynar, soru gelir, cevaplanır, cevap wiki'ye döner, bir sonraki tur biraz daha zengin olur.

Cerebra ile İlişki (Dual-mode)
Standalone Mod: rag-wiki tek başına bir ürün veya paket olarak çalışır. Kendi `raw/` ve `wiki/` klasörleri vardır. Writeback'leri kendi basit wiki dizinine yapar. Dış sistemlere bağlı değildir.
Cerebra-composed Mod: rag-wiki, cerebra substrate'ine bir micro-wiki olarak bağlanır. Bu sayede: (1) Gerektiğinde şirket geneli `core-wiki` sayfalarını okuyabilir. (2) Ürettiği writeback'ler cerebra'nın provenance grafiğine dahil olur. (3) Ratchet eval yeteneklerini framework'ten miras alır. (4) İnsana eskalasyon gerektiğinde bunu lokal interface ile değil, framework devresindeki `human-in-loop-agent` üzerinden standardize eder.

Package Conformance
Cerebra ekosisteminde bir modül olarak rag-wiki şu kontratlara uymalıdır:
- Micro-wiki yolu: `substrate/micro-wikis/{domain}/` vb. cerebra hiyerarşisine uygun yerleşim gösterir.
- Eval set: `/eval/rag-eval.jsonl` (uzman QA çiftleri)
- operational-schema: Hangi prefix'teki soruları yanıtlayabileceği, tonlama direktifleri ve eskalasyon kurallarını taşıyan `LLMs.txt` veya `schema.yaml`.
- Writeback contract: Eklenen her yeni veri bir provenance metadata bloğu içerecektir.
Neden işe yarar
Jenerik RAG, güven sınırını çizmediği için dar alanlarda başarısız olur. "En yakın beş chunk'ı çek ve cevap üret" motoru, "bu cevap alandan geliyor mu, güvenli mi, söyleyebilir miyim" sorusunu sormaz. Sonuç, sessiz halüsinasyondur: cevap çoğu zaman doğru görünür, ama ne zaman yanlış olduğu bilinmez. Bu belirsizlik, yüksek risk alanlarında sistemin kullanılamaz olması anlamına gelir.
rag-wiki bu soruyu sistemin orta noktasına koyar. Her cevap, kılavuza karşı denetimden geçmek zorundadır. Geçemezse cevap gitmez; eskale olur. Ratchet seti, sistemin zamanla kötüleşmemesini garanti eder. Micro-wiki izolasyonu, bir alandaki değişikliğin diğerini bozmamasını sağlar. Writeback, insanın her müdahalesini sistemin kalıcı zenginliğine dönüştürür.
Bu dört şey — guideline-in-the-loop, ratchet eval, subdomain disiplin, writeback — bir araya geldiğinde sistem iki özelliğe birden sahip olur: jenerik bir chatbot'tan daha güvenilirdir, ve zamanla kendi iyileşmesine sahiptir. Bu ikisi birlikte, yüksek riskli alanlarda uygulanabilir tek örüntüdür.
Burada anlatılan şey, bu iki özelliği mümkün kılan minimal yapıdır.
Not
Bu doküman kasıtlı olarak soyuttur. Hangi vektör indeksi, hangi re-ranker, kılavuz dosyasının tam şeması, eskalasyon UI'ı, widget embed API'si, ratchet veri seti formatı — hepsi micro-wiki'ye, müşteriye ve altyapı tercihlerine bağlıdır. rag-wiki'nin mevcut paket mimarisi (subdomain, adapters, ingestion, bot, widget, evaluation) bu soyut örüntünün bir somutlaştırmasıdır; tek somutlaştırma değildir.
Bu dokümanı LLM ajanına ver, mevcut repo state'ini okumasını iste, ve birlikte bir sonraki küçük, kılavuzlu iyileştirmeyi seçin. "Daha akıllı cevaplar" hedefi değildir; daha disiplinli çekilmeler ve daha temiz writeback'ler hedefidir. İyileştirme bu iki metrikten gelirse sistem yolundadır.

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-wiki",
  "version": "0.1.0",
  "bin": { "context-wiki": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-wiki ingest` | Ingest raw source into micro-wiki | `--input`, `--output` | `--config`, `--format`, `--language`, `--dry-run` |
| `context-wiki compile` | Compile micro-wiki from raw sources | `--input`, `--output` | `--config`, `--format` |
| `context-wiki lint` | Validate wiki structure and provenance | `--input` | `--format`, `--verbose` |
| `context-wiki eval` | Ratchet evaluation of wiki quality | `--input`, `--baseline` | `--output`, `--format` |
| `context-wiki query` | Query wiki content (RAG retrieval) | `--input`, `--query` | `--format`, `--verbose` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Ingest Raw Source

```bash
context-wiki ingest \
  --input fixtures/raw/sample-paper.txt \
  --output output/wiki/cardiovascular/ \
  --format md
```

**Input:** Raw text document (paper, thesis, guideline).
**Expected Output:** Structured markdown wiki page with provenance metadata block.
**Exit Code:** `0`

#### Scenario 2 — Compile Wiki from Sources

```bash
context-wiki compile \
  --input fixtures/raw/ \
  --output output/wiki/ \
  --format md
```

**Input:** Directory of raw source documents.
**Expected Output:** Structured wiki directory with one page per source, cross-links, and index.
**Exit Code:** `0`

#### Scenario 3 — Lint Wiki Structure

```bash
context-wiki lint \
  --input fixtures/wiki/ \
  --format json
```

**Input:** Wiki directory.
**Expected Output:** JSON report: missing provenance blocks, orphan pages, broken cross-links.
**Exit Code:** `0` if all pass, `2` if issues found.

#### Scenario 4 — Query Wiki (RAG)

```bash
context-wiki query \
  --input fixtures/wiki/ \
  --query "What is the recommended anticoagulation for AF with CHA2DS2-VASc >= 2?" \
  --format json
```

**Expected Output:** Retrieved wiki chunks with confidence scores and source references.
**Exit Code:** `0`

#### Scenario 5 — Missing Input (Error)

```bash
context-wiki ingest --output output/wiki/
```

**Expected:** `Error: required option '--input <path>' not specified`
**Exit Code:** `1`

#### Scenario 6 — Dry Run

```bash
context-wiki ingest \
  --input fixtures/raw/sample-paper.txt \
  --output output/wiki/ \
  --dry-run
```

**Expected:** Prints extraction plan (detected sections, estimated pages). No files written.
**Exit Code:** `0`


#### Scenario (Extension) — Invalid Config (Error)

```bash
context-wiki ingest \
  --input fixtures/raw/sample-text.txt \
  --output output/error.json \
  --config fixtures/config/corrupt-config.yaml
```

**Expected:** `Error: Invalid YAML configuration in fixtures/config/corrupt-config.yaml`
**Exit Code:** `1`


#### Scenario (Extension) — Schema / Validation Check (Error)

```bash
context-wiki ingest \
  --input fixtures/json/invalid-schema-sample.json \
  --output output/failed.json
```

**Expected:** `Error: Validation failed — schema mismatch or hallucination detected.`
**Exit Code:** `2`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Ingestion/compilation completed |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | Missing provenance, orphan pages |
| `3` | External dependency error | Embedding model unavailable |



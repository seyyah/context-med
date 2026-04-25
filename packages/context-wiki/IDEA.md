code-wiki
Kod tabanlı ajanlar için LLM’lerin etrafına örülen, hafif ama disiplinli bir bilgi katmanı. Amaç, kurumsal hafızayı ve güncel dış bilgiyi tek bir “kod wiki” üzerinden derleyip; halüsinasyonları azaltan, token maliyetini düşüren ve ajanların zamanla kendi kendini geliştirebildiği bir ortam kurmak.

Bu bir idea file’dır. Kendi LLM ajanına (Claude Code, Codex, OpenCode veya benzeri) kopyala–yapıştır verilmek üzere tasarlanmıştır. Belirli bir repo veya teknoloji yığını için değil, yüksek seviyede örüntü için yazılmıştır. Spesifik klasör yapısını, şema formatını ve entegrasyonları sen ve ajanın kendi kod tabanınıza göre inşa edeceksiniz.
Çekirdek fikir
Bugün çoğu kod ajanı üç kaynağa dayanır:
- Modelin kendi parametre içi “bilgisi” (çoğu zaman eski, çoğu zaman eksik).
- Rastgele web aramaları (StackOverflow, blog yazıları, belirsiz kalite).
- Kullanıcının anlık prompt’una manual gömdüğü küçük bağlam parçaları.

Sonuç: ajan güncel dokümantasyondan kopuktur, ekip içi pratikleri bilmez, şirketin “tribal knowledge”’ına ulaşamaz ve her seferinde aynı hatalı pattern’leri yeniden dener. Dış bilgiyle iç bilgi birbirine karışır, neyin standart neyin geçici workaround olduğu belli olmaz.

Buradaki fikir, kod ajanının etrafına Karpathy tarzı kompile edilmiş bir code-wiki koymak:
- Ham kaynaklar (raw) → PDF dokümanlar, resmi dokümanlar, meeting notları, RFC’ler, code cookbook’lar, design doc’lar, ticket yorumları, context7 benzeri güncel dış bilgi snapshot’ları.
- Wiki → bu ham kaynaklardan LLM tarafından derlenmiş, şemalı, hafif bir “kod bilgisi katmanı”: LLMs.txt, design.md, style guide, best practices, anti-pattern listeleri, halüsinasyon guard’ları.
- Autoresearch loop → ajanların belirli aralıklarla dış kaynak ve repo üstünde kendi deneylerini yapıp wiki’yi güncellediği otonom öğrenme beyni.

code-wiki’nin ana iddiası şudur: ajan “her şeyi” bilmek zorunda değildir; neyi nerede arayacağını ve bulduğunu nereye yazacağını bilmelidir. Böylece parametre içi bilgi yalnızca çekirdek temel oluşturur; asıl gerçek ve tribal knowledge code-wiki’de yaşar.
Ne olduğu ve ne olmadığı
Bu ürün bir doc sitesi veya statik wiki generator değildir.
Bu ürün tek başına bir RAG çözümü değildir.
Bu ürün tek başına bir kod arama motoru değildir.

Bu ürün, bu şeylerin üzerine binen ve LLM ajana şu disiplini zorlayan bir katmandır:
- Önce wiki’yi oku, sonra cevap ver.
- Bilmediğinde context7 veya benzeri bir context motoruyla güncel kaynak getir.
- Yaptığın deneyi ve sonucu, insan onayından sonra wiki’ye geri yaz.

Eğer sistem yalnızca “docları embed eden” bir vektör araması haline gelirse, code-wiki amacına ulaşmaz. Farkı; tribal knowledge’i, best practice’leri ve halüsinasyon guard’larını ilk sınıf vatandaş yapmasıdır.
Katmanlar
Raw kaynaklar
Ham, değişmemiş bilgi:
- Resmi dokümantasyon PDF’leri (ör. Tailwind CSS v4 resmi docs).
- External context snapshot’ları: context7 gibi sistemlerin getirdiği güncel, doğrulanmış dış bilgi (API reference, standard değişimi, changelog).
- Meeting notları, ADR’ler, design doc’lar.
- Cookbook repo’ları: sık kullanılan snippet, pattern, template koleksiyonları.
- UI/UX design sistemi, component library dökümanları.
- Eski ticket ve PR tartışmalarından çıkmış önemli karar notları.

Kural basit: Eğer bir metin LLM tarafından yazılmadıysa, özetlenmediyse, parafraze edilmediyse raw’dır. code-wiki bu raw’dan beslenir, raw’ı doğrudan değiştirmez.

code micro-wiki (standalone modda code knowledge base)
LLM tarafından derlenen ve ajan tarafından kullanılan bilgi katmanı. Örnek klasör yapısı:
- LLMs.txt → “LLM’lere talimat” dosyası (operational-schema): neleri yaparsın, yapmazsın, hangi kaynak öncelikli, hangi pattern’lerden kaçınırsın, halüsinasyon guard’ları, yanıt formatları.
- languages/ → dil bazlı rehberler (ts.md, py.md, go.md, rust.md).
- frameworks/ → çatı bazlı best practice’ler (nextjs.md, rails.md, spring.md).
- design/ → design.md, architecture.md, domain-driven notlar, boundary’ler.
- style/ → style-guide.md, code style, naming, folder structure, test konvansiyonları.
- cookbook/ → recipes.md, sık kullanılan snippet’ler, pattern örnekleri.
- tools/ → tailwind.md, docker.md, ci-cd.md, infra notları.
- guards/ → hallucination-guards.md, red-line’lar, “asla uydurma” kısımları, özellikle riskli alanlar.
- experiments/ → autoresearch sonuçları, benchmark’lar, deney raporları.

Bu micro-wiki, hem insan tarafından okunabilir, hem ajan tarafından parse edilebilir minimal markdown ve şema dosyalarından oluşur. Ajan için “birincil bağlam kaynağı”dır.

Autoresearch loop (brain)
Otonom öğrenme ve deney düzeneği:
- Ajan belirli aralıklarla (veya tetikleyici event’lerle) dış kaynak ve repo üstünde küçük deneyler yapar.
- Örneğin: “Tailwind v4’te yeni button API’leri neler?”, “Framework X’in son minor versiyonunda hangi breaking change’ler geldi?”, “Bizim internal component library’de PrimaryButton için örnek pattern’ler neler?”
- Her deney küçük bir script, test veya mikro POC olabilir: run – test – score – log.
- Başarılı ve anlamlı sonuçlar, insan review’undan sonra code-wiki’de ilgili sayfalara işlenir (örneğin tailwind/design.md altına yeni section eklemek).

Autoresearch loop’un amacı modelleri fine-tune etmek değildir; wiki’yi güncel tutmaktır. Böylece ajan, zamanla kendi “kod hafızasını” iyileştiren bir sistemin parçası olur.

Operasyon örneği: Tailwind CSS v4 buton
Senaryo:
Soru: “Tailwind CSS v4 ile bir buton nasıl oluşturulur?”

Akış:
1) Ajan niyeti anlar: bu bir “nasıl yapılır” sorusu, hedef teknoloji Tailwind CSS v4, domain UI komponenti.
2) context7 (veya benzeri) ile dış bağlam: Tailwind v4 resmi doc’tan güncel ve doğru button örneklerini getirir.
3) code-wiki okuma:
   - frameworks/tailwind.md → temel usage.
   - design/tailwind/design.md → ekip içi button design rehberi (renk, spacing, radius, state kuralları).
   - style/style-guide.md → class naming, utility kullanımı, component extraction kuralları.
4) Bir taslak çözüm oluşturur:
   - Örnek buton markup’ı (utility class’lar ekip standardına uygun).
   - Gerekirse @apply veya component extraction örneği.
   - Design.md’de tariflenen loading, disabled, focus state’leriyle uyumlu.
5) Human-in-loop:
   - Geliştirici taslağı kodda dener: run – test – score.
   - Kullanılabilir ve clean ise feedback “good” olarak işaretlenir; eksik varsa veya captcha gibi edge-case’ler varsa not düşülür.
6) Writeback:
   - Eğer bu yeni bir pattern ise, design/tailwind/design.md güncellenir.
   - Olası “common pitfalls” (ör. dark mode, accessibility, responsive) aynı sayfada checklist olarak eklenir.

Bir sonraki ajan veya geliştirici aynı soruyu sorduğunda:
- Ajan önce design/tailwind/design.md’yi okur, oradaki ekip standardını uygular.
- context7 yalnız Tailwind’in dış dünyadaki değişikliklerini (örn. v5 çıktığında) yakalamak için devreye girer.

Avantajlar
Token düşüşü
Ajan her cevapta rastgele web arayıp 20 sayfa doc taşımak zorunda kalmaz. Derlenmiş code-wiki’den sadece ilgili sayfaları okur. Bu:
- Prompt boyutunu küçültür.
- LLM çağrılarını daha deterministik hale getirir.
- “Her soruda sıfırdan context kurma” maliyetini azaltır.

Agent lokomotize olmaz
Ajan, her seferinde “nasıl davranmalıyım” sorusunu parametre içi sezgisine bırakmaz; LLMs.txt ve guards/ dosyalarına bakar:
- Önce code-wiki → sonra dış kaynak.
- Önce ekip style-guide → sonra StackOverflow.
- Önce guard kuralı → sonra “bilmiyorum” deme veya human-in-loop.

Bu, ajanı “lokomotif” hale getirir: hangi rayda gideceği bellidir, hangi istasyonda durup insanı çağıracağı yazılıdır.

Halüsinasyon azalır
- Her cevap wiki’ye veya context7’nin getirdiği doğrulanmış kaynağa referans verir.
- guard dosyaları, özellikle riskli domain’lerde (security, compliance, ödeme, prod config) “asla uydurma” kısımlarını tanımlar.
- Autoresearch loop’tan gelen deneyler, bazı pattern’leri fiilen test eder; sadece teorik bilgiye güvenilmez.

Self-learn agent (self-evolving wiki)
- Ajanın her başarılı çözümü, wiki’de bir iz bırakır (örneğin cookbook/ veya experiments/ altında).
- İnsanlar “bu gerçekten best practice” dedikçe, bu izler design/style sayfalarına taşınır.
- Her yeni geliştirici veya ajan, daha zengin bir code-wiki ile başlar; ekibin tribal knowledge’i kaybolmaz, birikir.

Mimari
Üç katman düşün:
1) Micro-wiki hafızası (raw + code micro-wiki)
2) Runtime (query → wiki + context7 → answer)
3) Autoresearch (otonom deney ve writeback)

Micro-wiki hafızası
- Raw klasörü git ile version’lanır.
- micro-wiki klasörü hem ajan hem insan tarafından yazılır; frontmatter (provenance) ile hangi raw kaynaklardan türediği, tarih, hash, son insan review bilgisi tutulur.
- LLMs.txt ve halüsinasyon guard’ları, tüm kod ajanlarının ortak “contract” dosyasıdır.

Runtime
- Sorguyu sınıflandırır (nasıl yapılır, hata debug, refactor, design question, pattern arayışı).
- Önce ilgili wiki sayfalarını bulur (code-wiki içi retrieval).
- Gerekirse context7 ile dış kaynak getirir; ama bu kaynaklar doğrudan kullanıcıya değil, wiki ile birlikte LLM’e verilir.
- Cevabı üretir; guard kurallarına uyup uymadığını kontrol eder; gerekirse “bilmiyorum / human-in-loop” der.

Autoresearch
- Planlı deneyler dizisi: “haftada bir Tailwind dokümanını değişiklik için tarayıp wiki’yi güncelle”, “yeni framework minor release çıktığında breaking changes bölümünü örnekle”, “kod tabanındaki en çok kullanılan pattern’leri çıkar”.
- Deneyler küçük test dosyaları, script’ler ve skorlar olarak koşturulur; sonuçları experiments/ altında loglanır.
- İnsan, bu log’lardan değerli olanları seçip wiki içine taşır.

Human-in-loop
Code-wiki asla tamamen otonom yazılmaz. İnsan:
- Yeni guard kuralları yazar.
- Kritik design kararlarını design.md’ye yazar.
- Autoresearch sonuçlarını filtreler; yanlış veya riskli önerileri diskalifiye eder.
- Ajanın radikal refactor veya infra değişiklikleri önermesini sınırlayan çerçeveyi tanımlar.

Özellikle:
- Prod güvenlik, data access, compliance ile ilgili pattern’ler için her değişiklik human approval gerektirir.
- code-wiki’nin LLMs.txt dosyası, ekip içi onay olmadan ajan tarafından değiştirilemez.

Cerebra ile İlişki (Dual-mode)
*Standalone Mod:* code-wiki tek başına bir yazılım projesinin dokümantasyon beyni olarak çalışır. LLMs.txt üzerinden o reponun ajanlarını hizalar, sadece kendi kod tabanındaki test ve pratiklerle ilgilenir.
*Cerebra-composed Mod:* Sistem cerebra substrate'ine bağlandığında diğer departmanların wikilerini okuyabilir. Örneğin demo micro-wiki'deki bir gereksinimi veya rag-wiki'den gelen bir müşteri şikayet dizisini (ticket) doğrudan code micro-wiki'deki cookbook sayfaları veya autotests ile eşleştirebilir.

Package Conformance
Cerebra ekosisteminde code-wiki şu kontratları sağlar:
- *Micro-wiki yolu:* substrate/micro-wikis/code/ vb. cerebra hiyerarşisine konumlanır.
- *Eval set:* /eval/code-eval.jsonl (Örn. ajan halüsinatif bir framework uydurmaya çalıştığında reject etmelidir testi)
- *operational-schema:* Ajanların davranışı LLMs.txt formunda standartlaştırılır.
- *Writeback contract:* Başarılı test edilen pattern'lerin ve autoresearch keşiflerinin cookbook/ veya design/ sayfalarına provenance log'ları ile yazılması.

Değerlendirme (Ratchet Beklentisi)
code-wiki için ratchet süreci çok nettir: yasaklı pattern'lerin asla tekrar önerilmemesi ve tribal knowledge testlerinin (eval-set) sürekli geçmesi. Bir anti-pattern test setine eklendikten sonra, ajanların sistem güncellemeleri veya dış kaynak eklemeleri bu yasağı delemez. Eski doğru cevapların kalitesi geriye gidemez.
Bunun yanında her iyileştirmede şu soruları sor:
- Ajanın ürettiği kodun review süresi azaldı mı?
- Aynı tip sorulara verilen cevaplar daha tutarlı hale geldi mi?
- Yeni ekip üyelerinin onboard süresi kısaldı mı? (code-wiki üzerinden öğrenebiliyorlar mı?)
- Halüsinatif, “aslında bizim stack’te olmayan” teknolojilere referanslar azaldı mı?
- context7 gibi dış kaynak çağrıları daha az ama daha isabetli mi?
- Wiki’nin bakım yükü makul mü, yoksa ajan + insan birlikte under/overfitting mi yaşıyor?

Eşit koşullarda daha sade olan kazanır. Her yeni dosya, her yeni şema, her yeni guard, ajanı gerçekten daha güvenilir kılmıyorsa, geri adım at.

Neden işe yarar
Kod ajanları için en büyük risk, bağlamsal cehalettir: projeyi, takımı, tarihçeyi, risk iştahını, kullanılan gerçek stack’i bilmeden çözüm üretmeye çalışmaları. Dış dünya bilgisini modele gömülü kabul etmek ve iç dünyayı sadece prompt’lara bırakmak, hem halüsinasyonu hem token maliyetini patlatır.

code-wiki bu dengeyi tersine çevirir:
- Dış dünya → context7 gibi sistemler üzerinden güncel ve seçici bağlam.
- İç dünya → code-wiki üzerinden sıkılaştırılmış tribal knowledge.
- Ajan → bu iki katman arasında, test edilebilir ve yazılabilir bir kontratla hareket eden yürütücü.

Sonuç, daha küçük prompt’larla, daha az “güya zeki” ama daha güvenilir ve tekrar edilebilir kod ajanlarıdır.

Not
Bu doküman kasıtlı olarak soyuttur. context7 yerine hangi context motoru, hangi dosya formatı (YAML/JSON/MD), hangi repo yapısı, hangi CI entegrasyonu, hangi güvenlik politikaları — hepsi senin ortamına bağlıdır.

Bu idea file’ı LLM ajanına ver, mevcut repo’yu okut, halihazırda var olan dokümantasyon ve tribal notları tarat. Bir sonraki küçük adım olarak tek bir alan seç: örneğin yalnızca “UI/design + Tailwind” için code-wiki’yi instantiate et ve oradan başla. Merkez kaybolursa, genel amaçlı bir kod chatbot’undan farkı kalmaz; merkez korunursa, ajan zamanla ekibin gerçek kod hafızasının parçası olur.
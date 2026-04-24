marketing-agent
Wiki veya rag-wiki üstünde derlenmiş ürün, persona ve kampanya bilgisini kullanarak, pazarlama ekipleri için tekrarlanabilir, ölçülebilir ve insan-in-the-loop çalışan bir pazarlama üretim ajanı örüntüsü. Amaç tek seferlik “kampanya yazdırmak” değil; marka uyumlu, kanala göre ayarlı, performans geri bildirimiyle iyileşen bir marketing çalışma katmanı kurmaktır.

Bu bir idea file’dır. Kendi LLM ajanına (Claude Code, Codex, OpenCode veya benzeri) kopyala-yapıştır vermek üzere tasarlanmıştır. Belirli bir uygulamayı değil, yüksek seviyede örüntüyü iletir. Spesifik metrikler, kanallar, CRM entegrasyonları ve şablonlar sen ve ajanın tarafından, kendi ürününe ve ekibine göre inşa edilecektir.

Çekirdek fikir
Çoğu pazarlama otomasyon yaklaşımı iki uçtadır:
Bir uçta, tamamen elle yazılan kampanyalar vardır. Her yeni launch, her yeni segment, her yeni kanal için içerik, sıfırdan insan emeğiyle üretilir. Persona içgörüleri, value prop’lar ve önceki kampanyalardan öğrenilenler dağınık dosyalarda kaybolur.
Diğer uçta, “tek promptla her şeyi yazan” generatif sihirbazlar vardır. Bunlar hızlıdır ama marka tonu, segment bağlamı, geçmiş kampanya performansı ve yasal/etik sınırları genelde dikkate almaz. Sonuç, jenerik ve güvenilmez içeriktir; ekip en sonunda manuel edit yapmak zorunda kalır.

Buradaki fikir farklıdır: Karpathy tarzı derlenmiş bir marketing wiki (demo-wiki + rag-wiki benzeri) üstüne, pazarlama artefaktlarını sistematik şekilde üreten bir marketing-agent koymak. Ürün özellikleri, persona segmentleri, mesajlaşma sütunları, kampanya geçmişi ve kanal rehberleri wiki’de yaşar; marketing-agent ise bu substrate’den e-posta serileri, ad kopyaları, landing taslakları, sosyal post paketleri, pitch deck outline’ları, nurture akışları ve iç stakeholder özetleri gibi artefaktlar üretir.

Ne olduğu ve ne olmadığı
Bu ürün tek başına bir “AI copywriter” değildir.
Bu ürün ayrı bir CRM veya ESP değildir.
Bu ürün yalnızca bir kampanya planlama aracı değildir.

Bu ürün, mevcut marketing altyapısının (CRM, ESP, ad platformlar, web analytics) üstüne oturan bir strateji + üretim ajandır. Merkezinde şu vardır: doğru persona + doğru teklif + doğru kanal + doğru zaman + doğru ton kombinasyonunu, tekrar tekrar üretilebilir hale getirmek. Araçların (örneğin HubSpot, Braze, Customer.io, Meta Ads, Google Ads) kendilerini değil, bu araçlara giden içerik ve planı optimize eder.

Başarının sade ölçüsü: Yeni bir persona veya ürün için, marka uyumlu ve etkili bir kampanya setini üretmek için gereken insan emeği anlamlı biçimde azaldı mı; buna rağmen kalite ve kontrol kaybolmadı mı?

Mimari
Üç katman vardır.

marketing micro-wiki (standalone modda marketing knowledge base)
Bu katman, marketing ekibinin “belleği”dir.
- Ürün katmanı: ürün/feature sayfaları, value proposition’lar, farklı persona’lara göre fayda haritaları, objection–answer listeleri, proof point’ler, case study özetleri.
- Persona katmanı: segment tanımları, jobs-to-be-done notları, itiraz kalıpları, decision criteria, örnek alıcı profilleri.
- Mesajlaşma katmanı: brand voice kılavuzu, do/don’t listeleri, örnek iyi/bad kopyalar, yasak iddialar (hukuk/uyumluluk), kanal bazlı ton ayarları (LinkedIn vs TikTok vs e-posta).
- Kampanya geçmişi: önceki kampanya özetleri, hangi mesaj/channel kombinasyonlarının iyi çalıştığı, CTR/CR notları, “anti-pattern” kampanya örnekleri.

Bu micro-wiki, insan tarafından tohumlanır ama ajan tarafından sürekli güncellenir. demo-wiki veya rag-wiki ile aynı repo içinde yaşar; sadece marketing’e özgü alt ağaçlar ve kılavuzlara sahiptir.

operational-schema (artifact ve kanal şemaları)
Bu katman, marketing-agent’in hangi artefaktları ürettiğini ve bunların nasıl şekilleneceğini tanımlar.
Her artefakt tipi (ör. “product launch email sequence”, “remarketing ad set”, “persona one-pager”, “feature landing outline”, “sales enablement sheet”) için:
- Girdi: hangi persona segmenti, hangi ürün/feature, hangi hedef (awareness, activation, retention, expansion), hangi kanal(lar).
- Çıktı formatı: markdown, HTML, JSON, deck outline, content package (çoklu kanal paketi).
- Yapı: zorunlu bölümler (ör. subject line, hook, body, CTA, variants), uzunluk sınırları, ton rehberi.
- Risk seviyesi ve human-in-loop kuralı: otomatik mi yayınlanır, örneklem mi review edilir, her seferinde marketing owner onayı mı gerekir.
- Evaluate edilecek metrikler: örneğin subject line için clarity, curiosity, brand fit; claim için kanıt seviyesi; jargon seviyesi.

Schema zamanla gelişir. Başta birkaç core artefakt tipiyle başlarsın; sonra yeni tipler eklersin veya var olanları rafine edersin.

Runtime (marketing-agent motoru)
Görevi:
- Kullanıcı niyetini anlamak (brief / kampanya isteği / tek seferlik içerik talebi).
- Doğru artefakt tipine ve kanala route etmek.
- Wiki’den ilgili sayfa ve bağlamı toplamak.
- Taslak üretmek, varyasyonlar yapmak.
- Brand ve compliance kılavuzlarına karşı lint etmek.
- Gerekiyorsa insana eskale etmek.
- Seçilen output’u kanal sistemlerine entegre olacak şekilde paketlemek.

Bu katman salt “prompt → text” değildir; plan + üretim + kontrol + writeback pipeline’ıdır.

Operasyonlar
Kampanya brieften artefakt setine
Tipik akış:
1) Brief: İnsan kısa bir brief yazar (örn. “Yeni pricing sayfası launch, mevcut müşteriler, retention riskini azalt, self-serve upgrade’i teşvik et, primary kanal: e-posta + in-app banner.”).
2) Niyet sınıflandırma: Runtime bu işin hangi artefakt keluarga’sına girdiğini belirler (ör. “retention email flow + in-app copy paket”).
3) Context assembly: Wiki’den ilgili ürün, persona ve geçmiş kampanya sayfalarını toplar (örn. pricing değişikliği notları, churn itirazları, segmentin en hassas olduğu noktalar, başarılı eski retention e-mailleri).
4) Draft generation: Belirlenmiş schema’ya göre kampanya planı → e-posta serisi taslağı → in-app mesaj taslakları üretilir.
5) Lint: Brand ve legal guideline’larına karşı kontrol; forbidden claim, yasak kelime, yanlış tondaki ifadeler ayıklanır veya bayraklanır.
6) Human review: Risk seviyesine göre marketing owner taslağı onaylar, düzeltir veya reddeder.
7) Publish/export: Onaylanan artefaktlar, ESP/CRM/ad platformu formatına yakın şekilde export edilir (örneğin JSON/CSV/HTML).

Multi-channel paket üretimi
Marketing-agent’in güçlü tarafı, aynı çekirdek mesajı çoklu kanala yayabilmesidir:
- “Base mesaj” önce netleştirilir (offer + proof + CTA).
- Sonra bu çekirdek, farklı kanal şablonlarına yapılır:
  - Email: subject line varyasyonları, preview text, ana body, P.S., segment bazlı tweak’ler.
  - Paid social: kısa, orta, uzun ad copy, headline, primary text, description; farklı creative angle’lar (problem-first, benefit-first, social proof-first).
  - Organic social: seri post önerileri, thread outline’ları, tartışma başlatıcı sorular.
  - Landing: hero copy, subheading, value prop grid, FAQ, microcopy.

Agent, her kanal için ayrı prompt yazmadan, schema’ya göre “bu kanalda ne olması gerektiğini” bilir. İnsan, çekirdek mesajı ve sınırları tanımlar; agent kanal detaylarını doldurur.

Performance feedback ve öğrenme
Marketing-agent tek yönlü üretici kalmamalıdır. Kampanya sonrası:
- Temel metrikler (open rate, CTR, CR, reply rate, unsub rate) analiz edilir.
- micro-wiki’deki ilgili kampanya sayfasına “what worked / what didn’t” notu olarak writeback path formunda işlenir.
- Başarılı subject line pattern’leri, hook türleri, CTA dilleri, segment bazlı nüanslar persona ve mesajlaşma sayfalarına writeback edilir.
- Kötü performans gösteren pattern’ler “avoid” veya “caution” olarak işaretlenir.

Böylece her yeni üretim, sadece model zekasına değil, kolektif kampanya hafızasına dayanır.

Human-in-the-loop
Tüm marketing artefaktları aynı risk seviyesinde değildir:
- Düşük risk: internal notlar, brainstorming listeleri, headline/subject line fikir havuzları, A/B test için ekstra varyantlar.
- Orta risk: nurture e-postaları, blog outline’ları, organic sosyal post taslakları.
- Yüksek risk: pricing değişiklik e-postaları, hukuki implication’ı olan duyurular, resmî kurumsal açıklamalar, compliance-regulated alanlardaki claims.

Schema, her artefakt tipi için hangi review rejiminin geçerli olduğunu açıkça yazar:
- Otomatik → direkt kullanılabilir; sadece örneklem manuel gözden geçirme.
- Onaya tabi → her output marketing owner veya domain uzmanı tarafından onaylanmadan yayınlanamaz.
- Yasak → belirli alanlarda agent sadece öneri seviyesinde çalışır, final metin asla otomatik yayınlanmaz.

Marketing-agent’ın işi, bu rejimi uygulamaktır; “her şeyi yaz, insanlar seçer” yaklaşımı değil.

demo-wiki, rag-wiki ve tour-agent ile ilişki
demo-wiki
- Ürün ve persona katmanları zaten demo-wiki’de tutuluyorsa, marketing-agent tam bu substrate üzerinde çalışır.
- Persona pitch sayfaları, segment aggregate içgörüler ve case study’ler, marketing kopyelerinin ana malzemesidir.
- Aynı persona ve ürün için hem demo turları (tour-agent), hem de marketing kampanyaları (marketing-agent) aynı bilgi çekirdeğinden türetilir.

rag-wiki
- Claim doğrulaması, policy uyumu ve “bunu söyleyebilir miyiz?” soruları için rag-wiki kullanılır.
- Marketing-agent, yüksek riskli claim’leri (örneğin performans vaatleri, regulatory ifadeler) rag-wiki’ye danışarak doğrular; güven yoksa human-in-loop’a escalete eder.
- Kampanyalar sırasında gelen sık sorulan sorular (müşteriden gelen reply/FAQ) rag-wiki’ye writeback edilerek future campaign’lere zemin hazırlar.

tour-agent
- Ürün içi banner, in-app mesajlar ve walkthrough promo’ları için marketing-agent tarafından üretilen kopyeler, tour-agent’ın gösterdiği UI parçalarına bağlanabilir.
- Örneğin yeni bir feature launch’ında: marketing-agent mesajı ve segmentasyon mantığını üretir, tour-agent ise uygulama içi uygun anda ilgili kullanıcıya gösterir.
- tour-agent-analytics’ten gelen “hangi mesaj nerede işe yaradı / tıklandı / görmezden gelindi” sinyali, marketing-agent’in performans hafızasını besler.

Segment ve alt-alan izolasyonu
Tek bir marketing-agent her şeyi aynı ton ve şablonla yazmamalıdır. Alt-alanlar:
- B2B enterprise vs self-serve SaaS vs consumer.
- Regüle alanlar (finans, sağlık, eğitim, hukuk) vs regüle olmayan alanlar.
- Farklı coğrafyalar (TR, EU, US) için farklı hukuki ve kültürel sınırlar.

Her alt-alan:
- Kendi persona ağacına.
- Kendi voice & tone rehberine.
- Kendi red-line ve compliance notlarına.
- Kendi artefakt şablon ve metrik setine sahip olmalıdır.

Bu izolasyon, ajan büyüdükçe “herkese aynı generic tonla konuşma” tuzağına düşmesini engeller.

Cerebra ile İlişki (Dual-mode)
**Standalone Mod:** marketing-agent kendi başına "marketing knowledge base" iyle çalışır. Kampanyalarını lokal veriden okur ve email taslakları üretir.
**Cerebra-composed Mod:** Sistem cerebra substrate'ine bağlandığında `core-wiki` ve `demo micro-wiki`'deki genel ürün/persona bilgisini direkt inherit eder; gereksiz bilgi tekrarları (duplication) önlenir. İnsan onay mekanizmasında (review pipeline) cerebra'nın `human-in-loop-agent` yeteneğini kullanır; örneğin üst düzey bir launch e-maili için satıştaki C-level onayı gerekiyorsa otomatik HITL devreye girer.

Package Conformance
Cerebra ekosisteminde marketing-agent şu kontratları sağlar:
- **Micro-wiki yolu:** `substrate/micro-wikis/marketing/` vb. cerebra hiyerarşisine konumlanır.
- **Eval set:** `/eval/marketing-eval.jsonl` (Yasaklı PR dili testleri, kanıtlanmamış claim rejection testleri)
- **operational-schema:** Kampanya şablonları, content package tipleri (email, social ad).
- **Writeback contract:** A/B test sonuçları (hangi subject line işe yaradı) micro-wiki'ye pattern olarak yazılır.

Değerlendirme (Ratchet Beklentisi)
marketing-agent için ratchet testi uyumluluk (compliance) sigortasıdır. Yasaklanmış kelimeler (örn. "garanti ediyoruz" veya SPAM triggerları) kullanan bir prompt veya mesaj eval-set testlerinden sekmelidir. Model güncellense bile ton ve policy performansı düşemez.
Ayrıca her iyileştirme için şu soruları sor:
- Yeni bir persona veya ürün için kampanyaya başlama süresi kısaldı mı?
- İnsan edit yükü, benzer kalite seviyesi için azaldı mı?
- Brand ve compliance ihlalleri (veya sonradan geri çekilen mesajlar) azaldı mı?
- Başarılı pattern’ler micro-wiki’ye geri yazılıyor ve sonraki üretimlerde hissedilir şekilde kullanılıyor mu?
- Farklı kanallar arasında mesajlaşma tutarlılığı arttı mı (core message aynı, format kanal bazlı değişiyor mu)?
- Ekip ajan çıktısına “bozmak” için değil, “ince ayar yapmak” için mi dokunuyor?

Neden işe yarar
Pazarlamanın pahalı kısmı yaratıcı içgörü değil; aynı içgörünün defalarca farklı persona, segment ve kanala göre yeniden paketlenmesidir. Aynı ürün faydası için email kopyası, landing hero, ad headline, deck slide, sales talk track ve blog introsu tekrar tekrar elle yazılır.

Marketing-agent bu tekrarın büyük kısmını compile problemine çevirir. Bilgi önce wiki’de derlenir. Sonra persona + ürün + kanal + hedef kombinasyonuna göre artefaktlar bu çekirdekten render edilir. Geçmiş performans, brand kılavuzları ve compliance sınırları bu sürecin içine gömülür. İnsan emeği tamamen ortadan kalkmaz; ama değeri yüksek “seçim, yargı ve ince ayar” bölgelerine kayar.

Not
Bu doküman kasıtlı olarak soyuttur. Hangi CRM veya ESP, hangi ad platform SDK’ları, hangi performans metrikleri, hangi persona şeması, hangi hukuk/regülasyon kuralları, hangi dil/ülke kombinasyonları — hepsi senin alanına ve altyapına bağlıdır.

Bu idea file, marketing-agent’in ne yapması ve ne olmaması gerektiği konusunda ajanınla aynı hizaya gelmen için vardır; tek bir implementasyon tarifi değildir. İlk adımda bir veya iki spesifik use-case seç (örneğin: “yeni feature launch email + in-app banner paketi” veya “self-serve trial nurture serisi”) ve ajanla birlikte bunlar için şema + runtime akışını tasarla. Merkez kaybolursa, elinde sadece “daha uzun metin yazan bir chatbot” kalır; merkez korunursa, marketing ekibin zamanla kendini taşıyan bir sistem kurmuş olur.


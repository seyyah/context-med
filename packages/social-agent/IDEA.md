# social-agent

Marka, ürün ve topluluk bilgisini wiki üstünde derleyip; sosyal medya için fikir, içerik paketi, dağıtım, moderasyon ve öğrenme döngüsü üreten bir örüntü. Amaç yalnızca post yazdırmak değil; kanala duyarlı, marka kontrollü, insan denetimli ve performansla iyileşen bir sosyal katman kurmaktır.

Bu bir idea file’dır. Kendi LLM ajanına (Claude Code, Codex, OpenCode veya benzeri) kopyala-yapıştır olarak verilmek üzere tasarlanmıştır. Belirli bir uygulamayı değil, yüksek seviyede örüntüyü iletir. Spesifik platform entegrasyonlarını, metrikleri ve iş akışlarını sen ve ajanın birlikte, kendi markana ve operasyonuna göre inşa edeceksiniz.

# Çekirdek fikir

Çoğu sosyal medya süreci üç problemle yaşar.

1. içerik üretimi dağınıktır. Fikirler bir yerde, takvim başka yerde, marka rehberi başka yerde, geçmiş post performansları başka yerde durur. Ekip her hafta yeniden başlar.

2. platform farkları düzleştirilir. Aynı mesaj LinkedIn, X, Instagram, TikTok, YouTube Shorts ve Reddit’e küçük format değişiklikleriyle kopyalanır; sonuç, hiçbir yere tam ait hissettirmeyen jenerik içeriktir.

3. öğrenme döngüsü zayıftır. Hangi hook işe yaradı, hangi ton geri tepti, hangi CTA yanıt aldı, hangi konu yorum krizine dönüştü — bunlar çoğu zaman sistematik bir hafızaya yazılmaz.

Buradaki fikir farklıdır: sosyal medya operasyonunu, wiki üstünde yaşayan bir bilgi çekirdeği ve onun üstünde çalışan bir social-agent ile ele almak. Wiki, marka sesi, ürün anlatısı, persona segmentleri, içerik sütunları, geçmiş performans içgörüleri, yasak konular, moderasyon politikaları ve platform rehberlerini tutar. Social-agent ise bu çekirdekten ideation, draft, review, scheduling, moderation ve writeback üretir.

Anahtar fark şudur: sıradan bir AI içerik aracı metin üretir; social-agent ise sosyal operasyon yürütür. İçeriği yalnız yazmaz; hangi platform için, hangi amaçla, hangi varyasyonla, hangi risk seviyesiyle, hangi onay rejimi altında, hangi öğrenme döngüsüne geri bağlanarak üretmesi gerektiğini bilir.

# Ne olduğu ve ne olmadığı

Bu ürün sadece “caption generator” değildir.
Bu ürün sadece post scheduler değildir.
Bu ürün sadece sosyal dinleme aracı değildir.
Bu ürün, bu işlevleri birbirine bağlayan bir ajan katmanıdır.

Merkezinde tek bir şey vardır: markanın sosyal yüzünü, ölçeklenebilir ama kontrol edilebilir biçimde işletmek. İçerik üretimi, planlama, yorum yanıtlama, trend izleme, kriz işaretleme ve performans öğrenmesi bu merkeze hizmet eder.

Bu ürün tam otomatik bir bot sürüsü olmak zorunda değildir; hatta çoğu marka için olmamalıdır. Sosyal medya, insan sezgisi, kültürel zamanlama ve itibar riski taşır. Social-agent’ın temel gücü, insanı tamamen dışarı atmak değil; tekrar eden sosyal emeği otomatikleştirirken, riskli kararları doğru yerde insana taşımaktır.

Başarının sade ölçüsü: Bir ekip, daha az operasyonel sürtünmeyle, daha tutarlı ve daha kanala uygun sosyal içerik çıkarabiliyor mu; buna rağmen marka sesi korunuyor ve yanlış içerik riski düşük kalıyor mu?

# Mimari
Üç katman vardır.

Social micro-wiki (standalone modda social knowledge base)
İlk katman, sosyal hafızadır.
Bu katmanda tipik olarak şunlar yaşar:
- marka sesi ve tone-of-voice kılavuzu
- platform bazlı stil notları (LinkedIn daha açıklayıcı, X daha keskin, TikTok daha ilk-3-saniye odaklı, Reddit daha topluluk-duyarlı gibi)
- içerik sütunları (education, product, proof, behind-the-scenes, opinion, community, hiring, event)
- persona ve audience segmentleri
- ürün ve feature anlatıları
- geçmiş iyi/kötü post örnekleri
- yorum ve DM yanıt prensipleri
- yasak konular, hassas ifadeler, hukuki/compliance kırmızı çizgileri
- geçmiş performans özeti ve pattern notları

Bu katman chunk deposu değil, derlenmiş bir micro-wiki'dir. “En yakın birkaç postu getir” yaklaşımı yerine, zaten sentezlenmiş marka hafızası üzerinde çalışılır. Böylece ajan sadece dili değil, marka disiplinini de okur.

operational-schema
İkinci katman, social-agent’ın hangi iş türlerini nasıl yaptığını tanımlar.
Örneğin:
- post idea
- post draft
- multi-post thread
- carousel outline
- short video script
- comment reply suggestion
- DM response draft
- weekly content plan
- campaign burst package
- crisis escalation note
- community summary

Her iş türü için şu şeyler şemada tanımlanır:
- gerekli input’lar
- hedef platform(lar)
- zorunlu yapı (hook, body, CTA, alt-text, hashtag politikası, kaynak referansı)
- ton, uzunluk, emoji ve jargon sınırları
- approval rejimi
- publish formatı
- performans değerlendirme metriği

Bu şema, social-agent’ı “tek promptla her şeyi deneyen” bir araç olmaktan çıkarır. Hangi görevin nasıl yapılacağı açıkça tanımlanır.

Runtime
Üçüncü katman, operasyon motorudur.
Görevi:
- sosyal isteği sınıflandırmak: fikir mi, içerik mi, dağıtım mı, moderasyon mu, analiz mi
- ilgili wiki sayfalarını toplamak
- platforma göre draft veya aksiyon üretmek
- risk ve ton lint’i yapmak
- gerekirse insan onayına göndermek
- onaylı içeriği takvime veya yayın katmanına iletmek
- performansı geri toplayıp wiki’ye yazmak

Bu katman tek bir LLM çağrısı değildir. Tipik olarak stateful, çok adımlı bir pipeline’dır. Social-agent içerik üretimini, yorum yönetimini ve analiz writeback’ini aynı yaşam döngüsünün parçaları olarak görür.

Operasyonlar
İdeation
Sosyal içerik sürecinin ilk ana operasyonu fikir üretimidir. Ama bu rastgele “10 içerik fikri ver” değildir.
Ajan wiki’den içerik sütunlarını, yakın dönem kampanya önceliklerini, platform ritmini, trend/seasonality bağlamını ve geçmişte işe yarayan formatları okur. Sonra fikirleri bunlara göre önerir.
İyi bir social-agent, yalnızca çok fikir üretmez; neden bu fikrin şimdi doğru olduğunu da söyler. Böylece ideation, boş yaratıcı liste değil, operasyonel bir planlama adımı olur.

Planlama
Fikirler seçildikten sonra ajan haftalık veya kampanya bazlı plan üretir.
Burada hedef, “7 gün = 7 post” gibi mekanik bir dağıtım değildir. Hangi gün hangi içerik sütunu, hangi platformda hangi format, hangi CTA ile, hangi kampanyayı destekliyor sorusu cevaplanır.
Social-agent, içerik takvimini marka ve ürün ritmine bağlar: release, webinar, etkinlik, PR duyurusu, kullanıcı hikâyesi, sezonluk konu, trend dalgası.
Planlama katmanı olmadan ajan sadece post üretir; planlama katmanıyla birlikte sosyal stratejinin uzantısına dönüşür.

Draft üretimi
Ajan, seçilen plan için platforma özgü taslaklar üretir.
Aynı çekirdek fikir, her platformda yeniden yazılır; kopyalanmaz.
- LinkedIn için daha açıklayıcı narrative ve profesyonel hook
- X için daha kısa, keskin, belki thread-first yapı
- Instagram için görsel odaklı caption ve carousel frame mantığı
- TikTok/Reels için ilk saniye hook + sahne akışı + overlay text önerileri
- Reddit için topluluk normlarına daha saygılı, satışsız, tartışma odaklı dil

Buradaki kritik ilke: platform adaptation, formatting değil rewriting’dir. Social-agent bunu şema seviyesinde bilir.

Review ve HITL
Sosyal içerik tam otomatik yayın için her zaman uygun değildir. Özellikle opinion içerikleri, güncel olaylara tepki post’ları, kriz anları, hassas sektörlerdeki açıklamalar ve üst düzey yöneticinin hesabından yayınlanan içerikler insan review gerektirir.
Bu yüzden social-agent için human-in-loop rejimi açıkça tanımlanmalıdır:
- düşük risk: evergreen educational posts, iç onaydan geçmiş içerik varyasyonları
- orta risk: kampanya post’ları, yeni feature duyuruları, topluluk sorularına görünür yanıtlar
- yüksek risk: kriz iletişimi, hukuki/medikal/finansal claim içeren mesajlar, kişisel hesap ghostwriting, trend-hijack içerikleri

Ajan, hangi taslağın doğrudan schedule edilebileceğini, hangisinin review kuyruğuna düşeceğini bilmelidir. “Hepsini yaz, insan seçsin” yaklaşımı ilerleme değildir; risk rejimini bilmek ilerlemedir.

Scheduling ve publish handoff
Onaylı içerik, yayın sistemine kontrollü şekilde aktarılır. Social-agent doğrudan publish etmek zorunda değildir; çoğu zaman scheduler veya sosyal yönetim aracı için yapılandırılmış çıktı üretmesi yeterlidir.
Önemli olan şudur: içerik yalnız metin olarak değil, publish-ready paket olarak üretilir.
Bu pakette şunlar bulunabilir:
- final copy
- platform varyasyonu
- görsel brief veya asset referansı
- alt-text
- suggested publish window
- campaign tag
- approval metadata
- tracking notes

Moderation ve yorum yanıtı
Social-agent yalnız içerik üretmez; canlı sosyal yüzeyleri de okuyabilir.
Yorumlar, mention’lar ve DMer için üç görev yapabilir:
- sınıflandırma: soru, övgü, şikâyet, troll, kriz sinyali, satış fırsatı, destek talebi
- taslak yanıt: marka tonu ile cevap önerisi
- escalation: destek ekibi, PR, legal veya insan community manager’a yönlendirme

Bu alan özellikle hassastır. Tam otomatik yanıt çoğu marka için risklidir. Bu yüzden moderasyon tarafı genellikle “draft + recommend + escalate” modeliyle başlamalıdır. Ajanın erken görevi, insanı tamamen değiştirmek değil, community manager’ın dikkatini doğru yere çekmektir.

Social listening ve trend farkındalığı
Ajan; marka mention’larını, sektör konuşmalarını, rakip temalarını ve yükselen konu kalıplarını izleyebilir. Ama burada amaç yalnız “trend bulmak” değildir.
İyi social-agent, trendin markaya uygun olup olmadığını tartar. Her trend’e atlamak yerine, şu soruyu sorar: bu konu bizim sesimize, ürünümüze ve topluluk beklentimize uygun mu? Uygun değilse, trendi görmek başka, katılmak başka şeydir.
Bu disiplin, markayı “görünür olmak için her şeye atlayan hesap” olmaktan korur.

Writeback ve öğrenme döngüsü
Social-agent’ın esas değeri burada büyür.
Yayın sonrası metrikler ve nitel sinyaller toplanır:
- impressions, reach, saves, shares, comments, CTR, completion rate
- olumlu/olumsuz duygu işaretleri
- hangi hook’lar ilk satırda daha iyi çalıştı
- hangi içerik sütunları yorgunlaştı
- hangi CTA’lar yanıt aldı
- hangi platformda aynı fikir başka performans verdi

Writeback contract uyarınca bu sinyaller tekrar kalıcı hafızaya (micro-wiki'nin performans loglarına ve ilgili persona sayfalarına) geri yazılır. Ama ham metrik dump’ı olarak değil; pattern notu olarak.
Örneğin:
- “Kurucu perspektifli LinkedIn post’ları ürün duyurularından daha çok yorum çekiyor.”
- “Instagram carousel’lerinde ‘3 mistake’ framing’i son 6 haftadır düşüyor.”
- “Topluluk odaklı Reddit post’larında doğrudan CTA geri tepiyor.”

Writeback olmadan sistem yalnız hız kazanır; writeback ile birlikte kalite biriktirir.

İçerik aileleri
Social-agent tek tip çıktı üretmez. Aynı substrate’den şu aileler çıkabilir:
- günlük/haftalık post fikirleri
- multi-platform content package
- thread / carousel / reel script
- launch burst seti
- webinar/event promo zinciri
- community recap
- founder ghostwriting draft’ları
- comment/DM response pack
- influencer outreach short draft’ları
- trend reaction recommendation note
- crisis response holding statement draft

Buradaki nokta, sosyal operasyonun yalnız “tekil post” olmadığını kabul etmektir. Social-agent bir içerik fabrikası değil; sosyal yüzeyi yöneten paket üreticisidir.

marketing-agent ile ilişki
marketing-agent daha geniş pazarlama bağlamında çalışır: kampanya, funnel, nurture, landing, email, ad setleri.
Social-agent ise bunun sosyal yüzeydeki uzmanlaşmış uzantısıdır.
Marketing-agent çekirdek kampanya mesajını tanımlayabilir.
Social-agent aynı mesajı sosyal platformlara özgü ritim ve normlarla parçalar, dağıtır ve öğrenir.
Bu ayrım önemlidir: sosyal platformlar yalnızca küçük reklam yüzeyleri değildir; her birinin kendi kültürü vardır.

rag-wiki ile ilişki
Social-agent, marka ve ürün hakkında güvenli cevap vermek gerektiğinde rag-wiki’yi çağırabilir.
Örneğin bir kullanıcı yorumda karmaşık bir ürün sorusu sorduğunda veya hassas claim isteyen bir konu açıldığında, ajan kendi hafızasından uydurmaz; wiki’den doğrulama alır. Güven yoksa escalation yapar.
Bu, özellikle yorum yanıtları ve community moderation tarafında kritiktir.

demo-wiki ve tour-agent ile ilişki
demo-wiki’den çıkan persona ve value prop katmanı, sosyal anlatının hammaddesidir. Belirli bir persona için hazırlanan demo dili, sosyal post serilerine dönüşebilir.
Tour-agent ise sosyalden gelen kullanıcıyı ürün içi deneyime bağlayan komşu sistem olabilir. Social-agent bir launch thread’i üretir; kullanıcı ürün içine geldiğinde tour-agent ilgili onboarding veya feature tour’u çalıştırır. Böylece sosyal anlatı ile ürün içi deneyim arasında kopukluk azalır.

Cerebra ile İlişki (Dual-mode)
**Standalone Mod:** social-agent kendi başına "social knowledge base" iyle çalışır. Kendi `raw/` ve `wiki/` klasörlerine sahiptir. Yalnızca kendi metriklerini görür, dışarıyla etkileşmez. 
**Cerebra-composed Mod:** Sistem cerebra substrate'ine bağlandığında güçlü bir "interaction surface" ve "brain package" hibriti halini alır. `core-wiki` ve `demo micro-wiki` katmanlarını doğrudan bağlam olarak inherit edebilir; ürün bilgisini tekrar öğretmek gerekmez. İnsan onay mekanizmasında (review pipeline) cerebra'nın `human-in-loop-agent` audit trail sistemini kullanabilir.

Package Conformance
Cerebra ekosisteminde social-agent şu kontratları sağlar:
- **Micro-wiki yolu:** `substrate/micro-wikis/social/` vb. cerebra hiyerarşisine yerleşir.
- **Eval set:** `/eval/social-eval.jsonl` (Riskli ton/içerikler karşısında ajanın reject/escalate edebilmesini ölçen assert datası)
- **operational-schema:** Otonom yayın eşikleri, takvim kısıtları, task tipleri (ideation, draft, reply).
- **Writeback contract:** Analytics sinyali ve kriz review kararları anonim pattern'ler olarak wiki'ye metadata (provenance) ile yazılır.

Çoklu marka, çoklu hesap ve izolasyon
Eğer aynı sistem birden fazla marka, müşteri veya bölgesel hesap yönetiyorsa, izolasyon kritik hale gelir.
Bir markanın sosyal hafızası diğerine karışmamalıdır.
Aynı marka içinde TR ve EN hesapları bile aynı ton, aynı mizah, aynı risk sınırıyla yönetilmemelidir.
Bu yüzden izolasyon şuralarda fiziksel veya mantıksal olarak uygulanmalıdır:
- ayrı wiki alt-ağaçları
- ayrı blocked-topics dosyaları
- ayrı approval policy’leri
- ayrı platform rehberleri
- ayrı performans writeback’leri

İzolasyon LLM’in “dikkatli davranmasına” bırakılamaz. Schema ve erişim sınırlarıyla uygulanmalıdır.

Değerlendirme (Ratchet Beklentisi)
Social-agent için de sıkı bir ratchet seti olmalıdır. Yanlış tonda atılan bir tweet veya kriz anında girilen otomatik bir post ağır risklidir. Ratchet testleri metnin ne kadar "yaratıcı" olduğunu değil, kırmızı çizgilerin ihlal edilip edilmediğini doğrulamalıdır. Yeni yetenek eklendiğinde eski testler bozulmamalıdır.
Bunun yanında, her değişiklikte şu soruları sor:
İçerik üretim süresi gerçekten kısaldı mı?
Platforma özgü kalite arttı mı, yoksa her yerde aynı hissi veren jenerik kopya mı çoğaldı?
Marka sesi daha tutarlı hale geldi mi?
İnsan review yükü doğru yerlere mi yoğunlaştı?
Kriz veya yanlış ton riski azaldı mı?
Geçmiş performanstan öğrenilen pattern’ler sonraki içeriklerde gerçekten hissediliyor mu?
Ajan yalnız daha çok post mu üretiyor, yoksa daha doğru sosyal operasyon mu yürütüyor?

Eşit koşullarda daha sade olan kazanır. Beş platform için yüzlerce otomasyon eklemek ilerleme değildir; iki platformda gerçekten iyi çalışan, güvenli ve öğrenen bir akış kurmak ilerlemedir.

Neden işe yarar
Sosyal medya ekiplerinin pahalı kısmı yazmak değildir; her gün aynı bağlamı yeniden kurmak, her platform için yeniden düşünmek, her yorumun önemini tekrar tartmak ve her kampanyadan sonra öğrenilenleri sistematik biçimde saklayamamaktır.
Social-agent bu tekrarı bir compile ve operasyon problemine çevirir. Bağlam wiki’de birikir. Platform farkları şemaya yazılır. Performans sinyalleri writeback ile kalıcılaşır. İnsan enerjisi, rutin içerik taşımaktan çıkıp yaratıcı yargı, kültürel sezgi ve kriz yönetimi gibi gerçekten insan işi olan alanlara kayar.

Burada anlatılan şey, bu iş bölümünü mümkün kılan minimal örüntüdür.

Not
Bu doküman kasıtlı olarak soyuttur. Hangi sosyal platform API’ları, hangi scheduler, hangi moderation araçları, hangi metrik şeması, hangi asset pipeline, hangi bölgesel compliance sınırları — bunların hepsi senin altyapına, sektörüne ve risk modeline bağlıdır.
Bu idea file, social-agent’ın ne yapması gerektiğini ve ne olmaması gerektiğini hizalamak içindir; tek bir uygulama reçetesi vermek için değil.

Bu dokümanı LLM ajanına ver, mevcut repo state’ini okumasını iste ve birlikte ilk küçük ama gerçek sosyal akışı seçin. Örneğin yalnızca LinkedIn + X için haftalık plan ve draft üretimiyle başlayın; sonra moderation ve writeback’i ekleyin. Merkez kaybolursa elinde sadece çok yazan bir post botu kalır. Merkez korunursa, zamanla markanın sosyal hafızası ve operasyon katmanı birlikte güçlenir.


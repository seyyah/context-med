# cofounder-office

Solopreneur'ün tek kişilik ekibini; distile edilmiş persona-brain'lerden oluşan, rol-bazlı koordine çalışan, cerebra substrate'i üstünde birikim üreten bir sanal ofis örüntüsüne dönüştüren brain-package.

Bu bir idea file'dır. Kendi LLM ajanına (Claude Code, Codex, OpenCode veya benzeri) kopyala-yapıştır olarak verilmek üzere tasarlanmıştır. Belirli bir uygulamayı değil, yüksek seviyede örüntüyü iletir. Spesifik rolleri, görev tiplerini ve persona kaynaklarını sen ve ajanın birlikte, kendi işine ve ekip hayaline göre inşa edeceksiniz.

## Çekirdek fikir

Solopreneur'ün gizli yükü kod yazmak veya pazarlama yapmak değildir; **aynı anda bütün rolleri oynamak** zorunda olmasıdır. Kurucu, PM, geliştirici, reviewer, muhasebeci, hukuk danışmanı, içerik editörü — hepsi tek kafanın içinde sıkışır. Sabah "müşteri görüşmesine hazırlanan PM"; öğleden sonra "PRD yazan ürüncü"; gece "vergi hesaplayan muhasebeci" olması gerekir. Bu rol değiştirme yorgunluğu, iş kaybından çok daha fazla enerji tüketir.

Buradaki fikir şudur: bu rolleri tek kafadan çıkarıp, her biri kendi kişiliğine, ifade tarzına, karar örüntüsüne ve uzmanlık alanına sahip olan **distile persona-brain'lere** dağıt. Sonra bu persona'ları bir **sanal ofis** içinde koordine et — kimi kime rapor verir, kim hangi görevi alır, hangi cron tetiği hangi role uyanma vakti söyler, hangi onay kimin elinden geçer. Ofisin bütünü cerebra substrate'i üstünde oturur: her persona'nın kararı provenance ile işaretli kalır, her artifact doğru micro-wiki'ye writeback edilir, her karar ratchet harness'ıyla test edilir.

Anahtar fark şudur: bu bir "çoklu chatbot" değildir. Bir generic AI asistan "PM gibi davran" dediğinde role-play yapar — ertesi gün aynı davranışı üretmez, aynı terminolojiyi tutmaz, geçmiş kararları hatırlamaz. Distile persona ise sürekli kendine benzer kalır, aynı sözlüğü kullanır, geçmiş kararlarını okur ve kendi karar örüntüsünü dayatır. Ofis ise bu persona'ların sıradan bir chat'te değil, **cerebra runtime'ın orchestration'ı** altında konuşmasını sağlar — task kuyrukları, mesaj kanalları, bağımlılık zincirleri, HITL checkpoint'leri.

## Ne olduğu ve ne olmadığı

Bu ürün bir chatbot kümesi değildir. Bir AI kişilik simülatörü değildir. Bir Slack klonu değildir. Bir proje yönetim aracı değildir. Tek başına bir "AI cofounder" vaatli SaaS değildir.

Bu ürün, cerebra ekosistemi içinde oturan bir **brain-package**'dir. İki farklı gücü tek yapıda birleştirir: (1) bir insanı — kullanıcının kendisi, bir mentor, sektörden bir uzman veya public figure — distile ederek **persona-brain** üretmek, ve (2) bu persona'ları rol-bazlı, koordine çalışan sanal bir ofiste birlikte işletmek.

Merkezinde tek bir soru vardır: **solopreneur, üstlendiği onlarca rolü tek kafada taşımadan, ama yine de tutarlı ve birikimli biçimde nasıl yürütebilir?** Bu soruya cevap hem content üretmekten hem de task koordinasyonundan daha geniştir; rolün kendisinin kalıcı hale getirilmesi ve o rolün zaman içinde kendi aklıyla tutarlı kalmasıdır.

Bu ürün tam otomatik bir AI ekibi olmak zorunda değildir; olmamalıdır da. Insan sezgisi, değer yargısı ve kritik kararların sahibi kullanıcıdır. Sanal ofisin temel gücü, insanı devreden çıkarmak değil; tekrar eden rol işçiliğini (PRD taslağı, standup özeti, review checklist, onboarding senaryosu) otomatikleştirirken kritik kararları doğru checkpoint'te insana iletmektir.

## Mimari

Üç katman vardır.

**Persona micro-wiki (standalone modda persona skill).** Bu katman bir insanın distile hafızasıdır. İki alt katmana ayrılır: **Persona** (kişilik DNA'sı — ifade tarzı, karar örüntüleri, mental model'ler, çelişkiler, dürüst sınırlar) ve **Work** (uzmanlık katmanı — sorumlu olduğu alan, çalışma akışı, çıktı tercihleri, experience knowledge base). Bu ikiz yapı kullanıcıya bir şey daha söyler: persona'nın "dili ve duruşu" onun "yaptığı iş"inden ayrı distile edilir. Aynı muhasebe bilgisi, INTJ titiz bir baş muhasebeci ile ENFP rahat bir dış danışman tarafından tamamen farklı biçimde sunulur.

Persona micro-wiki'sinin içinde tipik olarak şunlar bulunur:
- 6 katmanlı persona yapısı: hard rules → kimlik → ifade DNA'sı → karar heuristic'leri → kişilerarası davranış → correction layer
- Work katmanı: uzmanlık alanı tanımı, tipik görev tipleri, standart çıktı kalıpları, kırmızı çizgiler
- Mental models ve karar heuristic'leri (özellikle celebrity/mentor persona'ları için)
- Expression DNA (kullandığı kelimeler, bıraktığı kelimeler, ton örnekleri)
- Contradictions ve honest boundaries (çelişkileri ve bilmediği alanlar)
- Correction log: kullanıcının "o böyle demez, böyle der" düzeltmelerinin kümülatif kaydı

**Office operational-schema.** İkinci katman, ofisin nasıl bir ekip olduğunu tanımlar. Hangi persona hangi rolü oynar, kim kime rapor verir, hangi cron tetiği hangi persona'yı uyandırır, hangi kanal hangi iletişim için açıktır, hangi task tipi hangi persona'ya giden default atamadır. Rails'in `config/brains.rb` routing DSL'sinin office versiyonu gibi düşünülebilir — declarative, validated, reload edilebilir.

Örnek kontrat içeriği:
- **roster**: personaların ve rollerinin listesi (pm: founder-persona, legal: hukuk-danışmanı-persona, coder: self-persona, reviewer: mentor-persona)
- **hierarchy**: reports_to ilişkileri (coder → pm, reviewer → pm, legal → founder doğrudan kullanıcıya)
- **channels**: named kanallar ve üyeleri (#general, #decisions, #incidents)
- **cron**: zamanlı tetikler (Pazartesi 09:00 → pm → "haftalık plan tazele"; her 4 saatte bir → growth-persona → "sosyal sinyal tara")
- **task policies**: task tiplerinin default atama kuralları, öncelik sınıfları, HITL risk sınıfları
- **permissions**: hangi persona hangi brain'i okuyup yazabilir (legal → accounting okuyamaz, ama compliance okuyabilir gibi)

**Office runtime.** Üçüncü katman, operasyon motorudur. Görevi persona'ların mesaj kuyruklarını sürmek, task'ların bağımlılık zincirini çözmek, cron tetikleyicilerini izlemek, kanal mesajlarını dağıtmak, HITL checkpoint'lerini policy engine'e yönlendirmek, her persona'nın output'unu doğru writeback hedefine yazmak. Runtime her persona'nın bir cerebra brain instance'ı olduğunu bilir; mesajları, task'ları ve cron fire'ları o brain'in input'una yönlendirir.

Runtime ayrıca üç güvenlik disiplini taşır:
- **Persona izolasyonu**: her persona kendi micro-wiki'sinden okur; başka persona'nın wiki'sine ancak ofis schema'sının izin verdiği ölçüde erişir.
- **Rol disiplini**: bir persona rolü dışına çıkmaya çalıştığında (hukuk persona'sı kod yazmaya niyetlendiğinde) runtime işlemi HITL checkpoint'ine yükseltir.
- **Writeback scope disiplini**: her task'ın sonucu, ofis schema'sının tanımladığı writeback hedefine yazılır — ya persona'nın kendi micro-wiki'sine, ya ortak #decisions wiki'sine, ya da core-wiki'ye.

## Primitive'ler

**Notification Hook Bridge.** Sanal ofisin dış dünyayla (WhatsApp, Slack, Telegram vb.) API anahtarlarına gerek duymadan işletim sistemi seviyesindeki bildirimler üzerinden haberleşmesini sağlayan duyusal (sensory) arayüz. Gelen mesajları yakalar, önbelleğe alır ve çıktıyı OS "Hızlı Yanıt" (Quick Reply) mekanizmalarına geri besler. (Bu özellik Dijital İkiz projesinin yeteneklerinin Sanal Ofis'e kazandırılmasıdır).

**Persona skill.** Bir insanı distile eden iki-katmanlı paket: persona + work. Standalone modda tek başına bir .skill olarak çalışır; cerebra-composed modda bir persona micro-wiki'sine dönüşür.

**Role.** Ofisteki işlevsel konum: pm, coder, reviewer, legal, accountant, growth, support. Rol, persona'dan ayrıdır — aynı role iki farklı persona atanabilir (A/B testi, gölge review), aynı persona iki rolü üstlenebilir (solopreneur'ün birden çok şapkası).

**Assignment.** Bir persona'nın bir role bağlanması. `coder: self-persona` gibi. Reassign edilebilir. Bir rol tamamen boş da bırakılabilir — runtime o rolü user'a yönlendirir.

**Task.** Kanban stili görev: waiting → todo → in_progress → done/failed. `title`, `description`, `assignee` (rol adı, persona değil), `dependsOn`, `priority` alanlarını taşır. Task tamamlandığında result field'ı doğru writeback scope'una yazılır.

**Channel.** Named, üyeli mesaj kanalı: #decisions, #incidents, #customer-calls. Kanala yazılan mesajlar üye persona'ların inbox'ına düşer. Kanal geçmişi otomatik olarak ilgili micro-wiki'ye writeback edilir — bu, bir kanalın zaman içinde canlı bir karar defterine dönüşmesini sağlar.

**Cron fire.** Zamanlı tetik: ofis veya rol seviyesinde tanımlanabilir. Fire, bir veya birden fazla chained task üretir. Her fire CRITICAL priority taşır ve catch-up politikası (`skip` veya `once`) schema'da tanımlanır.

**Inbox.** Her persona'nın queue'su. Task bildirimleri, mesajlar, cron fire'lar, HITL geri dönüşleri hepsi inbox'a düşer. Runtime tick-bazlı çalışır: her tick bir persona'ya sırası gelir, inbox'tan tek bir item drain edilir, persona o prompt'la çalıştırılır.

**Provenance trail.** Her task'ın, her kararın, her mesajın hangi persona'dan geldiği, hangi raw'dan türediği, hangi writeback hedefine yazıldığı izlenebilir. Office audit log'u cerebra'nın provenance graph'ının bir parçasıdır.

## Cerebra ile İlişki (Dual-mode)

**Standalone mod.** Tek bir persona skill'i. Kullanıcı bir karakteri (kendisi, bir mentor, bir public figure) distile etmek ister — sadece o persona paketini oluşturur, bir .skill olarak host'ına (Claude Code, OpenCode vb.) kurar ve kullanır. Cerebra gerekmez. Standalone modda:
- Persona ve Work iki ayrı markdown dosyasında yaşar.
- Ingest tek seferlik: dosya yükle, görüşme kaydı ekle, web araştırma sonuçları ver.
- Writeback yalnızca persona'nın kendi correction log'una — yani "user dedi ki o böyle demez" düzeltmeleri local olarak birikir.
- Orkestrasyon yok; tek karakter, tek konuşma.

**Cerebra-composed mod.** Birden fazla persona + office schema + cerebra runtime. Burada persona skill'leri birer **persona micro-wiki** olarak cerebra substrate'i içinde yaşar. Office schema cerebra'nın routing DSL'i içinde declare edilir. Runtime ise cerebra'nın kendi scheduler/message-bus altyapısı üstünde çalışır. Cerebra-composed modda:
- Persona'lar core-wiki'yi okuyabilir — şirketin müşteri listesi, ürün anlatısı, iş modeli ortak zemindir.
- Persona'lar başka brain'lerle konuşabilir — PM persona'sı accounting brain'e "bu ay nakit akışı ne" diye sorabilir, legal persona'sı compliance brain'e başvurabilir.
- Task sonuçları doğru writeback hedefine yazılır: bir kampanya taslağı marketing micro-wiki'sine, bir hukuk memo'su legal micro-wiki'sine, bir PRD taslağı core-wiki'ye.
- Cron tetikler gerçek operasyonel ritim üretir: haftalık standup, günlük müşteri iletişimi taraması, aylık finansal review.
- HITL engine checkpoint'leri policy engine'den geçirir — yüksek riskli kararlarda (bir sözleşme imzası, bir public tweet) kullanıcı onayı zorunlu kılınır.
- Lint ve eval ratchet harness ofisin tüm persona'larına uygulanır: persona bir görev üretir, eval set o görevin persona'ya sadık olup olmadığını ölçer, önceki sürümlerde geçen testler sessizce bozulamaz.

Bu dual-mode, iki adoption pattern'ini eşzamanlı mümkün kılar: "ben sadece bir mentor skill istiyorum" diyen kullanıcı standalone modda yaşar; "tek başıma çalışan solopreneur'üm, sanal bir ekibe ihtiyacım var" diyen kullanıcı cerebra-composed moda geçer. İkisi aynı persona kontratını paylaşır.

## Package Conformance

Cerebra-composed modda cofounder-office'in sağlaması gereken minimal kontrat:

- **Tip**: `brain-package` (persona tarafında) + `runtime-capability` (office orchestration tarafında). Çift tipli modüldür.
- **Micro-wiki yolu**: her persona `brains/personas/{persona_slug}/`, ofis şeması `brains/cofounder-office/config/office.yml`.
- **Reads from**: `core-wiki/*`, `brains/accounting/*`, `brains/legal/*`, `brains/social/*`, `brains/code-wiki/*` (office schema tarafından whitelist edilmiş).
- **Writes to**: `brains/personas/{slug}/correction/`, `brains/cofounder-office/decisions/`, `core-wiki/decisions/` (HITL onaylıysa).
- **Operations**: `ingest` (persona distilasyonu), `query` (role-based task routing), `compile` (office summaries, weekly digests), `writeback` (task sonuçları), `evaluate` (persona sadakat testleri), plus cron orchestration.
- **Artifact schemas**: `weekly-digest`, `standup-summary`, `decision-memo`, `persona-correction-log`.
- **Eval set**: her persona için bir known-answer suite (persona bu cevabı vermeli mi vermemeli mi) + voice check (persona bu ses tonunu tutuyor mu) + boundary check (persona kendi bilgi sınırını kabul ediyor mu).
- **HITL policy**: `policy.risk_class: high` olan task'lar (dışa gönderim, resmi belge, finansal işlem) otomatik checkpoint alır. `policy.hitl: always` olan persona rolleri her çıktıda onay ister.
- **Isolation**: persona'lar arası görünürlük office schema ile kısıtlı. `disclose_secrets: false` default; persona'ya verilen secret'lar sadece authenticated_fetch benzeri kanaldan geçer.

## Primitive tipleri ve kullanım örnekleri

Tipik bir solopreneur ofisi şöyle görünür:

| Rol | Persona kaynağı | Birincil brain okur | Tipik cron tetiği |
|-----|-----------------|---------------------|-------------------|
| founder | self-persona (kullanıcının kendisi distile) | core-wiki, hepsi | pazartesi 08:00 → haftalık plan |
| pm | productivity-mentor persona (örn. Shreyas Doshi) | core-wiki, social | cuma 17:00 → hafta özeti |
| legal | startup-lawyer persona | legal-brain | ayda bir → compliance check |
| accountant | micro-smb-accountant persona | accounting-brain | ayın 1'i → aylık kapanış |
| growth | growth-coach persona | social, marketing | günde 2 → sinyal taraması |
| coder | self-persona (kod bağlamı) | code-wiki | commit trigger → review |

Persona kaynakları üç kategoride akar (colleague-skill ekosistemiyle uyumlu):
- **Self personas**: kullanıcının kendi chat log'u, dokümanları, karar notları → kullanıcı kendi düşünme örüntüsünü distile eder.
- **Mentor/advisor personas**: kullanıcının danışman ilişkisi kurduğu kişilerin izniyle toplanan materyal → "ben bu konuda danışmanıma ne sorardım" sorusunu simüle eder.
- **Celebrity/public figure personas**: kitap, uzun röportaj, ders kayıtları, public karar izleri → "bu durumda X ne yapardı" sorusunu araştırma disiplini ile üretir (dot-skill celebrity pipeline'ı gibi: 6 boyutlu araştırma, kaynak hiyerarşisi, primary source oranı, source blacklist).

## Örnek akış

Kullanıcı toplantıda sessizdeyken, Slack veya WhatsApp üzerinden önemli bir iş arkadaşı/müşteriden mesaj düşer: "Yeni feature'daki veri gizliliği şemasını hemen netleştirebilir miyiz?"

1. **Notification Hook Bridge** mesajı Android/OS API üzerinden sessizce yakalar ve Inbox kuyruğuna atar.
2. Runtime mesajı otonom okur ve içeriğin kritikliği nedeniyle `pm` rolüne yönlendirir.
3. `pm` persona (kullanıcının kendi distilesi) ingest talebi üretir; görüşmeyi bağlamlandırır.
4. `pm` karar almak için hızlı bir çoklu-ajan müzakeresi (Council Deliberation) başlatır:
   - `legal` persona'ya: "Bu feature talebi GDPR açısından uyum riski taşıyor mu?"
   - `coder` persona'ya: "Veritabanına bu gizlilik şemasını eklemenin eforu nedir?"
5. Her persona kendi micro-wiki'sini okur, kendi kararını üretir ve sentezlenmesi için `pm`'e geri döner.
6. `pm` persona, kullanıcının kendi ses tonunda (Persona Voice) profesyonel bir taslak metin (Draft) oluşturur.
7. Yanıt HITL policy `high` risk sınıfına girdiği için doğrudan gönderilmez. Kullanıcının cihazına sessiz bir Draft Notification olarak düşer. 
8. Kullanıcı toplantıdan çıkınca sadece taslağa bakıp "Onayla"ya basar ve Notification Hook Bridge OS üzerinden mesajı doğrudan karşı tarafa iletir. (Geçmiş kararlar da ilgili `.wiki` dosyasına işlenir).

Bu asenkron otonom akış, salt bildirim filtrelemenin bir boyut ötesidir; mesajı sadece sınıflandırmakla kalmaz, sanal bir ofisin gücüyle arka planda kararı araştırır ve müzakere ederek nihai çözümü üretir.

## Değerlendirme

Bir değişikliğin iyi olup olmadığını anlamak için tek soru "daha çok persona mi ekledik?" değildir. Doğru sorular şunlardır:

1. Her persona kendi sesine sadık kalıyor mu; yoksa generic AI'a geri mi dönüşüyor? (Voice check, blind test.)
2. Ofis schema değiştirildiğinde sistem çökmüyor mu; persona'lar yeni role atamalarını temiz biçimde kabul ediyor mu?
3. Bir task'ın kararı geri izlenebiliyor mu? (Hangi persona, hangi brain'i okuyarak, hangi önerdi, hangi HITL checkpoint'i geçti?)
4. Persona ratchet çalışıyor mu? Bir persona'nın yeni sürümü geldiğinde eski geçen known-answer testleri bozulmamış mı?
5. Kullanıcı ofise haftada 1 saat daha az enerji harcayıp aynı veya daha iyi çıktı üretebiliyor mu?
6. Standalone modda tek persona skill değerli mi; yoksa sadece cerebra ile mi anlamlı hale geliyor?
7. Bir persona'nın "dürüst sınırı" korunuyor mu? Muhasebeci persona yasal soruyu, hukuk persona muhasebe sorusunu reddediyor mu?
8. Ofis şeması okunabilir mi? Kullanıcı kimin ne yaptığını bir bakışta anlıyor mu — yoksa yet another agent soup mu oldu?

## Cerebra ekosistemindeki komşular

cofounder-office tek başına yaşamaz; mevcut modülleri çağırır ve onlarla koordine olur:

- **rag-wiki**: bir persona ürün hakkında soru üretirse rag-wiki devreye girer, grounded cevap döner.
- **code-wiki**: coder persona (genellikle self-persona) code-wiki'nin autoresearch-engine'inden destek alır.
- **social-agent**: growth persona'sı social-agent'ın brain katmanını okur, kanal-özel içerik varyantları üretir.
- **marketing-agent**: kampanya task'ları marketing-agent'a delege edilir, artifact compile edilir.
- **studio-agent**: ofis özetleri, karar memo'ları, weekly digest'ler studio-agent'ın Compile implementasyonundan geçer.
- **human-in-loop-agent**: HITL engine her persona'nın risk sınıflı output'unu yakalar; özellikle "founder-gating" kararlarda devreye girer.
- **accounting-brain / legal-brain**: rol olarak atanan persona bu brain'leri okur; ikisi ayrı — persona "ses" ve "karar tarzı", brain "bilgi ve policy" sağlar.

## Not

Bu doküman kavramsal katmanı tanımlar; implementasyon detaylarını dayatmaz. Ancak şu ilkeler bu draft'ın çekirdeğinde kalır: (1) persona Work'ten ayrıdır ve her ikisi de distile edilir, aranmaz; (2) ofis orchestration'ı cerebra runtime üstünde yaşar, paralel bir scheduler kurulmaz; (3) her persona'nın karar trail'i provenance graph'ın parçasıdır; (4) standalone persona skill değerli ve kendi başına taşınabilir olmalıdır — cerebra'ya bind edildiğinde kat değer kazanır, ama kat değer zorunluluk değildir.

v1 scope sınırı şudur: tek office, 3–5 persona, 6 temel operation'ın tamamı, bir eval set, bir ofis schema DSL. Marketplace (official/open source/community persona paylaşımı), çoklu ofis, çapraz-ofis persona transferi v2'ye aittir.

Bu dokümanı LLM ajanına ver, mevcut repo state'ini okut, ve birlikte küçük ama yüksek etkili bir ilk dilimi seç: tek bir self-persona (kullanıcının kendisi), bir mentor-persona (örn. sektörden seçilen public figure), basit bir office schema (founder + pm + one specialist), bir HITL policy, bir weekly digest artifact. Çekirdek küçük kalırsa ofis büyüyebilir; çekirdek büyürse ofis günde bir "herkesle toplantı"ya dönüşür ki bu tam olarak kaçılmak istenen yerdir.

## Critical Check

**Yapılan varsayımlar:**
- Solopreneur'ün rolleri zihinsel olarak ayrıştırılabilir ve her rol için yeterli distilasyon materyali (chat log, karar notu, uzman kaynağı) bulunur.
- Cerebra substrate'i zaten kurulmuş durumdadır — cofounder-office bir greenfield ürün değil, mevcut brain'lerle compose olan bir katmandır.
- Persona ses sadakati eval set ile ölçülebilir bir kalitedir; tamamen subjektif değildir.
- Kullanıcı HITL checkpoint'lerini gerçekten kullanır — runtime'ı "hepsine otomatik evet" moduna almazsa ofisin değeri tam ortaya çıkar.

**Ne yanlış olabilir:**
- Birden fazla persona, tutarlı değil gürültülü karar çıktısı üretebilir. "Dört AI birbirine dayanıyor, hiçbiri karar veremiyor" tuzağı. Office schema hierarchy'si ve rol disiplini olmadan bu tuzağa düşülür.
- Persona distilasyonu zayıf kaynaktan yapıldığında (sadece manual tag'ler, yok sayılmayan PDF) generic AI'a geri döner; persona katmanı kendini doğrulayamaz. Eval ratchet'i bu nedenle day-1'den zorunlu.
- Ofis metaforu fazla genişler ve cerebra'nın "düşünme altyapısı" kimliğini proje yönetim SaaS'ına kaydırır. Sınır şöyle çizilmelidir: ofis koordinasyon yapar, substrate bilgiyi taşır — rolleri karıştırma.
- Celebrity persona'ları etik ve hukuki olarak hassastır. Public materyalden distile edilse bile, o kişinin "ne diyeceğini" simüle etmek yasal risk taşır. Bu yüzden persona skill'leri paylaşılabilir (open source brain) ama ticari lisanslama (official brain) kategorisine celebrity persona'ların alınması için ayrı bir çerçeve gerekir.

**Ne eksik:**
- Persona versioning ve migration semantiği: bir persona'nın correction log'u zaman içinde büyür; yeni sürüm geldiğinde bu correction'lar nasıl taşınır?
- Multi-user ofisler: bu draft tek solopreneur varsayımı üzerine kurulu. İki kurucunun aynı ofisi paylaştığı senaryo v2'ye ait.
- Persona marketplace'i ile cerebra'nın brain marketplace'i arasındaki ilişki: ayrı mı yaşarlar, birleşik mi? Bu karar brain ekosistemi tartışmasıyla bağlantılıdır.
- Cofounder-office'in LLM maliyet profili: her persona ayrı context taşır; naif implementasyonda maliyet patlar. Context paylaşımı ve prompt caching stratejisi v1 Definition of Done'a girmeli.
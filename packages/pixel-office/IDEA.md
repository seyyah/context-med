# pixel-office

Cerebra'nın cofounder-office brain-package'ı üstünde oturan, her persona'yı bir piksel karaktere dönüştüren ve ofisin bütün operasyonel nabzını görsel bir metafor üstünde anlatan interaction surface.

Bu bir idea file'dır. Belirli bir extension'ı veya framework'ü dayatmaz — tasarım örüntüsünü, kullanıcı deneyimini ve cerebra runtime ile bağlanma sözleşmesini anlatır. İmplementasyon (VS Code extension mi, Electron app mi, web app mi) surface-adapter tartışmasıyla birlikte netleşir.

Referans: `/home/seyyah/works/dev/pixel-agents` — Claude Code terminal'lerini piksel karakterlere bağlayan, tool aktivitesine göre karakter animasyonu sürdüren observational VS Code extension'ı. Bu ideanın görsel dil ve etkileşim gramerinin büyük kısmı oradan ödünç alınır.

## Çekirdek fikir

cofounder-office persona'ları, task'ları, kanalları ve cron tetiklerini doğru biçimde tanımlar — ama solopreneur onu **hissedemez**. Bir YAML schema, bir provenance graph, bir inbox kuyruğu; hepsi doğru soyutlama, ama hiçbiri görünmüyor. Kullanıcı için ofis şu an bir chat terminali üzerinden sızan mesajlar dizisidir; kim ne yapıyor, hangi persona hangi task'ı çekti, hangi cron az önce fire etti, hangi karar HITL'de bekliyor — bunların hepsi soyut.

Buradaki fikir şudur: ofisi **görselleştir**. Her persona bir piksel karakter olsun. Her rol bir masa olsun. Her task aktivitesi bir animasyon olsun — yazarken klavye tuşlayan sprite, okurken kağıda bakan sprite, arama yaparken ayağa kalkıp etrafa bakan sprite, yanıt beklerken başının üstünde konuşma balonu olan sprite. Kanban duvara asılı olsun. Cron fire'ı bir saatin çalması olsun. Cross-persona mesajlaşma karakterlerin birbirinin masasına yürümesi olsun. HITL checkpoint'i kullanıcı karakterinin omzuna gelen uyarı simgesi olsun.

Kritik fark şudur: bu bir dashboard değildir, bir "status page" değildir. Metafor çalışır çünkü ofis zaten ofistir — cofounder-office'in operational-schema'sı (roles, hierarchy, channels, cron, inbox) bire bir spatial bir layout'a haritalanır. Schema değişince layout değişir; task ilerleyince karakter hareketi değişir. Yani piksel ofis cerebra substrate'inin ikincil bir representation'u değil, substrate'in doğrudan görselleştirilmesidir.

Pixel-agents bunu Claude Code için zaten yapıyor (terminal başına bir karakter, tool aktivitesine göre animasyon). pixel-office bu örüntüyü cerebra'nın persona-merkezli, çoklu-brain, orchestrated dünyasına taşır ve bir **surface** haline getirir.

## Ne olduğu ve ne olmadığı

Bu bir oyun değildir. Bir simülasyon değildir. Bir "dijital twin" değildir. Bir productivity gamification eklentisi değildir. Ofisin çalışanları sprite görünüyor diye iş eğlenceli hale gelsin diye değildir.

Bu bir **interaction surface**'tir. cerebra terminolojisinde: kullanıcının cerebra substrate'i ile etkileşime girdiği bir yüzey. Tıpkı bir terminal chat arayüzü, bir web dashboard veya bir mobil bildirim akışı gibi. Ama bu surface'ın kendine has gramer'i şudur: **görsel metafor = operasyonel gerçek**. Karakter yazıyor gözüküyorsa, gerçekten bir persona bir artifact compile ediyordur. Karakter masadan kalkıyorsa, gerçekten inbox'ına yeni task düştü. Duvardaki Kanban karta hareket etti gözüküyorsa, gerçekten runtime o task'ı in_progress'e geçirdi.

Merkezinde tek bir soru vardır: **solopreneur, kendi sanal ofisinin nabzını bir bakışta nasıl hisseder?** Log mesajları tek tek okumadan, inbox kuyruklarını elle taramadan, task tablosunu refresh etmeden. Görsel kanal insan beynine en zengin bilgiyi en düşük yorgunlukla taşır — piksel ofis bu kanalı cerebra'ya açar.

Bu ürün cerebra'nın tek interaction surface'i olmak zorunda değildir. Bir terminal CLI, bir markdown editör, bir mobile tick notifier, bir Slack-bridge paralel olarak yaşayabilir. pixel-office yalnızca "gözle hissedilebilir ofis" surface'ıdır; başkaları yerine geçmez, onları tamamlar.

## Mimari

Üç katman vardır.

**Visual asset layer (katalog).** Karakterlerin sprite'ları, masalar, sandalyeler, telefonlar, dosyolapları, kahve makinesi, duvar tablaları, Kanban panosu — hepsi bir furniture/character asset manifest'i altında yaşar. pixel-agents'ın mevcut örüntüsü doğrudan taşınabilir: her asset kendi klasörü, `manifest.json` (id, name, category: desks/chairs/electronics/storage/decor/misc/wall, type: asset veya group, rotationScheme: 2-way/3-way-mirror/4-way, footprint, mirrorSide). 16px tile, integer zoom, pixel-perfect rendering. Bu katmanın cerebra için özel olması gerekmez — community theme'leri bu katmanda yaşar (tema-agnostic mimari gereği).

Bu katmanın bir ek sorumluluğu cerebra özgü: persona skill manifest'i karakter seçimini taşır. Yani `brains/personas/shreyas-doshi/persona.md`'nin head'inde "avatar: character-03" yazar; pixel-office bu field'ı okur ve o karakteri spawn eder. Persona kendi görselini taşır; surface sadece render eder.

**Spatial schema layer (layout).** Ofis fiziksel düzeninin tanımı. Hangi masa hangi rol, hangi duvarda Kanban, hangi köşede kahve molası alanı, hangi oda hangi brain'e ait (legal odası, accounting odası, coder odası). Bu katman pixel-agents'ın mevcut Layout Editor'ü gibi çalışır: kullanıcı ızgara üstünde masa yerleştirir, boyar, taşır; layout JSON olarak persist edilir. No-code kuralına uygun: kullanıcı markdown veya YAML yazmaz, sadece sürükler.

Kritik nokta: spatial layout cofounder-office schema'sına **bağlı**, ondan **türetilebilir**. cofounder-office schema'sında `coder: self-persona, pm: founder-persona, legal: startup-lawyer-persona` yazıyorsa, pixel-office bir default layout üretir (her rol için bir masa, hiyerarşiye göre gruplama). Kullanıcı isterse onu override eder. Yani layout editor opt-in'dir; default davranış zero-config'tir.

**Runtime binding layer (observational adapter).** Karakterlerin nasıl animasyon yapacağını belirleyen katman. Cerebra runtime'ından üç tür sinyal dinler:
- **Tool/operation events**: bir persona şu an hangi operation'ı çalıştırıyor? (ingest → okuma animasyonu, compile → yazma animasyonu, query → arama animasyonu, writeback → dosyolabına yürüme animasyonu, lint/evaluate → kafasında saat ikonu).
- **Queue events**: persona'nın inbox'ına yeni item düştü mü? Task state'i değişti mi? Cron fire oldu mu? HITL checkpoint tetiklendi mi?
- **Channel events**: bir persona'dan başka bir persona'ya mesaj gitti mi? (görsel: karakterin başka karakterin masasına yürüyüp konuşma balonu göstermesi).

Runtime binding katmanı saf **observational**'dır — runtime'a komut göndermez, sadece okur. Bu yüzden pixel-agents'ın bugünkü mimarisi (JSONL transcript file'ı polling ile okumak) cerebra'ya çevrildiğinde provenance graph + event bus polling'ine haritalanır. Bu da dual-mode için önemli: standalone modda da çalışabilmek için read-only kalır.

İleri seviye etkileşim (kullanıcı karaktere tıklayıp task atama, karakterler arası drag-and-drop assignment) observational değil **command-issuing** bir moda geçer — ama bu v2'nin sınırıdır ve ayrı bir policy katmanı (bu komut runtime'a yazma yetkisi mi istiyor, HITL gerekli mi) gerektirir. v1 sadece okur.

## Primitive'ler

**Character (piksel karakter).** Bir persona'nın görsel temsili. Persona skill'in manifest'inde avatar field'ı taşır. Persona eğer henüz avatar seçmediyse rastgele bir default'a düşer. 6+ çeşitli karakter seti (pixel-agents'tan miras).

**Desk (masa).** Bir rol'ün fiziksel konumu. Assignment (persona ↔ role) değişince karakter yeni masaya yürür. Masa üstündeki ekran o rolün birincil brain'ini temsil eder (coder masası code-wiki ekranı, accountant masası accounting ekranı). Desk = role, character = persona; layout assignment'ı görselleştirir.

**Activity animation.** Karakterin şu anki operasyonel durumunu anlatan sprite state. Minimum set: idle, walking, typing, reading, searching, waiting-for-user (konuşma balonu), speaking-to-other (karakterlar arası mesaj), coffee-break (inbox'ta hiçbir şey olmadığında). Bu set cerebra'nın 6 operation'ıyla bire bir haritalanmalı — extra operation eklenirse extra animation gerekir (tipler: operasyon aileleri, yeni aile gelince yeni aile için sprite).

**Speech bubble.** Karakterin başının üstünde geçici görünen UI. Üç varyant: (1) "waiting for user" — HITL checkpoint pending, tıklayınca detail panel açılır; (2) "message to channel" — karakter bir kanala yazıyor, balon içeriği kısa özet; (3) "error/blocked" — task failed veya persona rol dışına çıktı, uyarı sembolü.

**Room (oda).** Opsiyonel: bir grup masanın görsel kümelenmesi. Bir departmanı temsil eder. Örn: "growth odası" (pm + growth + content personalar birlikte). Oda duvarı renk-kodlu, brain-okuma yetkileri ima eder. Küçük ofislerde gereksiz; büyük ofislerde görsel gürültüyü azaltır.

**Kanban wall (duvar panosu).** Cerebra task sisteminin visual mirror'ı. Dört kolon default: waiting / todo / in_progress / done. Karakterler task aldıkça kart in_progress kolonuna kayar; tamamlayınca done'a. Kullanıcı karta tıklayınca task detail panel açılır. v1'de read-only; v2'de drag-and-drop ile manual reassign.

**Bulletin (duvar tablası).** Cron fire uyarıları, weekly digest'ler, incident notice'ları duvara asılı post-it kağıtları olarak görünür. Her post-it bir event. Kullanıcı tıklayıp içeriği okuyabilir.

**Token/health gauge (başüstü bar).** Her karakterin üstünde iki ince bar: context usage (input+output token toplamının model context window'una oranı) ve rate-limit health (recent request pressure). Bar dolduğunda sarı/kırmızıya geçer; persona'nın "yoruldu" görünmesi kullanıcıya cost awareness verir. Opsiyonel toggle — bazı kullanıcı bunu isteyecek, bazıları istemeyecek.

**User-character (kendi karakterin).** Kullanıcının kendisi de ofiste bir karakterdir. Masası "founder" rolünde. Bu karakter animasyonu farklıdır: user input yazdığında daktilo sesi, bir HITL onay verdiğinde baş sallama, offline olduğunda sandalye boş. Kullanıcıya "ben de bu ofisin çalışanıyım" hissini verir — teknik olarak self-persona zaten bir persona'dır, ama UX olarak özel.

## Cerebra ile İlişki (Dual-mode)

**Standalone mod.** pixel-office'in standalone versiyonu, bugün pixel-agents'ın yaptığı şeye çok yakındır: bir LLM host (Claude Code, Codex, OpenCode) çalışırken onun transcript'ini okur, her terminal/session başına bir karakter spawn eder, tool aktivitesine göre animasyon sürer. Cerebra yoktur; office schema yoktur; persona skill olmayabilir. Bu durumda surface basit bir **agent visualizer**'a dönüşür — pixel-agents'ın mevcut ürünüyle neredeyse aynı şey.

Standalone modda kayıp olan şey: roller net değildir (terminal = agent; ama "bu agent bir PM mi bir coder mı?" bilgisi yoktur), provenance yoktur (karakterin az önce yazdığı şey nereye kaydedildi, görünmez), cross-agent iletişim gözlenmez (iki terminal birbirine mesaj göndermiyor, paralel çalışıyor). Yani standalone mod kısmi değer taşır: "canlı animasyon eğlenceli ve bilgilendirici" ama "ofis hissi" yoktur.

Bu mod yine de bir giriş kapısıdır: kullanıcı pixel-agents kullanıcısı olarak başlar, sevrsr, sonra cerebra'ya geçince "oh, aynı görsel ama artık ofis gerçekten ofismiş gibi hissettiriyor" der.

**Cerebra-composed mod.** Gerçek değerin olduğu yer. Burada surface şu üç şeyi birden yapar:

- **cofounder-office schema'dan layout çıkarır.** Roles, hierarchy, channels tanımları spatial layout'a haritalanır. Kullanıcı schema'yı düzenlerse (yeni rol ekler, persona değiştirir) layout otomatik güncellenir.
- **Runtime event stream'ini okur.** Her persona'nın inbox tick'i, her tool call, her task state transition, her cron fire, her channel mesajı, her writeback — hepsi karakter animasyonuna ve ortam animasyonuna dönüşür. Provenance graph bu surface'ın data kaynağıdır.
- **Kullanıcıya canlı oversight verir.** HITL checkpoint'leri konuşma balonuyla görünür. Kullanıcı balona tıklayarak karar panel'ini açar, onaylar/reddeder. Her kanal mesajı — founder'dan legal'e gönderilen soru gibi — görsel olarak karakterin diğerinin masasına yürümesi + balon göstermesi olarak animate edilir.

Cerebra-composed modda pixel-office aynı zamanda **no-code erişim noktası**dır: markdown, YAML veya provenance graph teknik kullanıcıya yöneliktir. Piksel ofis her kullanıcıya açılabilir — sürükle-bırak layout editor, tıkla-ve-oku Kanban kartları, tıkla-ve-onayla HITL checkpoint'ler. Bu, cerebra'nın no-code pivot'uyla uyumludur: backend brain-package + micro-wiki abstraksiyonu teknik kalır; surface kullanıcıyı karşılar.

Dual-mode burada önemli bir pattern üretir: aynı asset katmanı (karakterler, mobilyalar, temalar) iki modda paylaşılır. Bir community theme creator kendi furniture pack'ini tek bir kez yapar; hem standalone pixel-agents kullanıcıları hem cerebra-composed pixel-office kullanıcıları onu import edebilir. Bu üçüncü agent-agnostic / theme-agnostic mimariyle uyumludur (pixel-agents README'den).

## Package Conformance

Cerebra-composed modda pixel-office'un sağlaması gereken minimal kontrat:

- **Tip**: `interaction-surface` (birincil). Kendisi bir brain-package değildir — bilgi üretmez, bilgi render eder.
- **Reads from**: cerebra provenance graph (event stream), `brains/cofounder-office/config/office.yml` (layout deriving için schema), `brains/personas/*/persona.md` (avatar field), `brains/*/tasks/*` (Kanban kartları için task listesi), `brains/*/inbox/*` (persona inbox durumları).
- **Writes to**: `~/.cerebra/surfaces/pixel-office/layout.json` (kullanıcının manual layout edit'leri), `~/.cerebra/surfaces/pixel-office/prefs.json` (zoom, toggle'lar). Önemli: surface cerebra substrate'ine asla writeback etmez; kendi local state'ini tutar. Bu read-only disiplin, surface'ın runtime'ı bozma riskini sıfırlar.
- **Operations**: hiçbiri (ingest/compile/query/writeback/lint/evaluate surface'a ait değil). Surface sadece subscribe-and-render yapar.
- **Command channel (v2)**: kullanıcının UI üstünden yapabileceği yazma operasyonları (task drag, persona reassign, HITL onayı) runtime'a comut olarak gönderilir. Her komut HITL policy'den geçer ve provenance graph'a "surface-originated action" olarak yazılır. v1'de sadece HITL onayı komut olarak izinlidir.
- **Event subscription contract**: runtime şu event tipleri üretir ve surface subscribe eder: `persona.inbox.push`, `persona.tool.start`, `persona.tool.end`, `task.state.change`, `cron.fire`, `channel.message`, `hitl.checkpoint.open`, `hitl.checkpoint.close`, `provenance.writeback`. Surface bu event taxonomy'nin parçası olmalı; ad hoc polling'e düşmemeli.
- **Accessibility fallback**: surface'a erişemeyen kullanıcı (görme engelli, headless ortam) için aynı event stream'i text-mode bir "ofis log"una akıtan paralel CLI surface'ı zorunludur. Yani piksel ofis primary surface olmamalıdır; primary olduğu an erişilebilirlik ihlali üretir.

## Primitive tipleri ve kullanım örnekleri

Tipik bir solopreneur pixel-office açılışı şöyle görünür:

- Kullanıcı `cerebra office open` der (veya VS Code extension / Electron app / web app hangi host ise onun UI'ından tıklar).
- Ofis yüklenir. 6 karakter görünür: user-character (founder masasında), pm-persona (founder'la aynı kişi — self-persona, ikinci bir masada), coder-persona (yine self, üçüncü masada), legal-persona (startup lawyer distilasyonu), accountant-persona, growth-persona.
- Sabah 08:00, cron fire: pm masasına bir kağıt düşer ("haftalık plan zamanı"). pm karakteri kağıdı alır, ekranına dönüp yazmaya başlar (compile operation animasyonu). Üstündeki context bar %12 dolar.
- pm compile biter; duvar panosunda yeni bir post-it: "haftalık plan draft hazır — onay bekliyor". post-it altın sarısı (HITL pending). user-character'ın üstünde konuşma balonu belirir.
- Kullanıcı tıklar, detail panel açılır, draft'ı okur, onaylar. Post-it yeşile döner, panoya sabitlenir; provenance trail'e "user approved weekly-plan-2026-w17" yazılır.
- Öğleden sonra kullanıcı `Dünkü müşteri görüşmesindeki yeni feature talebini değerlendir` diye komut verir.
- pm karakter mesajı alır, ayağa kalkar, legal karakterin masasına yürür, konuşma balonu ile soru gösterir. Legal karakteri okuma animasyonuna girer (legal-brain'den ingest). 30 saniye sonra legal karakteri yazı animasyonuna geçer (compile), bir post-it hazırlar, pm'in masasına yürüyüp bırakır.
- Paralel: pm başka bir karakterin (accountant) masasına da gider; aynı pattern tekrarlar. Sonra growth karakterin masasına. Kullanıcı bu süreçte odaklanmadan bile ne olup bittiğini uzaktan hisseder.
- Hepsi bittiğinde pm kendi masasına döner, decision-memo compile eder. post-it panoda belirir, yine altın sarısı. Kullanıcı tıklar, kararı okur, onaylar. Yeşile döner. core-wiki/decisions/ writeback olur.

Bu akış cofounder-office idea file'ındaki "örnek akış" ile birebir aynıdır — farkı, kullanıcı bunu log mesajları, JSON trail'leri ya da task tablosu okuyarak takip etmiyor; oditoryum gibi bir pencereden izliyor.

## Değerlendirme

Bir değişikliğin iyi olup olmadığını anlamak için tek soru "daha güzel sprite mı ekledik?" değildir. Doğru sorular şunlardır:

1. Görsel metafor runtime gerçeği ile **bire bir** haritalanıyor mu? Yoksa "güzel ama aldatıcı" mı? Bir karakter yazıyor görünüyorsa gerçekten bir artifact compile ediliyor olmalı; pasif dekor animasyonu yasak.
2. Kullanıcı log okumadan ofisin mevcut nabzını 3 saniye içinde anlayabiliyor mu? (Kim aktif, kim bekliyor, hangi HITL açık, hangi cron yakın.)
3. HITL checkpoint'leri kaçırılmıyor mu? Kullanıcı pencereyi kapatıp açtığında bekleyen balon hâlâ görünüyor mu? (Race condition yok: surface durum state'ini runtime'dan her açılışta taze çeker.)
4. No-code: teknik bilgisi olmayan solopreneur schema editörüne hiç girmeden ofisi yönetebiliyor mu? (Drag-and-drop layout, click-to-approve HITL, yeni persona eklemek için avatar seç + rol seç.)
5. Surface read-only disiplinine sadık mı? Yani bir UI hatası runtime state'i bozabilir mi? (Hayır olmalı; surface yazma path'i HITL policy'den geçen explicit command channel'dır.)
6. Asset ekosistemi (community theme'leri, furniture pack'leri) hem standalone hem cerebra-composed modda aynı şekilde çalışıyor mu?
7. Accessibility paralel CLI surface'ı var mı? Gerçekten kullanılabilir seviyede mi, yoksa görünüşü kurtaran bir checkbox mu?
8. Performans: 10 persona, 50 task, 200 event/dakika yükünde surface 60 FPS tutuyor mu; yoksa büyük ofiste tıkanıyor mu?
9. Kullanıcı uzun bir toplantı sırasında ofisi sessize alabiliyor mu? (Animasyon canlılığı odaklanmayı bozmamalı — opt-out gerekli.)

## Cerebra ekosistemindeki komşular

pixel-office tek başına yaşamaz; mevcut modülleri görselleştirir:

- **cofounder-office**: birincil bağımlılık. Schema ve persona listesi oradan gelir; pixel-office o schema'nın render'ıdır.
- **human-in-loop-agent**: HITL checkpoint'leri konuşma balonu + duvar post-it'i olarak görselleşir.
- **studio-agent**: compile operasyonları (digest, decision-memo, standup) karakter yazma animasyonu olarak görünür; biten artifact duvara asılır.
- **social-agent / marketing-agent / rag-wiki / code-wiki**: bu brain'lerin masa-ekran metaforu. Persona bir brain'den ingest ederken karakterin ekranı o brain'in tema renginde parlar.
- **provenance/event-bus module**: pixel-office'in veri kaynağı. Bu module doğru shape'te event yaymadıkça surface generik polling'e düşer — substrate'in observability seviyesini arttırmanın dolaylı baskısıdır.
- **theme/asset marketplace** (v2, brain marketplace'in kardeşi): community theme'leri, furniture pack'leri, karakter set'leri burada paylaşılır. Brain marketplace ile ayrı kategoriler ama aynı licensing çerçevesini kullanabilir.

## Not

Bu doküman surface'ın kavramsal katmanını tanımlar; hangi teknoloji üstünde koşacağını dayatmaz. pixel-agents'ın bugünkü stack'i (TypeScript + VS Code Webview + React 19 + Canvas 2D) bir başlangıç referansıdır; cerebra için Electron app, web app, hatta native desktop da aynı mimariyi taşıyabilir. Host-agnostic olmalıdır — adapter katmanı cerebra runtime'a bağlanır, sunum katmanı host'a bağlanır, ikisi birbirini bilmez.

Şu ilkeler bu draft'ın çekirdeğinde kalır: (1) surface read-only'dir, command channel'ı politika filtresinden geçer; (2) görsel metafor operasyonel gerçeğe bire bir haritalanır, pasif dekor yasaktır; (3) asset/theme katmanı agent-agnostic ve cerebra-agnostic kalır, böylece community ekonomisi büyüyebilir; (4) accessibility paralel surface'ı (CLI/text-mode) primary surface olarak desteklenir, piksel ofis opt-in'dir; (5) standalone mod ayakta kalır — pixel-agents kullanıcısı cerebra olmadan da değer alabilir.

v1 scope sınırı şudur: 1 ofis, 3-5 persona, cofounder-office schema'sını okuma + event stream'ini dinleme + temel animasyon set'i (idle, type, read, search, wait-speech-bubble) + Kanban duvar panosu + HITL balon approval + manuel layout editor + 1 default theme. Token/health bar, multi-theme marketplace, drag-and-drop task reassignment, multi-office view, VR/3D, mobile companion app — hepsi v2+.

Bu dokümanı LLM ajanına ver, cofounder-office ideasını birlikte okutun, ve ilk dilimi seçin: tek bir ofis, 3 persona (founder + pm + coder hepsi self), sadece idle + type + read + wait animasyonları, duvarda sadece HITL post-it'leri, hazır pixel-agents asset set'i. Kayıp kısım az, kazanılan his büyüktür: kullanıcı ilk kez sanal ekibini gözle görür.

## Critical Check

**Yapılan varsayımlar:**
- Cerebra runtime yeterince düzenli event yayıyor — surface bu event stream'ine güvenebilir. (Şu an substrate event-bus standardı yok; bu surface tasarımı o standardı dolaylı olarak forsluyor.)
- Kullanıcı görsel bir UI'dan rahat eder ve terminal-only ideolojisi çerçevesinde yaşamıyordur. (Cerebra'nın no-code pivot kararıyla uyumlu.)
- Pixel art metaforu jenerasyon-uyumludur: kullanıcı SimCity/Animal Crossing/The Sims kültürüyle yaşamış biri olmayabilir. Alternatif görsel metaforlar (isometrik ofis, flat-UI avatar grid, text-mode "office view") tek format'a bağlı kalmamak için gerekir.
- Asset lisansları: pixel-agents'ın karakterleri Metro City pack'inden (CC-BY benzeri serbest) geliyor. Cerebra'nın default bundle'ında yeniden dağıtımı hukuk kontrolünden geçmeli.

**Ne yanlış olabilir:**
- Görsel metafor runtime gerçeğine bire bir haritalanmazsa (karakter typewriter sesini rastgele çıkarıyor ama aslında bir şey yapmıyor) kullanıcı güvenini kaybeder. Bu ihtimal high: animasyon mühendisliği "güzel görünsün" tuzağına düşer, gerçekten olan biteni sıvayıp geçer. Bu yüzden event subscription contract (section: Package Conformance) zorunlu.
- Ofis fazla "eğlenceli" ama az bilgilendirici olabilir — gamification tuzağı. Kullanıcı sprite'lara bakarak 10 dakika geçirir, iş yapamaz. Bu surface'ın değeri **glance-able** olmasıdır; uzun süre bakılmaz, hızlı okunur. UI testleri "X saniyede durumu anladı mı" metriğiyle kurulmalı.
- 10+ persona olan büyük ofislerde ekran görsel olarak karmaşıklaşır; karakterlerin sürekli birbirine yürüdüğü "karınca yuvası" hissi üretilir. Room metaforu + görüş alanını daraltan focus mode (sadece aktif personaları göster) buna karşı savunma.
- Surface read-only disiplini birkaç release sonra "kullanıcı sürükleyerek task atamak istiyor" baskısıyla kırılırsa, provenance disiplini de kırılır — UI'dan runtime'a sızan edit'ler audit edilemez hale gelir. v2 command channel tasarımı day-1'den iyi düşünülmeli, ayaküstü eklenmemeli.
- Platform bağımlılığı: ilk implementasyon VS Code extension olarak başlarsa, cerebra'nın VS Code-agnostic kimliğini zayıflatır. İlk sürüm bile host-adapter pattern'i ile yazılmalı — "VS Code adapter + Electron adapter + web adapter, core logic ortak".

**Ne eksik:**
- Çoklu ofis / çapraz ofis görünümü: solopreneur iki farklı şirkette çalışıyorsa nasıl? İki pencere mi, sekme mi, tek ofis farklı renkli mi?
- Takım / multi-user: iki kurucu aynı ofiste çalışırken pixel-office iki user-character mı gösterir? Presence/cursor sharing protokolü?
- Offline mode: cerebra runtime down'sa surface ne yapar? Son bilinen state'i render edip "durgun ofis" mi gösterir, yoksa error screen mi?
- Time-travel / replay: dün ne olduğunu görmek için önceki event stream'ini "replay" etmek (provenance graph zaten bunu destekliyor). Surface bunu görselleştirebilir mi (karakterler hızlı sarma ile hareket eder)? Büyük UX fırsatı ama v1 dışı.
- Cost/maliyet stratejisi: event polling tüm runtime'ı sürekli wake ediyorsa battery drain / compute cost üretir. Push-based event bus vs. polling tradeoff'u.
- Mobile / küçük ekran: pixel-office bir iPad'de çalışır mı? Ofis tek ekrana sığmazsa mimari bozulur mu?
- Persona görsel farklılaştırması: 10 karakter sprite yetersiz kalabilir — her persona'ya benzersiz aksesuar (gözlük, şapka) sistemi gerekebilir. Yoksa kullanıcı karakterlerin kimi temsil ettiğini karıştırır.

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/pixel-office",
  "version": "0.1.0",
  "bin": { "pixel-office": "./bin/cli.js" },
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `pixel-office serve` | Start pixel office dev server | | `--port`, `--config`, `--verbose` |
| `pixel-office build` | Build production bundle | `--output` | `--format`, `--verbose` |
| `pixel-office render` | Render office snapshot image | `--output` | `--config`, `--format` |
| `pixel-office status` | Show office event stream status | | `--format`, `--verbose` |
| `pixel-office lint` | Validate sprite assets and event config | `--input` | `--format`, `--verbose` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Start Dev Server

```bash
pixel-office serve --port 3001
```

**Expected:** Pixel office UI starts on port 3001.
**Exit Code:** `0`

#### Scenario 2 — Render Snapshot

```bash
pixel-office render \
  --output output/office-snapshot.png \
  --format png
```

**Expected Output:** Static PNG image of current office state.
**Exit Code:** `0`

#### Scenario 3 — Lint Assets

```bash
pixel-office lint --input assets/ --format json
```

**Expected Output:** JSON report on sprite assets (missing frames, invalid dimensions).
**Exit Code:** `0` if pass, `2` if issues.

#### Scenario 4 — Build Missing Output (Error)

```bash
pixel-office build
```

**Expected:** `Error: required option '--output <path>' not specified`
**Exit Code:** `1`


#### Scenario (Extension) — Invalid Config (Error)

```bash
pixel-office render \
  --input fixtures/raw/sample-text.txt \
  --output output/error.json \
  --config fixtures/config/corrupt-config.yaml
```

**Expected:** `Error: Invalid YAML configuration in fixtures/config/corrupt-config.yaml`
**Exit Code:** `1`


#### Scenario (Extension) — Schema / Validation Check (Error)

```bash
pixel-office render \
  --input fixtures/json/invalid-schema-sample.json \
  --output output/failed.json
```

**Expected:** `Error: Validation failed — schema mismatch or hallucination detected.`
**Exit Code:** `2`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Server started / snapshot rendered |
| `1` | General error | Missing argument, build failure |
| `2` | Validation error | Sprite asset missing |
| `3` | External dependency error | Event bus unreachable |

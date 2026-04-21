# context-hoop (human-in-loop MCP)

Aksiyon alan ajanlar için, risk seviyesine göre insan katılımını zorunlu ve denetlenebilir hale getiren, adapter-agnostic bir Model Context Protocol (MCP) orkestrasyon katmanı.

Bu bir *idea file*'dır. Kendi LLM ajanına (Claude Code, Codex, OpenCode, Page-Agent veya benzeri) kopyala-yapıştır olarak verilmek üzere tasarlanmıştır. Belirli bir uygulamayı değil, yüksek seviyede bir örüntüyü iletir. Spesifik senaryoları ve API detaylarını sen ve ajanın birlikte, kendi ürününe göre inşa edeceksiniz.

---

## Çekirdek fikir

Ajan ne yapacağını bilir ama bunu tek başına yapmamalıdır veya her bilgiye sahip değildir — bu farkı sistemleştiren bir yönetişim ve fallback protokolü.

Bilgi eksikliği (RAG no-answer) gibi net tetik anları bu örüntüde birinci sınıf HITL (Human-in-the-loop) tetikleyicisidir. Kullanıcı Copilot ile konuşurken RAG bir soruya yanıt bulamazsa (örn. `rejectionPattern` yakalanırsa), sistem kibarca akışı kırar ve HITL talebi üretir. Bu iletişim Frontend ile Backend (Hoop) arasında standart `@modelcontextprotocol/sdk` üzerinden Tool çağrısı (`trigger_human_in_the_loop`) şeklinde sağlanır.

Runtime, policy ve risk kurallarına göre insan-döngüsünü tetikler, Slack veya WhatsApp gibi native platformlardaki uzmana ilgili soruyu iletir. İnsan cevabı yazar; cevap (Server-Sent Events) MCP bağlantısı üzerinden kullanıcı ekranına düşer ve hemen oracıkta RAG hafızasına (`WikiService.ingest`) **writeback** edilerek gelecek aramalar için kalıcılaşır. Adapter değiştiğinde çekirdek akış aynı kalır; değişen yalnızca bağlanan mesajlaşma platformudur.

---

## Ne olduğu ve ne olmadığı

Bu ürün, "are you sure?" popup koleksiyonu değildir. Onay diyaloğu tek başına bir yönetişim katmanı sayılmaz; önemli olan hangi adımların, hangi kurallara göre, hangi bağlamla insana taşındığıdır. Model yükseltmesi veya prompt inceltmesi değildir; aynı modeli üretimde gerçekten işletilebilir kılan, endüstri standardı bir kontrat katmanıdır (MCP). Reaktif değil proaktiftir: ajan halüsinasyon görüp tıkandıktan sonra değil, limitine ulaştığını (veya yetkisi olmadığını) anladığı an izin ister. tawk.to gibi bağımlı tek-kanal hedeflere sıkışmaz; Slack, WhatsApp veya benzeri her platform adapter mantığıyla entegre olabilir. 

---

## Güçlü yanlar

*   **MCP Tabanlı Standartlaşma:** İnsan-ajan arasındaki veri alışverişi özel protokoller yerine MCP Tool Calls üzerinden yürütülür, timeout'ları ve metadata yapısı standarttır. Özel websocket bağımlılığını kaldırır.
*   **Anında Writeback Öğrenmesi:** Uzmandan alınan her tamamlayıcı yanıt anında knowledge graph'a eklenir, böylece policy ve RAG kendini bir sonraki soru gelmeden günceller.
*   **Üç Katmanlı Mimari:** Policy, Runtime (MCP Server), Human Console (Slack/WA) ayrımları sorumlulukları netleştirir ve sistemi evrimleştirmeyi kolaylaştırır.
*   **Risk Modları:** Hız-güven dengesini ayarlamak için Tam Otonom, On-event HITL ve Zorunlu Checkpoint stratejilerini birleştirir.
*   **Adapter-Agnostic Çekirdek:** Kanal detayları çekirdek orkestrasyona sızmaz.

---

## Kısıtlar

Yüksek riskli veya geri dönüşü zor aksiyonlar insan onayı olmadan çalıştırılmaz. Ajan davranışı açıkça yazılmış policy kontratına bağlıdır; ad-hoc kararlarla kapsam dışına çıkılmaz. Uzun süreli akışlarda state kalıcı tutulur; hedef, MCP tarafındaki uzun ömürlü timeout konfigürasyonlarını (önr. 10 dk bekleme) sorunsuz işlemektir. Kritik bilgi belirsizliğinde ajan uydurma cevap vermez, insan eskalasyonu yolu kullanılır. Adapter kontratları normalize edilir; Slack zengin block-kit formatları veya Meta WhatsApp Graph API sınırları (24 saat etkileşim penceresi) Hoop arkasına gizlenir, Frontend tarafını etkilemez.

---

## Mimari

Üç katman vardır.

**Policy substrate** — ajanın kontratı. Bu katman, alanın anayasasıdır. Görev tipleri, risk sınıfları (düşük, orta, yüksek) ve kural setleri belirlenir. Sistem veya prompt bazlı RAG motoru bu katmandan beslenip neyin eskalasyon (no-answer) gerektireceğini saptar. Eşleşme varsa MCP aracı tetiklenir.

**Runtime MCP Orkestratör (Hoop Server)** — eskalasyon ve bekleme motoru. Ajanın kullandığı tool call'ları yönetir. Frontend üzerinden gelen `trigger_human_in_the_loop(question, adapter)` isteğini JSON formatına döküp Slack veya WhatsApp adapter end-point'lerine bırakır. Daha sonra MCP bağlantısını canlı tutar (SSE). İnsan onay verip cevabı yolladığında sistem proxy aracılığıyla bekleyen süreci tamamlayıp UI'a "token/yanıt" fırlatır.

**Human console** — onay yüzü. İnsanın ajanla çalıştığı arayüzdür. Ancak yeni bir arayüz yerine, insanın zaten yaşadığı ekosistemi (Slack Block Kit Mesajları, WhatsApp Şablonları) benimser. 

---

## Operasyonlar

**1. Soru / Risk Tespit:** Kullanıcı soru sorar (wikiInput) veya ajan adım tasarlar. Bilgi yoksa veya yüksek risk varsa RAG/düzenleyici "Yanıtlamak için yeterli bilgi bulunmamaktadır" der ve süreç durdurulur (On-event HITL).

**2. MCP Tetikleme:** Frontend Copilot'u `SSEClientTransport` üzerinden Hoop MCP Proxy'ye (`https://hoop.istabot.com/mcp`) bağlanıp istenen adaptör ile (`adapter: 'slack'`) Tool Call çağrısında bulunur. UI "Uzman sistemine iletildi" bilgisini basar ve bekler. 

**3. Adapter Eskalasyonu ve Bekleme:** Hoop mesajı Slack'e iletir. İnsan Slack kanalında soruyu okuyup yanıtlar. Ajan bu sırada UI üzerinde Onay / Ek bilgi bekleniyor statüsünde uykudadır.

**4. Kapanış ve Writeback:** Webhook üzerinden Hoop sunucusuna dönen insan cevabı, açık SSE bağlantısına basılır ve Tool Call başarıyla resolve olur. Kullanıcıya taze cevap sunulurken, derhal arka planda `WikiService.ingest` ile bu yeni tecrübe (`Soru: X \n Cevap: Y`) veritabanına Writeback edilerek knowledge bazına yazılır.

---

## Risk modları

**Tam otonom mod.** Düşük riskli, geri alınması kolay veri okuma operasyonları, UI turları vb. İnsan müdahalesine denk gelmez.
**On-event HITL mod.** RAG no-answer gibi belirli sınır durumlarında, regex kırılımıyla anlık eskalasyon yaşanması. Prompt veya eşik tetikleri bu alandadır.
**Zorunlu checkpoint mod.** Ortamı manipüle eden, silecek/değiştirecek "yazma" aksiyonları. Her kritik adım öncesinde insan onayı olmadan MCP token vermez ve operasyon ilerlemez.

---

## Adapter katmanı

İlk fazda iki adapter öne çıkmaktadır: **Slack** ve **WhatsApp**. Her adapter, Hoop'un beklediği JSON nesnesini zengin bir UI bildirimine (Slack Interactive Modals veya WhatsApp Şablonları) çeviren ince katmanlardır. Kanal özelinde yaşanacak Token limitleri, yetkilendirmeler veya zaman pencereleri çekirdek OOP mantığına sızmaz; yeni adapterler plug-in olarak Hoop'a eklenir.

---

## Cerebra ile İlişki (Dual-mode)

**Standalone Mod:** Kendi `policy`'si ile riskli durumlarda Slack üzerinden izin soran, küçük ve bağımsız mikro-servis. 

**Cerebra-composed Mod:** Modül, Cerebra'nın RAG + Wiki (rag-wiki / demo-wiki) ekosisteminin asıl "Öğrenme Sigortası" (Runtime 엔진) olur. Eskalasyon üzerine toplanan bilgiler, projenin provenance kalıtımına ("Writeback") bağlanır; zamanla benzer durumlarda hiç eskalasyona gerek kalmaz.

---

## Başarının sade ölçüsü

Ajanı tamamen kapatmaya gerek kalmadan, üretim ortamında oluşan hatalı RAG cevabını (veya kritik aksiyonu) sorunsuz bir şekilde uzmana MCP bağlantısıyla aktarabiliyor musun? Daha da önemlisi, uzman bu onayı bir kez verdikten sonra, Writeback döngüsü o bilginin kalıcı belleğe entegre edilmesini sağlayıp uzmana bir daha aynı soruyu sordurmayı rafa kaldırıyor mu? RAG + HITL birleşiminin altın kuralı: Aynı eskalasyonu ikinci kez yaşamamaktır.

---

## Açık sorular

- Slack üzerinden atılan yanıtlarda Reviewer/Editor rollerinin RBAC matrisi nasıl belirlenecek? 
- MCP adapter seçimi runtime'da context üzerinden geliyor (şu an 'slack'), ileride tenant config'ine bağlanması için ne gerekiyor?
- İnsan onayı/yanıtı için ayrılmış süre dilimi (örn 10 dakika) aşıldığında UI üzerinde nasıl bir fallback State'e gidilecek?
- RAG "ingest" operasyonunda insan kararlarının kalıcılığı ve versiyonlanması sağlanırken, birden fazla uzman görüşünda Conflict Resolution nasıl idare edilecek?

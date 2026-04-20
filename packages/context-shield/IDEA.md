# context-shield

Kullanıcıların ve kurumların hassas verilerini (PII) bulut sunucularına göndermeden, doğrudan cihaz üzerinde (Edge-AI) çalışan sıfır güven (Zero-Trust) mimarisine sahip, yapay zeka destekli otonom veri maskeleme ve siber güvenlik katmanı.

Bu belge IDEA standardını takip etmektedir. Hiçbir kod yazılmadan önce Privacy-First Nexus platformunun ne olduğunu, neden var olması gerektiğini ve teknik sınırlarını açıklar. Bu belge 10-draft-ideas/edge-privacy.md felsefesine sıkı sıkıya bağlıdır.

## 1. Tez (Thesis)

Tez: Bulut tabanlı LLM (Büyük Dil Modeli) ekosistemlerinde veri gizliliği katmanı LLM'in veya sunucunun sorumluluğunda değil; doğrudan kullanıcının cihazında (Edge), sıfır güven (Zero-Trust) mimarisiyle çözülmelidir.

Alternatiflerle Karşılaştırma:

- **Sunucu Taraflı Anonimizasyon:** Veri LLM sağlayıcısına veya aracı bir API'ye ulaştıktan sonra anonimleştirilmesi, "Data Breach" (veri ihlali) ve "Man-in-the-Middle" risklerini barındırır.

- **Model Fine-Tuning (PII Unutturma):** Maliyetlidir, katastrofik unutmaya (catastrophic forgetting) yol açar ve kullanıcı özelindeki anlık verilerin gizliliğini dinamik olarak çözemez.

- **İstemci Taraflı (Nexus Yaklaşımı):** Veri, tarayıcıdan çıkmadan yerel bir model (Edge-AI) ile şifrelenir. Sunucu, maskelenmiş sentetik veriyi görür; gizlilik %100 oranında garanti altına alınır.

## 2. Problem

- **Bağlamsal Zafiyet:** Klasik statik maskeleme yöntemleri (Regex/Kurallar) "Ayşe bugün istifa etti" cümlesindeki ismi yakalayamaz; yüksek oranda "False Positive" (hatalı pozitif) üretir.

- **De-masking (Çözümleme) Kırılganlığı:** Bir LLM'e `[KİŞİ_1]` şeklinde gönderilen maske, LLM tarafından yanıt üretilirken Türkçe'nin sondan eklemeli yapısı nedeniyle `[KİŞİ_1]'e`, `Kişi 1` veya `[KISI_1]` şeklinde mutasyona uğrayarak dönebilir. JSON map eşleşmesinin bozulması, mevcut sistemlerin en büyük mühendislik darboğazıdır.

- **DOM Manipülasyon Zorluğu:** Modern LLM arayüzleri (ChatGPT, Claude) React/Vue gibi Virtual DOM yapıları kullanır. Dışarıdan enjekte edilen statik içerikler sistem tarafından reddedilir veya akışı bozar.

## 3. Nasıl Çalışır (How It Works)

Proje, üç temel içgörü (insight) üzerinden çalışır:

### İçgörü 1: Edge-AI ile Otonom NER Sınıflandırması

Sistem, kullanıcı metin giriş alanına (input) veri yazdığında, bunu dış bir API'ye göndermez. Tarayıcı içindeki SLM (Small Language Model) ile metni analiz eder ve `Ahmet, 50.000 TL transfer etti` metnini `[KİŞİ_1], [MİKTAR_1] transfer etti` olarak dönüştürür.

### İçgörü 2: Güvenli JSON State Management (Haritalama)

Maskelenen orijinal veriler (`Ahmet = KİŞİ_1`), sadece o sekmeye ait geçici bellek durumunda (Local Session State) tutulur. Sayfa kapandığında yok olur.

### İçgörü 3: Fuzzy De-Masking Engine (Bulanık Çözümleme Motoru)

Sistemin en kritik mühendislik çözümüdür. LLM'den dönen yanıt doğrudan JSON key'i ile eşleştirilmez. Özel bir Regex ve Levenshtein Mesafesi algoritması kullanılarak, LLM'in üretebileceği morfolojik hatalar (`[KİŞİ_1]'e`, `Kişi_1`) normalize edilir ve yerel haritadaki orijinal veriyle değiştirilerek (De-mask) ekrana basılır.

## 4. Ne Yapmaz (What It Does Not Do)

- Bulutta herhangi bir PII verisi depolamaz veya telemetri toplamaz.
- Veri şifreleme/çözme işlemi için harici bir sunucu API'sine istek atmaz.
- Her web sitesinde çalışan genel bir araç değildir; yalnızca LLM arayüzleri için tasarlanmıştır.

## 5. Kısıtlamalar ve Fizibilite (Constraints & Feasibility)

- **Chrome Built-in AI Deneyimselliği:** Gemini Nano API şu an deneyseldir (Chrome 127+ gerektirir) ve kullanıcı tabanı kısıtlıdır. **Fallback (Geri Dönüş) Mekanizması:** Built-in AI bulunmayan cihazlarda sistem, Transformers.js kullanarak tarayıcıya (WASM) önbelleğe alınmış hafifletilmiş (Quantized ONNX) bir Türkçe NER modeli yükleyerek otonom çalışmaya devam edecektir.

- **Çoklu Platform Uyumu:** ChatGPT, Claude ve Gemini arayüzlerinin DOM yapıları (React Fiber, Event Listeners) tamamen farklıdır. Tek bir content script ile hepsini yönetmek kararsızlık yaratır. Bu nedenle projenin V1 fazı bilinçli bir kısıt olarak yalnızca chatgpt.com DOM yapısına entegre olacaktır. Diğer arayüzler, "Abstract DOM Adapter" mimarisi kurgulandıktan sonra V2'ye bırakılacaktır.

## 6. Riskler ve Zorluklar (Risks)

- **Türkçe NER Başarımı:** Türkçe'nin karmaşık morfolojisi nedeniyle, bağlamsal PII tespiti zorludur. Modelin isimleri cins isimlerle (örneğin: "Kaya", "Deniz") karıştırması büyük bir risktir.

- **LLM Halüsinasyonu ile Token Kaybı:** LLM'in maskelenmiş `[KİŞİ_1]` tokenini tamamen yok etmesi veya bağlamdan koparması durumunda orijinal verinin geri yüklenememesi (Loss of Information) riski mevcuttur.

## 7. Başarı Kriterleri (Success Criteria)

Projenin akademik ve mühendislik olarak başarılı sayılabilmesi için test edilecek sayısal metrikler:

| Metrik | Hedef |
|--------|-------|
| Türkçe PII Sınıflandırma (NER) — Precision | > %90 |
| Türkçe PII Sınıflandırma (NER) — Recall | > %85 |
| De-masking (Geri Çevirme) Başarısı | > %95 |
| İstemci Gecikmesi (Latency) | < 400ms |

- **NER Eval:** HuggingFace Turkish-NER veri seti (veya TS Corpus) üzerinden yapılacak eval testleri.
- **De-masking Eval:** Çeşitli çekim ekleri eklenmiş sentetik LLM yanıt testleri.

## 8. Kim Fayda Sağlar (Who Benefits)

- **Kurumsal Çalışanlar ve Yöneticiler:** ChatGPT gibi araçları kullanmak isteyen ancak şirket gizlilik politikaları (NDA) nedeniyle kullanamayan profesyoneller, Nexus'un şemsiyesi altında özgürce AI kullanabilirler.

- **Hukuk, Finans ve Sağlık Uzmanları (Compliance):** Hasta veya müşteri verilerini (PII, PHI) işlemek zorunda olan, ancak bu verileri buluta göndermesi kanunen yasak olan meslek grupları.

- **Siber Güvenlik / Denetim Ekipleri:** Kurum içindeki veri akışını "Audit Logs" üzerinden denetleyerek "veri sızıntısı olmadan önce (proactive)" sistemi kilitleyen yöneticiler.

- **Bireysel Kullanıcılar (Privacy-Conscious):** Dijital ayak izini ve kişisel verilerini dev teknoloji şirketlerinin eğitim veritabanlarından korumak isteyen herkes.

## 9. Özet (Summary)

Privacy-First Nexus, LLM ekosistemindeki gizlilik sorununa yüzeysel bir kural seti (regex) ile değil; istemci tarafında çalışan yapay zeka (Edge-AI) ve akıllı bulanık çözümleme (Fuzzy De-masking) algoritmalarıyla yaklaşan yapısal bir çözümdür. V1 fazında ChatGPT platformuna odaklanarak, verinin tarayıcı sınırlarını terk etmeden anonimleştiği ve geri çözüldüğü deterministik bir Sıfır Güven (Zero-Trust) köprüsü inşa etmeyi hedefler.

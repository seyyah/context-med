# context-shield

*Kullanıcıların ve kurumların hassas verilerini (PII) bulut sunucularına göndermeden, doğrudan cihaz üzerinde (Edge-AI) çalışan sıfır güven (Zero-Trust) mimarisine sahip, yapay zeka destekli otonom veri maskeleme katmanı.*

> Bu belge IDEA standardını takip etmektedir. Hiçbir kod yazılmadan önce context-shield platformunun ne olduğunu, neden var olması gerektiğini ve teknik sınırlarını açıklar. Bu belge 10-draft-ideas/edge-privacy.md felsefesine sıkı sıkıya bağlıdır.. 

---

## 1. Tez (Thesis)

**Tez:** Bulut tabanlı LLM (Büyük Dil Modeli) ekosistemlerinde veri gizliliği katmanı LLM'in veya sunucunun sorumluluğunda değil; **doğrudan kullanıcının cihazında (Edge), sıfır güven (Zero-Trust) mimarisiyle çözülmelidir.**

**Alternatiflerle Karşılaştırma:**
* *Sunucu Taraflı Anonimizasyon (Örn: Google DLP):* Veri LLM sağlayıcısına veya aracı bir API'ye ulaştıktan sonra maskelenmesi, "Data Breach" (veri ihlali) ve "Man-in-the-Middle" risklerini barındırır.
* *Model Fine-Tuning (PII Unutturma):* Maliyetlidir, katastrofik unutmaya (catastrophic forgetting) yol açar ve kullanıcı özelindeki anlık verilerin gizliliğini dinamik olarak çözemez.
* *İstemci Taraflı (context-shield Yaklaşımı):* Veri, tarayıcı sınırlarını terk etmeden yerel bir model ile sentetik tokenlara dönüştürülerek maskelenir. Bulut sunucusu sadece bu maskeli veriyi görür. Sistemin gizlilik garantisi, yerel NER modelinin PII tespit başarısıyla (Recall) sınırlıdır. *(Not: Veri şifrelenmez, tokenize edilir).*

---

## 2. Problem

* **Bağlamsal Zafiyet:** Klasik statik maskeleme yöntemleri (Regex/Kurallar) "Ayşe bugün istifa etti" cümlesindeki ismi yakalayamaz; yüksek oranda "False Positive" (hatalı pozitif) üretir.
* **De-masking (Çözümleme) Kırılganlığı:** Bir LLM'e `[KİŞİ_1]` gönderildiğinde, yanıt üretilirken Türkçe'nin yapısı gereği `[KİŞİ_1]'e` veya `Kişi 1` şeklinde mutasyona uğrayarak dönebilir. JSON map eşleşmesinin bozulması mevcut sistemlerin en büyük mühendislik darboğazıdır.
* **DOM Manipülasyon Zorluğu:** Modern LLM arayüzleri (ChatGPT, Claude) React/Vue gibi Virtual DOM yapıları kullanır. Dışarıdan enjekte edilen statik içerikler sistem tarafından reddedilir veya akışı bozar.

---

## 3. Neden Şimdi? (Why Now)

Bu projenin bugün yapılabilir olmasının itici güçleri:
1. **Edge-AI ve WebAssembly Olgunluğu:** HuggingFace `Transformers.js` ve ONNX Runtime'ın WASM desteği, eskiden GB'larca RAM isteyen NER modellerinin tarayıcı içinde MB seviyesinde ve düşük gecikmeyle (latency < 100ms) çalışabilmesini sağladı.
2. **Built-in AI Standartlaşması:** Google Chrome 127+ ile gelen deneysel Gemini Nano (WebNN API), donanım hızlandırmalı LLM'leri tarayıcı yereline indirerek bu mimarinin gelecekteki standart olacağının sinyalini verdi.
3. **KVKK/GDPR Baskısı:** Artan veri ihlalleri nedeniyle Apple ve Samsung gibi devlerin şirket içi ChatGPT kullanımını yasaklaması, kurumları üretkenlik krizine soktu. Yerel maskeleme katmanı acil bir pazar ihtiyacıdır.

---

## 4. Nasıl Çalışır (How It Works)

Proje, üç temel içgörü (insight) üzerinden çalışır:

* **İçgörü 1: Edge-AI ile Otonom NER Sınıflandırması:** Sistem, kullanıcı metin giriş alanına (input) veri yazdığında, bunu dış bir API'ye göndermez. Tarayıcı içindeki SLM (Small Language Model) ile metni analiz eder ve `Ahmet, 50.000 TL transfer etti` metnini `[KİŞİ_1], [MİKTAR_1] transfer etti` olarak dönüştürür.
* **İçgörü 2: Güvenli JSON State Management (Haritalama):** Maskelenen orijinal veriler (Ahmet = KİŞİ_1), sadece o sekmeye ait geçici bellek durumunda (Local Session State) tutulur. Sayfa kapandığında yok olur.

### İçgörü 3: Fuzzy De-Masking Engine (Bulanık Çözümleme Motoru)
LLM çıktılarındaki token mutasyonlarını çözmek sistemin kalbidir.
* **Levenshtein Eşik Değeri:** Hata toleransı sabit değildir. `(Mesafe / Kelime Uzunluğu) <= 0.3` formülüyle dinamik hesaplanır. `[KİŞİ_1]` ve `[KİŞİ_2]` arasındaki "False Positive" çakışmasını önlemek için harf mesafesinin yanı sıra "Positional Matching" (cümle içi sıralı konum) kontrolü de yapılır.
* **Türkçe Ek Morfolojisi:** Ekler statik bir listeden değil, Regex yakalama grupları `(\[.*?_.*?\])(['’]?[a-zçğıöşü]+)?` ile ayrıştırılır.

**Edge Case (Uç Durum) Tablosu:**

| Girdi / Senaryo | LLM Yanıtı (Mutasyon) | context-shield Çözümleme Eylemi | Nihai Çıktı |
| :--- | :--- | :--- | :--- |
| Çekim Eki Eklendi | `[KİŞİ_1]'e haber ver.` | Regex ile `'e` ayrıştırılır, base token map'ten bulunur, ek birleştirilir. | `Ahmet'e haber ver.` |
| Harf/Format Hatası | `[kisi_1] aradı.` | Mesafe=2, Uzunluk=8. Tolerans < 0.3 geçer. Eşleşme sağlanır. | `Ahmet aradı.` |
| Halüsinasyon (Silinme) | `Kişi aradı.` | Maske kaybolduğu için Levenshtein çalışmaz. Sistem tooltip uyarısı verir. | `Kişi aradı.` ⚠️ |

**De-Masking Algoritması (Pseudo-code):**
```javascript
function fuzzyDemask(llmResponse, localVaultMap) {
    const tokenRegex = /(\[?[a-zA-ZçğıöşüÇĞİÖŞÜ]+_\d+\]?)(['’]?[a-zçğıöşü]+)?/gi;
    
    return llmResponse.replace(tokenRegex, (match, baseToken, suffix) => {
        let bestMatch = null, lowestDistance = Infinity;

        for (const [key, value] of Object.entries(localVaultMap)) {
            let dist = calculateLevenshtein(baseToken.toUpperCase(), key);
            let threshold = Math.ceil(key.length * 0.3); // %30 tolerans

            if (dist <= threshold && dist < lowestDistance) {
                lowestDistance = dist;
                bestMatch = value;
            }
        }
        return bestMatch ? (suffix ? bestMatch + suffix : bestMatch) : match;
    });
}
```

---

## 5. DOM Manipülasyon Stratejisi
React tabanlı modern arayüzlerde (ChatGPT) çalışabilmek için özel yöntemler gerekir:
* **Input Interception:** Virtual DOM'u bozmamak adına `contenteditable` veya `textarea` elemanlarına doğrudan müdahale etmek yerine, React'in dahili `onChange` event listener'ları override edilir (Event Delegation).
* **Streaming (SSE) De-Masking:** LLM yanıtları kelime kelime gelirken, yarım kalan tokenlar (`[KİŞ`) ekrana basılmadan bir "Sliding Window Buffer" (Kayan Pencere Tamponu) içinde tutulur. Token kapandığında (`[KİŞİ_1]`) de-masking işlemi çalışır ve DOM'a aktarılır.
* **Mutation Observer:** OpenAI'ın sık DOM değişikliklerine karşı, statik CSS selector'lar yerine HTML tag hiyerarşisini izleyen dinamik observer'lar kullanılır.

---

## 6. Ekosistem Entegrasyonu ve Aktif Dosya Müdahalesi (context-shield-ext)
context-shield, başlı başına izole bir çözüm olmaktan öte `context-core` ekosistemi ile entegre çalışacak şekilde projelendirilmektedir. 
* **Chrome Eklentisi (context-shield-ext):** Sistem bir Chrome eklentisi olarak paketlenerek tüm LLM sekmelerinde (ChatGPT, Gemini vb.) arka planda aktif bir kalkan görevi görür.
* **Dosya Yükleme (Upload) Müdahalesi:** Sadece metin kutusuna yazılan verilere değil; LLM'e bir Excel, PDF veya CSV dosyası yüklenmek istendiğinde eklenti doğrudan dosya yükleme olayını (upload event) yakalayarak araya girer.
* **Otonom Temizlik Onayı:** Kullanıcıya dinamik bir arayüzle *"Dikkat: Bu Excel tablosu yüksek oranda PII (İsim, TC Kimlik, Maaş vb.) içeriyor. Yüklemeden önce dosya içeriğini yerel cihazınızda temizleyip, maskelenmiş sentetik verilerle güvenli yeni bir dosya olarak LLM'e sunmamı ister misiniz?"* şeklinde proaktif bir güvenlik teklifi sunar.

---

## 7. Ne Yapmaz (What It Does Not Do)
* Bulutta herhangi bir PII verisi depolamaz veya telemetri toplamaz.
* Şifreleme/Çözme işlemi için harici bir sunucu API'sine istek atmaz.
* Her web sitesinde çalışan genel bir araç değildir; yalnızca LLM arayüzleri için tasarlanmıştır.

---

## 8. Kısıtlamalar ve Fizibilite (Constraints)
* **Chrome Built-in AI Deneyimselliği:** Gemini Nano API şu an deneyseldir. *Fallback Mekanizması:* Built-in AI bulunmayan cihazlarda sistem, `Transformers.js` kullanarak tarayıcıya (WASM) önbelleğe alınmış hafifletilmiş (Quantized ONNX) bir Türkçe NER modeli yükleyerek çalışmaya devam edecektir.
* **Çoklu Platform Uyumu:** ChatGPT, Claude ve Gemini arayüzlerinin DOM yapıları farklıdır. Projenin V1 fazı bilinçli bir kısıt olarak yalnızca `chatgpt.com` DOM yapısına entegre olacaktır.

---

## 9. Uygulama Yol Haritası (Faz Planı)
* **Faz 1 (MVP - Ay 1):** Regex tabanlı maskeleme, ChatGPT DOM interception ve temel JSON Session Management.
* **Faz 2 (Core Engine - Ay 2):** Transformers.js ile yerel Türkçe NER modelinin entegrasyonu ve Fuzzy De-Masking algoritmasının yazılması.
* **Faz 3 (V2 Vizyonu):** Claude ve Gemini arayüzleri için "Abstract DOM Adapter" mimarisinin geliştirilmesi ve NotebookLM yerel doküman entegrasyonları.
* **Faz 4 (Dosya Analizi - V3 Vizyonu):** Eklentinin dosya okuma/yazma (Excel, CSV) yeteneklerini kazanması ve `context-core` modülleri ile entegrasyonu.

---

## 10. Riskler ve Zorluklar (Risks)
* **Türkçe NER Başarımı:** Türkçe'nin karmaşık morfolojisi nedeniyle bağlamsal PII tespiti zorludur. Modelin isimleri cins isimlerle (örneğin: "Kaya", "Deniz") karıştırması risktir.
* **LLM Halüsinasyonu ile Token Kaybı:** LLM'in maskelenmiş `[KİŞİ_1]` tokenini tamamen yok etmesi durumunda orijinal verinin geri yüklenememesi (Loss of Information) riski mevcuttur.

---

## 11. Başarı Kriterleri (Success Criteria)
1. **Türkçe PII Sınıflandırma (NER):** HuggingFace Turkish-NER veri seti üzerinden yapılacak eval testlerinde Precision (Kesinlik) > %90 ve Recall (Duyarlılık) > %85 hedefine ulaşılması.
2. **De-masking Başarısı:** Çeşitli çekim ekleri eklenmiş sentetik LLM yanıt testlerinde, maskelenen verinin ekrana orijinal haliyle kayıpsız dönme oranının > %95 olması.
3. **İstemci Gecikmesi (Latency):** Modelin istemci tarafındaki (Edge) NER analizinin ve DOM manipülasyonunun yarattığı ek gecikmenin (overhead) < 400ms olması.

---

## 12. Kim Fayda Sağlar (Who Benefits)
* **Kurumsal Çalışanlar:** ChatGPT'yi şirket gizlilik politikaları (NDA) nedeniyle kullanamayan profesyoneller.
* **Hukuk, Finans ve Sağlık Uzmanları (Compliance):** Hasta/müşteri verilerini (PII, PHI) işlemek zorunda olan, ancak buluta göndermesi yasak olan meslek grupları.
* **Siber Güvenlik Ekipleri:** Kurum içi veri akışını "Audit Logs" üzerinden denetleyen sistem yöneticileri.

---

## 13. Özet (Summary)
context-shield, LLM ekosistemindeki gizlilik sorununa yüzeysel bir kural seti (regex) ile değil; istemci tarafında çalışan yapay zeka (Edge-AI) ve akıllı bulanık çözümleme (Fuzzy De-masking) algoritmalarıyla yaklaşan yapısal bir çözümdür. V1 fazında ChatGPT platformuna odaklanarak, verinin tarayıcı sınırlarını terk etmeden anonimleştiği ve geri çözüldüğü deterministik bir Sıfır Güven (Zero-Trust) köprüsü inşa etmeyi hedefler. Modüler yapısı sayesinde gelecekte dosya şifreleme ve `context-core` entegrasyonlarına açıktır.

---

## 14. Referanslar
1. *Microsoft Presidio: Data Protection & Anonymization SDK*
2. *Google Cloud DLP (Data Loss Prevention) API Documentation*
3. *Levenshtein, V. I. (1966). Binary codes capable of correcting deletions, insertions, and reversals.*
4. *Xenova / Transformers.js: State-of-the-art Machine Learning for the Web*
5. *HuggingFace Turkish NER Datasets & Evaluation Metrics*

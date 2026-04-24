# context-med: Sağlık Kuruluşları için Yeni Nesil Kişiselleştirilmiş Hasta Deneyimi

**Proje:** context-med (Medikal Bağlam Platformu)
**Modül:** context-kiosk (Yapay Zeka Destekli Hasta Karşılama ve Bağlamsal Triaj Sistemi)
**Versiyon:** 0.2.0-alpha
**Tarih:** Nisan 2026
**Mimari Sahiplik:** xtatistix/dev

---

## 1. Vizyon: Hastayı Tanıyan, Hatırlayan, Bağlam Kuran Sağlık Deneyimi

### 1.1 Temel Paradigma Değişimi

Geleneksel sağlık self-servis sistemleri **durumsuz (stateless)** çalışır: Her etkileşim sıfırdan başlar, hasta her seferinde aynı bilgileri tekrar verir, sistem geçmiş şikayetleri, tedavi süreçlerini veya tercihleri hatırlamaz.

**context-kiosk**, bunun tam tersi bir yaklaşım sunar:

> **"Hastayı Tanıyan, Geçmişini Hatırlayan, Bağlamında Anlayan Yapay Zeka Asistanı"**

### 1.2 Temel Felsefe

Modern sağlık kuruluşlarında hasta deneyimi, teknolojik altyapının hızına yetişememiştir. Mevcut sistemler ya tamamen personel bağımlıdır (danışma, kayıt) ya da statik self-servis çözümlere (sayısal sıra makineleri, dokunmatik ekranlar) dayanır.

**context-kiosk**, sağlık kuruluşlarının operasyonel darboğazlarını çözmek ve hasta deneyimini kişiselleştirmek için tasarlanmış **biyometrik tanıma, bağlamsal hafıza ve yapay zeka triaj** platformudur.

**Amaç:**
- Hastayı **yüz ve ses** ile tanıyarak kişiselleştirilmiş karşılama
- **Geçmiş konuşmaları, şikayetleri, tedavi süreçlerini** hatırlayarak bağlamsal yönlendirme
- Sağlık personelinin rutin işlerini (randevu kontrolü, poliklinik yönlendirme, temel bilgilendirme) yapay zeka ile otomatize ederek, sağlık profesyonellerinin gerçek tıbbi görevlere odaklanmasını sağlamak
- Hasta yolculuğunda **süreklilik (continuity of care)** hissi yaratmak

**Amaç Değildir:**
Tıbbi tanı koymak, reçete yazmak veya sağlık personelinin yerini almak. Sistem bir **bağlamsal bilgilendirme ve yönlendirme asistanı**dır, klinik karar verme aracı değildir.

---

## 2. Sağlık Sektöründeki Acı Noktalar ve context-kiosk Çözümleri

### 2.1 Mevcut Durum: Hasta ve Kurum Perspektifi

| **Sorun** | **Hasta Deneyimi** | **Kurum Yükü** | **context-kiosk Çözümü** |
|-----------|-------------------|----------------|--------------------------|
| **Tekrarlayan Bilgi Girişi** | "Her gelişimde aynı bilgileri yeniden söylüyorum" | Kayıt personeli %30 zamanını veri tekrarına harcar | **Yüz/ses tanıma** ile otomatik kimlik doğrulama, HIS'ten geçmiş çekme |
| **Bağlam Kaybı** | "2 hafta önce bel ağrısı için geldim, şimdi kontrol için geldim ama sistem hatırlamıyor" | Personel hasta dosyasını manuel araştırır | **Conversation Memory**: "Hoş geldiniz Bay Yılmaz, 15 Nisan'daki bel ağrısı kontrolü için mi geldiniz?" |
| **Uzun Kayıt Süreçleri** | Sabah 08:00'de danışmada 20-30 dakika kuyruk | Kayıt personeli operasyonel kapasitenin %40'ını rutin işlere harcar | **< 45 saniye** otomatik kayıt (yüz tanıma + ses onay) |
| **Poliklinik Şaşkınlığı** | "Bel ağrım için Ortopedi mi Fizik Tedavi mi?" | Yanlış poliklinik başvuruları, gereksiz yönlendirmeler | **Bağlamsal Triaj**: "Geçen ay MR çektirmiştiniz, sonucu Dr. Mehmet Yılmaz değerlendirecekti. Ortopedi'ye yönlendiriyorum" |
| **Dijital Uçurum** | 60+ yaş grubu, kiosklarda kaybolur veya personele bağımlıdır | Self-servis sistemlerden %70 kullanıcı yararlanamıyor | **Sesli etkileşim + Yüz tanıma**: "Günaydın Ayşe Hanım, size yardımcı olayım" |

### 2.2 Beklentiler ve Sektör Gerçekleri

- **%68 hasta**, hastanede bekleme süresini azaltacak teknolojik çözümler bekliyor *(Kaynak: Sağlık Bakanlığı Hasta Memnuniyeti Anketi 2024)*
- **%52 hasta**, sesli/konuşarak etkileşim kurabileceği self-servis sistemleri tercih ediyor
- **%81 hasta**, kendilerini "tanıyan" sağlık sistemlerine daha fazla güveniyor *(Kaynak: Accenture Digital Health Survey 2025)*
- **KVKK ve Sağlık Mevzuatı**: Biyometrik veri (yüz, ses) **özel kategoride hassas veridir**, açık rıza olmadan işlenemez
- **Tekinsiz Vadi (Uncanny Valley) Riski**: Hiper-gerçekçi avatarlar, sağlık ortamında güven kaybına neden olabilir

---

## 3. context-kiosk: Beş Duyu + Hafıza ve Bağlam

### 3.1 Temel Yetenekler (Multimodal AI + Biometric Stack)

#### **1. Görüyor ve Tanıyor (Vision + Facial Recognition)**

**Kullanım:**
- **Biyometrik Tanıma:** Hastayı yüz yapısından tanır, otomatik kimlik doğrulama
- **QR/Kimlik Okuma:** Kimlik kartı, e-Nabız QR kodu okuma
- **Davranış Analizi:** Kalabalık yoğunluğu, hasta aciliyet durumu (düşme, bayılma algılama)

**Teknik Stack:**
- **Yüz Tanıma:**
  - **Yerel (On-Premise):** InsightFace (ArcFace modeli) - ONNX Runtime üzerinde GPU inferans
  - **Veri Saklama:** Yüz verisi ASLA ham fotoğraf olarak saklanmaz, sadece **512-boyutlu embeddings (vektör)** PostgreSQL/pgvector'de şifrelenir
- **OCR (Kimlik Okuma):** Tesseract + EasyOCR (Türkçe optimized)
- **Obje Tespiti:** YOLO v8 (Düşme algılama, tekerlekli sandalye tanıma - erişilebilirlik)

**KVKK Uyumluluğu:**
- **Açık Rıza Mekanizması:** İlk kullanımda ekranda "Yüz tanıma ile hızlı giriş yapmak ister misiniz?" onay kutusu
- **Opt-Out (Vazgeçme) Hakkı:** Hasta istediği zaman yüz verisini silebilir (KVKK Md. 11)
- **Veri Minimizasyonu:** Yüz fotoğrafı çekilir → Embedding çıkarılır → Fotoğraf ANINDA silinir

**Örnek Senaryo:**
```
Hasta kiosk'a yaklaşır (2m mesafe)
→ Kamera yüz algılama yapar
→ Embedding çıkarılır: [0.234, -0.891, 0.456, ...]
→ Veritabanında eşleşme aranır (cosine similarity > 0.85)
→ Eşleşme bulunursa: "Günaydın Ayşe Hanım, 3 haftadır görmeyeli!"
→ Eşleşme yoksa: "Hoş geldiniz, kimliğinizi okutabilir misiniz?"
```

#### **2. Duyuyor ve Tanıyor (Speech-to-Text + Voice Biometrics)**

**Kullanım:**
- **Sesli Komut:** Doğal dil ile randevu kontrolü, poliklinik sorma
- **Ses İmzası (Voiceprint):** Hastayı ses tonundan tanır (İkinci faktör doğrulama)

**Teknik Stack:**
- **STT (Speech-to-Text):**
  - **Yerel:** Whisper Large v3 (Türkçe) - INT8 quantized, TensorRT optimized
  - **Bulut (Fallback):** Deepgram Nova-2 (Sadece anonim sorgular için)
- **Ses Biyometrisi:**
  - **Model:** Resemblyzer (Speaker Recognition) - 256-boyutlu ses embeddings
  - **Veri Saklama:** Ses kaydı ASLA saklanmaz, sadece vektör embedding

**KVKK Uyumluluğu:**
- Ses verisi de **biyometrik veri** kategorisindedir
- Yüz tanıma ile aynı açık rıza ve silme mekanizmaları

**Örnek Senaryo:**
```
Hasta: "Bel ağrım hala geçmedi"
→ STT: Metin çevirisi
→ Voiceprint: Ses embedding çıkarma
→ Eşleşme: "Mehmet Bey, 10 Nisan'da başlayan bel ağrısından bahsediyorsunuz değil mi?"
→ Context Memory devreye girer
```

#### **3. Konuşuyor (Text-to-Speech - Sesli Yanıt)**

**Kullanım:** Yönlendirme talimatları, randevu onayı, temel bilgilendirme

**Teknik Stack:**
- **Yerel:** Piper TTS (Türkçe doğal ses, 2-3 saniye gecikme)
- **Premium (Opsiyonel):** ElevenLabs (Sadece tanıtım videoları için)

**Ton Optimizasyonu:** Sakin, güven verici, tıbbi jargondan arınık dil

#### **4. Düşünüyor (LLM - Doğal Dil İşleme ve Karar)**

**Kullanım:** Hasta niyetini anlama, poliklinik öneri, bilgi bankası sorgulama

**Teknik Stack (Hibrit Model):**
- **Tier 1 - Yerel LLM:** Ollama Llama3.2 8B (Rutin sorgular, randevu kontrol, yönlendirme)
- **Tier 2 - Bulut LLM:** GPT-4o-mini veya Claude Haiku (Sadece anonim triaj sorguları için)
- **Kritik Kural:** TCKN, isim, tanı gibi hassas veriler ASLA bulut LLM'e gönderilmez

#### **5. Hatırlıyor (Context Memory + Conversation History)**

**Kullanım:** Geçmiş konuşmaları, şikayetleri, tercihleri hatırlama

**Teknik Stack:**
- **Short-Term Memory (Oturum Hafızası):**
  - Redis (Session storage) - 2 saatlik etkileşim geçmişi
  - Hasta kiosk'tan ayrılınca oturum kapanır, hassas veriler Redis'ten silinir

- **Long-Term Memory (Kalıcı Hafıza):**
  - PostgreSQL + pgvector (Conversation embeddings)
  - **Saklanan Veriler:**
    - Hasta ID (TCKN hash - SHA-256)
    - Konuşma özeti (LLM tarafından anonimize edilmiş): "Hasta 10 Nisan'da bel ağrısı şikayetiyle geldi, MR önerildi"
    - Tercihler: "Sabah randevularını tercih ediyor", "SMS ile hatırlatma istiyor"
  - **Saklanmayan Veriler:**
    - Ham konuşma metni (KVKK gereği 24 saat sonra silinir)
    - Yüz/ses fotoğrafı veya kaydı

- **Retrieval Augmented Generation (RAG):**
  - Hasta geldiğinde: Son 6 aylık konuşma özetleri vektör benzerliği ile çekilir
  - LLM'e context olarak verilir: "Bu hasta daha önce şu şikayetlerle gelmiş..."

**KVKK Uyumluluğu:**
- **Veri Saklama Süresi:**
  - Konuşma özetleri: 6 ay (Hasta onayı ile 2 yıla uzatılabilir)
  - Ham konuşma metni: 24 saat (Sadece denetim/debugging için)
- **Silinme Hakkı:** Hasta "Tüm geçmişimi silin" diyebilir (KVKK Md. 7)

**Örnek Memory Retrieval:**
```sql
-- Hasta yüz tanıma ile giriş yaptı (patient_id: 12345)
SELECT
  conversation_summary,
  created_at,
  embedding <-> query_embedding AS similarity
FROM conversation_memory
WHERE patient_id_hash = SHA256('12345')
  AND created_at > NOW() - INTERVAL '6 months'
ORDER BY similarity ASC
LIMIT 5;

-- Sonuç:
-- 1. "15 Nisan: Bel ağrısı şikayeti, Ortopedi'ye yönlendirildi" (similarity: 0.23)
-- 2. "22 Nisan: MR çekimi tamamlandı" (similarity: 0.31)
-- 3. "29 Nisan: Kontrol randevusu için geldi" (similarity: 0.18) ← Bugün
```

---

## 4. Mimari: Güvenlik Öncelikli Katmanlı Tasarım

### 4.1 Veri Akışı ve Gizlilik Katmanları

```
┌──────────────────────────────────────────────────────────────────┐
│  HASTA ETKİLEŞİMİ (Kiosk - Dokunmatik Ekran + Kamera + Mikrofon) │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Biometric Recognition Layer   │
        │  • Yüz Tanıma (InsightFace)    │
        │  • Ses Tanıma (Resemblyzer)    │
        │  • Embedding Extraction        │
        │  • Ham Veri ANINDA SİLİNİR     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  PII Detection & Masking Layer │  ← Hassas veri filtreleme
        │  • TCKN → SHA-256 hash         │
        │  • İsim → [HASTA]              │
        │  • Tanı → [TIBBİ_BİLGİ]       │
        └────────────┬───────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌─────────────────────┐
│ YEREL İŞLEME     │    │ BULUT İŞLEME        │
│ (On-Premise)     │    │ (Anonymized Only)   │
├──────────────────┤    ├─────────────────────┤
│ • Whisper STT    │    │ • Deepgram STT      │
│ • Ollama LLM     │    │ • GPT-4o-mini       │
│ • Piper TTS      │    │ • Claude Haiku      │
│ • InsightFace    │    │ (Sadece triaj)      │
│ • Resemblyzer    │    │                     │
└────────┬─────────┘    └────────┬────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Context Memory Layer          │
        │  • Redis (Short-term - 2 saat) │
        │  • PostgreSQL+pgvector (Long)  │
        │  • Conversation Embeddings     │
        │  • Patient Preferences         │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  HIS Integration Layer         │
        │  • HL7 FHIR / REST API         │
        │  • Randevu, Lab, Radyoloji     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Hastane Bilgi Sistemi (HIS)   │
        │  • Hasta Kayıtları             │
        │  • Randevu Sistemi             │
        │  • Laboratuvar/Radyoloji       │
        └────────────────────────────────┘
```

### 4.2 Memory ve Context Yönetimi Mimarisi

#### **Conversation Flow with Memory**

```
┌──────────────────────────────────────────────────────────────┐
│  1. HASTA GİRİŞİ                                              │
├──────────────────────────────────────────────────────────────┤
│  Yüz Tanıma → Embedding Match → patient_id: 12345            │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│  2. MEMORY RETRIEVAL (Geçmiş Çekme)                          │
├──────────────────────────────────────────────────────────────┤
│  PostgreSQL Query:                                           │
│  SELECT TOP 5 conversation_summary                           │
│  FROM conversation_memory                                    │
│  WHERE patient_id = 12345                                    │
│  AND created_at > NOW() - 6 months                           │
│  ORDER BY created_at DESC                                    │
│                                                               │
│  Sonuç:                                                       │
│  [                                                            │
│    "15 Nisan: Bel ağrısı, Ortopedi yönlendirildi",          │
│    "22 Nisan: MR çekimi yapıldı",                           │
│    "Tercih: Sabah randevuları, SMS hatırlatma"              │
│  ]                                                            │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│  3. LLM CONTEXT ENRICHMENT (Bağlam Zenginleştirme)           │
├──────────────────────────────────────────────────────────────┤
│  System Prompt:                                              │
│  "Sen bir hastane asistanısın. Karşındaki hasta:             │
│   - 15 Nisan'da bel ağrısı şikayetiyle geldi                 │
│   - 22 Nisan'da MR çekimi yaptırdı                           │
│   - Sabah randevularını tercih ediyor                        │
│   Şimdi seninle konuşuyor, bağlamı hatırla."                 │
│                                                               │
│  User Message: "Merhaba"                                     │
│                                                               │
│  LLM Response:                                               │
│  "Günaydın Bay Yılmaz! 22 Nisan'da çektirdiğiniz MR         │
│   sonuçları için mi geldiniz?"                               │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│  4. CONVERSATION SAVING (Konuşma Kaydetme)                   │
├──────────────────────────────────────────────────────────────┤
│  Hasta: "Evet, MR sonucu için geldim"                        │
│  Asistan: "Sonuçlarınız hazır, Dr. Mehmet Yılmaz            │
│            bugün 10:30'da değerlendirecek"                   │
│                                                               │
│  → Conversation Summary Oluştur (LLM ile):                   │
│    "29 Nisan: MR sonuç kontrolü için geldi,                  │
│     Dr. Yılmaz ile 10:30 randevu"                           │
│                                                               │
│  → PostgreSQL'e Kaydet:                                      │
│    INSERT INTO conversation_memory (                         │
│      patient_id_hash,                                        │
│      conversation_summary,                                   │
│      embedding,                                              │
│      created_at                                              │
│    ) VALUES (                                                │
│      SHA256('12345'),                                        │
│      '29 Nisan: MR sonuç kontrolü...',                      │
│      embedding_vector,                                       │
│      NOW()                                                   │
│    );                                                        │
│                                                               │
│  → Redis Session (2 saat):                                   │
│    SET session:12345:context JSON_DATA EX 7200               │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Güvenlik ve Uyumluluk

| **Gereksinim** | **Çözüm** | **Sertifikasyon/Standart** |
|----------------|-----------|----------------------------|
| **KVKK Biyometrik Veri** | Yüz/ses fotoğrafı çekilmez, sadece embedding (vektör) saklanır | KVKK Md. 6 (Özel Nitelikli Kişisel Veri) |
| **Açık Rıza (Explicit Consent)** | İlk kullanımda "Yüz/ses tanıma onayı" checkbox + SMS doğrulama | KVKK Md. 5 |
| **Veri Minimizasyonu** | Ham fotoğraf/ses → Embedding çıkar → Ham veri ANINDA sil | GDPR Art. 5(1)(c) |
| **Silinme Hakkı (Right to Erasure)** | Hasta "Verilerimi sil" butonu → Tüm embeddings ve memory silinir | KVKK Md. 7 |
| **Veri Saklama Süresi** | Conversation summary: 6 ay (varsayılan), hasta onayı ile 2 yıl | Sağlık Bakanlığı Yönergesi |
| **Şifreleme** | PostgreSQL: TDE (Transparent Data Encryption), AES-256 | ISO 27001, HL7 Security |
| **Denetim İzi (Audit Log)** | Tüm biyometrik eşleşme ve memory erişimleri loglanır | ISO 27799 |
| **Tıbbi Cihaz Statüsü** | **Değildir** - Karar destek sistemi, tanı koyma yetkisi yok | MDR Class I (Bilgilendirme) |

---

## 5. Hasta Yolculuğu: Bağlamsal 4 Adım

### Senaryo 1: İlk Kez Gelen Hasta (Memory Yok)

#### Adım 1: Karşılama ve Kayıt (30-45 saniye)

**Akış:**
```
Hasta kiosk'a yaklaşır
→ Proximity sensor algılar
→ "Hoş geldiniz! Size yardımcı olabilmem için kimliğinizi okutabilir misiniz?"
→ Hasta kimlik kartını gösterir
→ OCR: TCKN okuma (12345678901)
→ HIS Sorgusu: Hasta kaydı var mı?
  • Varsa → Randevu kontrolü
  • Yoksa → "İlk kez mi geliyorsunuz? Hızlı kayıt yapayım"

→ "Bir sonraki ziyaretinizde sizi tanımamı ister misiniz?
   (Yüz tanıma ile hızlı giriş - Gizlilik bildirimimizi okuyun)"

  [EVET, HIZLI GİRİŞ İSTİYORUM]  [HAYIR, HER SEFERINDE SORMANI İSTERİM]

→ EVET seçilirse:
  • Yüz fotoğrafı çek → Embedding çıkar → Fotoğraf sil → Embedding kaydet
  • "Teşekkürler! Bir dahaki gelişinizde sizi tanıyacağım."
```

**KPI:** Ortalama kayıt süresi 3 dakikadan → **45 saniyeye** düşürülür

---

### Senaryo 2: Tekrar Gelen Hasta (Memory Var)

#### Adım 1: Proaktif Karşılama (10-15 saniye)

**Akış:**
```
Hasta kiosk'a yaklaşır (2m mesafe)
→ Kamera yüz algılama
→ Embedding çıkarma: [0.234, -0.891, ...]
→ Veritabanı eşleşme: patient_id: 12345 (cosine similarity: 0.92)
→ Memory Retrieval: Son 6 aylık geçmiş

[EKRANDA]
👤 Günaydın Mehmet Bey!

🗓️ Son ziyaretiniz: 22 Nisan 2026
📋 Bel ağrısı için MR çektirmiştiniz
👨‍⚕️ Bugün Dr. Yılmaz ile kontrol randevunuz var (10:30)

Doğru mu?
[EVET, RANDEVUYA GELDİM]  [HAYIR, BAŞKA BİR KONU İÇİN GELDİM]
```

**Teknik Detay:**
```python
# Memory Retrieval Pipeline
patient_memory = {
  "last_visit": "2026-04-22",
  "chief_complaint": "Bel ağrısı",
  "last_action": "MR çekimi",
  "preferences": {
    "preferred_time": "morning",
    "notification": "sms"
  },
  "upcoming_appointments": [
    {
      "date": "2026-04-29 10:30",
      "doctor": "Dr. Mehmet Yılmaz",
      "department": "Ortopedi"
    }
  ]
}

# LLM Prompt Enrichment
system_prompt = f"""
Sen bir hastane asistanısın. Karşındaki hasta:
- İsim: Mehmet Bey
- Son ziyaret: {patient_memory['last_visit']}
- Şikayet: {patient_memory['chief_complaint']}
- Son işlem: {patient_memory['last_action']}
- Bugünkü randevu: {patient_memory['upcoming_appointments'][0]}

Hastayı tanıdığını belli edecek şekilde samimi ve yardımcı ol.
ASLA tıbbi tanı koyma, sadece yönlendir.
"""
```

#### Adım 2: Bağlamsal Triaj (15-20 saniye)

**Senaryo A: Hasta randevu onaylarsa**
```
Hasta: [EVET butonuna basar]
→ "Harika! Ortopedi polikliniği 2. katta, 215 numaralı oda.
   Sıra numaranız: A12
   Dr. Yılmaz'ın önünde 2 hasta var, tahmini 20 dakika bekleme.

   MR sonuçlarınız sisteme yüklenmiş, doktorunuz görebilecek."

→ Sıra fişi bas
→ SMS gönder: "Sıra numaranız A12, 2. kat Ortopedi, Oda 215"
```

**Senaryo B: Hasta farklı bir şikayet söylerse**
```
Hasta: [HAYIR butonuna basar]
Asistan (sesli): "Anladım, size nasıl yardımcı olabilirim?"

Hasta (sesli): "Aslında bel ağrım geçti ama şimdi boynumda ağrı var"

→ STT: "boynumda ağrı var"
→ LLM Context Reasoning:
  • Geçmiş: Bel ağrısı → Ortopedi
  • Yeni şikayet: Boyun ağrısı
  • Öneri: Ortopedi veya Fizik Tedavi

Asistan: "Anladım Mehmet Bey. Boyun ağrısı da kas-iskelet sistemiyle ilgili,
          10:30'daki Dr. Yılmaz randevunuzda hem bel hem boyun ağrınızı
          bahsedebilirsiniz. Ancak acil bir durum varsa Acil Polikliniğimize
          de yönlendirebilirim. Ne yapmak istersiniz?"

[RANDEVUMU KORUYACAĞIM]  [ACİL POLİKLİNİK İSTİYORUM]
```

**KPI:**
- Bağlamsal yönlendirme doğruluğu: **%85+**
- Yanlış poliklinik başvurusu: **%30 azalma**

#### Adım 3: İşlem ve Entegrasyon (10-15 saniye)

**HIS Entegrasyonu:**
```
1. Randevu doğrulama (HIS API GET /appointments/12345)
2. Sıra numarası oluşturma (Queue System POST /queue/ortopedi)
3. Doktor bilgisi çekme (HIS API GET /doctors/mehmet-yilmaz)
4. MR sonuç durumu (Lab System GET /results/12345)
5. SMS/E-posta gönderme (Notification Service)
```

#### Adım 4: Bilgilendirme ve Memory Update (5-10 saniye)

**Akış:**
```
Asistan: "Röntgen veya yeni bir tetkik isterse Radyoloji zemin katta.
          Reçete yazılırsa Eczane 1. katta.
          İyi günler Mehmet Bey, geçmiş olsun!"

→ Conversation Summary Oluştur:
  "29 Nisan: MR sonuç kontrolü için geldi, Dr. Yılmaz Ortopedi randevusu,
   Boyun ağrısı şikayeti de ekledi"

→ PostgreSQL'e Kaydet:
  INSERT INTO conversation_memory (
    patient_id_hash,
    conversation_summary,
    embedding,
    metadata
  ) VALUES (
    SHA256('12345'),
    '29 Nisan: MR sonuç kontrolü, boyun ağrısı eklendi',
    generate_embedding(summary),
    '{"department": "ortopedi", "doctor": "yilmaz", "symptoms": ["bel", "boyun"]}'
  );

→ Redis Session Temizle (Hasta ayrılınca):
  DEL session:12345:context
```

**KPI:**
- Memory hatırlama doğruluğu: **%90+**
- Hasta "beni tanıdı" memnuniyeti: **%80+** (NPS etkisi)

---

## 6. Omnichannel Erişim Stratejisi

### 6.1 Fiziksel Kiosk (Öncelik 1)

**Donanım Gereksinimleri:**
- **Ekran:** 32" dokunmatik ekran (IP65 - hijyen temizliği dayanıklı)
- **İşlemci:** NVIDIA Jetson Orin Nano (16GB) veya Orin NX
  - Yüz tanıma: 30 FPS
  - STT (Whisper): Real-time
  - LLM (Ollama): 20 tokens/sec
- **Kamera:**
  - Ana kamera: Intel RealSense D455 (Depth + RGB, 1080p)
  - Yüz tanıma için IR (kızılötesi) destek - Düşük ışıkta çalışma
- **Mikrofon:** Respeaker Mic Array v2.0 (Gürültü önleyici, 5m menzil)
- **Termal Yazıcı:** Sıra fişi/randevu fişi basımı
- **Bağlantı:**
  - LAN (Gigabit Ethernet - HIS entegrasyonu)
  - Wi-Fi 6 (Yedek)
  - VPN (Bulut LLM fallback için)

**Konumlar:**
- Hastane girişi (Ana karşılama + kayıt)
- Poliklinik koridorları (Yönlendirme)
- Laboratuvar/Radyoloji bekleme (Bilgilendirme)

### 6.2 Mobil Uygulama Entegrasyonu (Öncelik 2)

**Kullanım:**
Hasta QR kod okutarak mobil uygulamadan aynı context'e erişir

**Özellikler:**
- **Sesli asistan** (mobilde)
- **Memory senkronizasyonu:** Kiosk'ta başladığı konuşma, mobilde devam eder
- **Push notification:** "Randevunuza 15 dakika kaldı, 2. kat Ortopedi"

### 6.3 Web Portalı (Öncelik 3)

Tarayıcı üzerinden erişim (COVID-19 gibi salgınlarda fiziksel teması azaltmak için)

---

## 7. Teknik Stack: Modüler ve Ölçeklenebilir

### 7.1 Katman Bazlı Mimari

```
┌───────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (UI/UX)                                   │
│  • React Native (Mobil/Web/Kiosk Unified UI)                  │
│  • Accessibility: Büyük butonlar, sesli geri bildirim         │
│  • Avatar: 2D Animated Character (Duolingo-style, opsiyonel)  │
└─────────────────────┬─────────────────────────────────────────┘
                      │
┌─────────────────────┴─────────────────────────────────────────┐
│  APPLICATION LAYER (İş Mantığı)                               │
│  • NestJS/FastAPI (API Gateway)                               │
│  • Redis (Session/Cache - 2 saat)                             │
│  • PostgreSQL + pgvector (Long-term Memory)                   │
│  • RabbitMQ (HIS async messaging)                             │
└─────────────────────┬─────────────────────────────────────────┘
                      │
┌─────────────────────┴─────────────────────────────────────────┐
│  AI INFERENCE LAYER                                           │
│  • InsightFace (Yüz tanıma - ONNX)                            │
│  • Resemblyzer (Ses tanıma - PyTorch)                         │
│  • Ollama Llama3.2 8B (Yerel LLM - Docker)                    │
│  • Whisper Large v3 (STT - TensorRT)                          │
│  • Piper (TTS - Python service)                               │
│  • YOLO v8 (Vision - OpenCV)                                  │
└─────────────────────┬─────────────────────────────────────────┘
                      │
┌─────────────────────┴─────────────────────────────────────────┐
│  MEMORY & CONTEXT LAYER                                       │
│  • Redis: Short-term (2 saat session)                         │
│  • PostgreSQL+pgvector: Long-term (6 ay-2 yıl)                │
│  • Embedding Models:                                          │
│    - sentence-transformers/paraphrase-multilingual-mpnet-base │
│    - OpenAI text-embedding-3-small (Fallback)                 │
└─────────────────────┬─────────────────────────────────────────┘
                      │
┌─────────────────────┴─────────────────────────────────────────┐
│  INTEGRATION LAYER (HIS Bağlantısı)                           │
│  • HL7 FHIR API (Standart sağlık veri değişimi)               │
│  • REST API (Hastane özel sistemleri: Enlil, Probel, vb.)    │
│  • Kafka/RabbitMQ (Asenkron mesajlaşma)                       │
└───────────────────────────────────────────────────────────────┘
```

### 7.2 Database Schema (Memory & Biometric)

```sql
-- Biyometrik Veri (Sadece Embedding)
CREATE TABLE patient_biometrics (
  id UUID PRIMARY KEY,
  patient_id_hash VARCHAR(64) NOT NULL, -- SHA-256(TCKN)
  face_embedding VECTOR(512),            -- InsightFace embedding
  voice_embedding VECTOR(256),           -- Resemblyzer embedding
  consent_given BOOLEAN DEFAULT FALSE,   -- KVKK açık rıza
  consent_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_face_embedding USING ivfflat (face_embedding vector_cosine_ops),
  INDEX idx_voice_embedding USING ivfflat (voice_embedding vector_cosine_ops)
);

-- Konuşma Hafızası
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY,
  patient_id_hash VARCHAR(64) NOT NULL,
  conversation_summary TEXT NOT NULL,   -- Anonimize edilmiş özet
  embedding VECTOR(768),                 -- Sentence transformer embedding
  metadata JSONB,                        -- {department, symptoms, preferences}
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                  -- 6 ay sonra otomatik silinir
  INDEX idx_patient USING hash (patient_id_hash),
  INDEX idx_embedding USING ivfflat (embedding vector_cosine_ops),
  INDEX idx_expires USING btree (expires_at)
);

-- Hasta Tercihleri
CREATE TABLE patient_preferences (
  patient_id_hash VARCHAR(64) PRIMARY KEY,
  preferred_appointment_time VARCHAR(20), -- 'morning', 'afternoon'
  notification_method VARCHAR(20),        -- 'sms', 'email', 'both'
  language VARCHAR(10) DEFAULT 'tr',      -- 'tr', 'en', 'ar'
  accessibility_needs JSONB,              -- {wheelchair: true, hearing_aid: false}
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Denetim Günlüğü (Audit Log)
CREATE TABLE biometric_audit_log (
  id UUID PRIMARY KEY,
  patient_id_hash VARCHAR(64),
  event_type VARCHAR(50),  -- 'face_recognition', 'voice_recognition', 'memory_access'
  success BOOLEAN,
  similarity_score FLOAT,  -- Eşleşme skoru
  ip_address INET,
  kiosk_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- KVKK Veri Saklama Politikası (Otomatik Silme)
CREATE OR REPLACE FUNCTION auto_delete_expired_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM conversation_memory
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Her gün 03:00'te çalışacak cron job
SELECT cron.schedule('auto-delete-conversations', '0 3 * * *', 'SELECT auto_delete_expired_conversations();');
```

### 7.3 Deployment Modeli

**Öneri:** Hibrit (Edge + Cloud)

| **Bileşen** | **Konum** | **Neden** |
|-------------|-----------|-----------|
| Yüz/Ses Tanıma | Edge (Jetson Orin) | Biyometrik veri ASLA ağa çıkmaz |
| Whisper STT | Edge | Düşük gecikme, gizlilik |
| Ollama LLM | Edge | KVKK uyumlu, offline çalışır |
| Piper TTS | Edge | Hızlı yanıt |
| Memory (Redis) | Edge | Session verisi yerel kalır |
| Memory (PostgreSQL) | On-Premise Server | Merkezi hafıza, yedekleme |
| GPT-4o-mini (Fallback) | Cloud | Sadece anonim triaj sorguları |
| Analytics & BI | Cloud | Kimliksiz kullanım metrikleri |

---

## 8. Gerçekçi Riskler ve Sınırlamalar

### 8.1 Teknik Kör Noktalar

#### **Risk 1: "Yüz Tanıma Hata Oranı (False Positive/Negative)"**

**İddia:** Yüz tanıma %100 doğru çalışır.
**Gerçek:**
- **False Positive (Yanlış Eşleşme):** %0.1-1 (10000 hastada 10-100 yanlış tanıma)
- **False Negative (Tanımama):** %5-10 (Yaşlanma, ameliyat, gözlük değişimi)

**Çözüm:**
- **İkinci Faktör Doğrulama:** Yüz tanıma + Doğum tarihi sorma
- **Threshold (Eşik) Ayarı:** Similarity > 0.90 (Yüksek güvenlik), 0.85-0.90 arası ikinci doğrulama sor
- **Hata Raporlama:** "Sizi tanıyamadım, kimliğinizi gösterebilir misiniz?"

#### **Risk 2: "Memory Halüsinasyon - LLM Yanlış Hatırlama"**

**İddia:** LLM her zaman doğru hatırlar.
**Gerçek:** RAG (Retrieval Augmented Generation) kullanılsa bile, LLM bazen geçmişi yanlış yorumlayabilir.

**Örnek Hata:**
```
Gerçek Memory: "15 Nisan: Bel ağrısı, MR önerildi"
LLM Yanlış Yorumu: "15 Nisan'da MR çektirdiniz" (Aslında öneri, çekim değil)
```

**Çözüm:**
- **Kritik Bilgiler için Deterministik Kontrol:**
  - "MR çekildi mi?" → HIS'ten doğrudan sorgula (LLM'e güvenme)
- **Memory Güven Skoru:** Her memory kaydına confidence score ekle
- **Hata Düzeltme Mekanizması:** "Yanlış hatırladım, özür dilerim" butonu

#### **Risk 3: "Biyometrik Veri Sızıntısı"**

**İddia:** Embedding şifrelenir, güvenlidir.
**Gerçek:** Embedding'den orijinal yüz geri çıkarılamaz AMA başka bir sistemde aynı embedding ile eşleşme yapılabilir (Linkability Attack).

**Çözüm:**
- **Salting (Tuzlama):** Her hastane için unique salt ekle
  ```python
  face_embedding_salted = HMAC(face_embedding, hospital_secret_key)
  ```
- **Periyodik Re-Enrollment:** 2 yılda bir yüz embedding yenileme (Yaşlanma + güvenlik)
- **Encryption at Rest:** PostgreSQL Transparent Data Encryption (TDE)

#### **Risk 4: "HIS Entegrasyon Gecikmesi"**

**İddia:** Gerçek zamanlı HIS entegrasyonu.
**Gerçek:** Eski HIS sistemleri (Enlil, Probel) REST API yerine SOAP/HL7 v2 kullanır, cevap süresi 5-15 saniye.

**Çözüm:**
- **Asenkron Mesajlaşma:** RabbitMQ/Kafka ile non-blocking
- **Cache Katmanı:** Sık sorgulanan veriler (poliklinik listesi, doktor programı) Redis'te 15 dakika cache
- **Fallback UI:** "Randevunuz sorgulanıyor..." loading animasyonu

### 8.2 Operasyonel Sınırlamalar

| **Senaryo** | **Sistem Davranışı** | **Yedek Plan** |
|-------------|---------------------|----------------|
| **Yüz tanıma başarısız (maske, başörtü değişikliği)** | "Sizi tanıyamadım, kimlik okutabilir misiniz?" | Manuel TCKN girişi |
| **HIS sistemi çökerse** | Memory'den son 6 aylık geçmiş göster, "Randevu sorgulanamadı" uyarısı | Personele bildirim |
| **LLM halüsinasyon (yanlış poliklinik önerisi)** | Hasta şikayet ederse → Personel override butonu → Hata raporu | Deterministik karar ağaçları kullan |
| **Hasta "Verilerimi sil" der** | Tüm embeddings + memory 7 gün içinde silinir (KVKK uyumluluk) | Silme onayı e-posta ile |
| **İkiz hasta (identical twins)** | Yüz tanıma %99 benzerlik → İkinci faktör: Doğum yeri sorusu | Personel müdahalesi |

### 8.3 Etik ve Sosyal Riskler

#### **Risk 1: "Gözetim Hissi (Surveillance Anxiety)"**

**Sorun:** Hastalar "Beni izliyorlar mı?" hissi yaşayabilir.

**Çözüm:**
- **Şeffaflık:** Kiosk üzerinde "Gizlilik Duvarı" butonu → Ne saklıyoruz, ne saklamıyoruz?
- **Opt-Out Kolaylığı:** Her an "Beni hatırlama" özelliğini kapatabilme

#### **Risk 2: "Ayrımcılık (Algorithmic Bias)"**

**Sorun:** Yüz tanıma modelleri, koyu tenli, kadın veya yaşlı hastalarda hata oranı %10-15 daha yüksek olabilir.

**Çözüm:**
- **Diversified Training Data:** InsightFace modelini Türkiye demografi verisiyle fine-tune et
- **Bias Monitoring:** Yüz tanıma başarı oranını yaş/cinsiyet/etnik köken (anonim) bazında izle
- **Fallback Önceliği:** Hata oranı %10'u geçen demografide otomatik manuel moda geç

---

## 9. İş Etkisi ve KPI Hedefleri (12 Ay Pilot)

### 9.1 Operasyonel Kazanımlar

| **Metrik** | **Mevcut Durum** | **Hedef (6 Ay)** | **Hedef (12 Ay)** | **Ölçüm** |
|------------|------------------|------------------|-------------------|-----------|
| Ortalama Kayıt Süresi (Tekrar gelen hasta) | 3-5 dakika | **< 30 saniye** | **< 15 saniye** | Kiosk log analizi |
| Yüz Tanıma Başarı Oranı | N/A | **%85** | **%92** | Biometric audit log |
| Memory Hatırlama Doğruluğu | N/A | **%80** | **%90** | Hasta anket feedback |
| Danışma Personeli İş Yükü | 100% | **-40%** | **-60%** | Rutin sorular kiosk'a kayar |
| Yanlış Poliklinik Başvurusu | %35 | **< %25** | **< %15** | HIS yönlendirme raporu |
| No-Show (Randevuya Gelmeme) | %25 | **< %18** | **< %12** | SMS hatırlatma + context |
| Hasta "Beni Tanıdı" Memnuniyeti | N/A | **%70** | **%85** | NPS anketi |
| Genel Hasta Memnuniyeti (NPS) | 45 | **> 60** | **> 70** | Kiosk sonrası anket |

### 9.2 Maliyet Analizi (300 Yataklı Hastane Örneği)

**Yatırım (İlk Yıl):**
- Kiosk donanımı (5 adet - NVIDIA Jetson Orin Nano + ekran + kamera): **750.000 TL**
- Yazılım lisansı (yıllık): **300.000 TL**
- HIS entegrasyon (HL7 FHIR middleware): **200.000 TL**
- PostgreSQL+pgvector sunucu (on-premise): **150.000 TL**
- Personel eğitimi + pilot testi: **100.000 TL**
- **Toplam İlk Yıl:** **1.500.000 TL**

**Operasyonel Maliyet (Yıllık):**
- Bulut LLM (GPT-4o-mini fallback): **50.000 TL**
- Bakım ve destek: **100.000 TL**
- **Toplam Yıllık:** **150.000 TL**

**Kazanım (Yıllık):**
- **Zaman Tasarrufu:** 2 kayıt personelinin rutin işlerden kurtulması → Kapasite artışı değeri: **800.000 TL**
- **No-Show Azalması:** %10 düşüş (1200 randevu) → Boş slot ekonomisi: **600.000 TL**
- **Hasta Memnuniyeti Artışı:** NPS +25 puan → Marka değeri/hasta sadakati: **400.000 TL** (Dolaylı)
- **Toplam Kazanım:** **1.800.000 TL**

**ROI (Return on Investment):** **12-15 ay**

---

## 10. Roadmap: Aşamalı Devreye Alma

### Faz 1: MVP - Proof of Concept (3 Ay)

**Kapsam:**
- **Tek lokasyon** (Hastane girişi)
- **Temel özellikler:**
  - Yüz tanıma (sadece opt-in hastalar)
  - Randevu kontrol + temel bilgilendirme
  - Kısa-term memory (Redis, 2 saat oturum)
- **AI Stack:** Yerel Ollama + Whisper (Bulut entegrasyonu yok)
- **HIS Entegrasyonu:** Sadece okuma (Randevu görüntüleme)

**Başarı Kriteri:**
- %70 hasta memnuniyeti
- %80 yüz tanıma başarısı
- < 5% teknik hata oranı

### Faz 2: Pilot Genişletme (6 Ay)

**Kapsam:**
- **3 lokasyon** (Giriş + Poliklinik + Lab)
- **Özellikler:**
  - Long-term memory (PostgreSQL + pgvector, 6 ay)
  - Triaj önerileri (bağlamsal)
  - Ses tanıma (voiceprint) eklenir
- **HIS Entegrasyonu:** Okuma + Yazma (Sıra alma, randevu oluşturma)

**Başarı Kriteri:**
- %80 self-servis başarı oranı (Personel müdahalesiz)
- %85 memory hatırlama doğruluğu
- NPS > 60

### Faz 3: Tam Ürün - Omnichannel (12 Ay)

**Kapsam:**
- **Tüm hastane** (10+ kiosk)
- **Özellikler:**
  - Mobil uygulama entegrasyonu (QR kod ile context senkronizasyonu)
  - Web portalı (evden ön-bilgilendirme)
  - Ödeme entegrasyonu (fatura görüntüleme/ödeme)
  - Çoklu dil desteği (Türkçe, İngilizce, Arapça)

**Başarı Kriteri:**
- Danışma personeli %60 iş yükü azalması
- NPS > 70
- Yıllık ROI pozitif

---

## 11. Sonuç: Bağlam ve Hafıza Odaklı Yeni Nesil Sağlık Deneyimi

context-kiosk, sağlık sektöründe yapay zeka kullanımının **nasıl olmaması gerektiğinin** aksine, **gerçekçi**, **güvenlik öncelikli** ve **hasta merkezli** bir yaklaşım sunmaktadır.

### 11.1 Temel Farklılaştırıcılar

| **Özellik** | **Geleneksel Kiosk** | **context-kiosk** |
|-------------|---------------------|-------------------|
| **Hasta Tanıma** | Manuel TCKN girişi | Yüz/ses tanıma (biyometrik) |
| **Etkileşim Modeli** | Stateless (Her seferinde sıfırdan) | Stateful (Geçmişi hatırlar) |
| **Konuşma Tarzı** | Robotik, şablonlu | Doğal dil, bağlamsal |
| **Poliklinik Yönlendirme** | Statik menü | Triaj + geçmiş şikayetler |
| **Gizlilik Yaklaşımı** | Veri saklamaz | Embedding (geri çevrilemez) saklar |
| **HIS Entegrasyonu** | Tek yönlü (okuma) | İki yönlü (okuma + yazma) |

### 11.2 Başarı İçin Kritik Prensipler

1. **Bağlam Her Şeydir:** Hastayı tanımak, memnuniyeti %35 artırır (Accenture raporu)
2. **Gizlilik İhlal Edilemez:** Biyometrik veri = Özel kategoride hassas veri (KVKK Md. 6)
3. **Tıbbi Karar Vermez, Bilgilendirir:** Sistem ASLA teşhis koymaz, sadece yönlendirir
4. **Personeli Destekler, Değiştirmez:** Karmaşık durumlar otomatik personele escalate edilir
5. **Başarısızlık Planı Var:** Her sistem hatası için manuel fallback mekanizması
6. **Ölçülebilir KPI'lar:** "Havalı teknoloji" değil, "Operasyonel kazanç + hasta memnuniyeti" odaklı

### 11.3 Kaçınılması Gereken Tuzaklar

- **"Yüz Tanıma %100 Çalışır" İddiaları:** False positive/negative kaçınılmazdır, ikinci faktör şart
- **"Memory Asla Hata Yapmaz":** LLM halüsinasyonu olabilir, kritik veriler HIS'ten doğrulanmalı
- **"Biyometrik Veri Şifreli, Güvenli":** Embedding sızıntısı linkability attack riski taşır, salting şart
- **"Cloud-First Mantığı":** Biyometrik veri, on-premise kalmalı
- **"HIS Bağımsız Çalışma İddiaları":** HIS entegrasyonu ZORUNLU, yoksa sistem yararsız

### 11.4 Gelecek Vizyonu (2027+)

- **Multimodal Triaj:** Hasta cilt lekesini kameraya gösterir → Dermatolog önerisi
- **Genetik Hafıza:** Aile geçmişi (diyabet, kalp hastalığı) hatırlanır → Proaktif tarama önerileri
- **Federated Learning:** Hastaneler arası anonim model eğitimi (Hasta verisi paylaşılmadan)
- **AR/VR Entegrasyonu:** Hastane içi navigasyon (Akıllı gözlük ile "Ortopedi'ye sizi yönlendiriyorum")

---

**İletişim:**
xtatistix/dev - context-med Ekibi
E-posta: [context-med@xtatistix.dev]
Proje Deposu: `/home/seyyah/works/xtatistix/dev/context-med`

**Referanslar:**
- KVKK Kişisel Verilerin Korunması Kanunu (Türkiye)
- HL7 FHIR R4 Standardı
- ISO 27001 (Bilgi Güvenliği)
- ISO 27799 (Sağlık Bilgi Güvenliği)
- Accenture Digital Health Consumer Survey 2025

---

*Bu belge, Turkcell IAMX Dijital İş Gücü projesinden ilham alınarak, sağlık sektörünün özel gereksinimlerine (biyometrik tanıma, bağlamsal hafıza, KVKK uyumluluk) uyarlanmıştır. Ancak, IAMX belgesindeki pazarlama iddiaları yerine, klinik güvenlik, veri gizliliği ve operasyonel gerçekçilik önceliklendirilmiştir.*

---

## CLI Reference

### Infrastructure

```json
{
  "name": "@context-med/context-kiosk",
  "version": "0.1.0",
  "bin": { "context-kiosk": "./bin/cli.js" },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose"
  }
}
```

### Command Table

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `context-kiosk serve` | Start kiosk server/UI | `--config` | `--port`, `--verbose` |
| `context-kiosk calibrate` | Calibrate biometric sensors | `--input` | `--config`, `--dry-run` |
| `context-kiosk test` | Run self-test on kiosk hardware/software | | `--format`, `--verbose` |
| `context-kiosk status` | Show kiosk operational status | | `--format`, `--verbose` |
| `context-kiosk lint` | Validate kiosk configuration | `--input` | `--format`, `--verbose` |

### Usage Scenarios

#### Scenario 1 — Happy Path: Start Kiosk

```bash
context-kiosk serve \
  --config fixtures/config/kiosk-default.yaml \
  --port 8080
```

**Expected:** Kiosk UI starts on port 8080.
**Exit Code:** `0`

#### Scenario 2 — Self-Test

```bash
context-kiosk test --format json
```

**Expected Output:** JSON report with hardware/software component status (camera, NFC, display).
**Exit Code:** `0` if all pass, `2` if failures.

#### Scenario 3 — Status Check

```bash
context-kiosk status --format json
```

**Expected Output:** JSON with uptime, active sessions, sensor status.
**Exit Code:** `0`

#### Scenario 4 — Missing Config (Error)

```bash
context-kiosk serve
```

**Expected:** `Error: required option '--config <path>' not specified`
**Exit Code:** `1`

#### Scenario 5 — Dry Run Calibration

```bash
context-kiosk calibrate \
  --input fixtures/config/kiosk-default.yaml \
  --dry-run
```

**Expected:** Prints calibration plan without modifying hardware. No side effects.
**Exit Code:** `0`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Kiosk started/test passed |
| `1` | General error | Missing config, invalid argument |
| `2` | Validation error | Hardware failure, sensor offline |
| `3` | External dependency error | Biometric API unreachable |

# context-med: Sağlık Kuruluşları için Yeni Nesil Dijital Hasta Deneyimi

**Proje:** context-med (Medikal Bağlam Platformu)
**Modül:** context-kiosk (Hasta Karşılama ve Triaj Kiosk Sistemi)
**Versiyon:** 0.1.0-alpha
**Tarih:** Nisan 2026
**Mimari Sahiplik:** xtatistix/dev

---

## 1. Vizyon ve Problem Tanımı

### 1.1 Temel Felsefe

Modern sağlık kuruluşlarında hasta deneyimi, teknolojik altyapının hızına yetişememiştir. Mevcut sistemler ya tamamen personel bağımlıdır (danışma, kayıt) ya da statik self-servis çözümlere (sayısal sıra makineleri, dokunmatik ekranlar) dayanır. **context-kiosk**, hastanelerin darboğazlarını çözmek için tasarlanmış yapay zeka destekli bir hasta karşılama ve triaj platformudur.

**Amaç:**
Sağlık personelinin rutin işlerini (randevu kontrolü, poliklinik yönlendirme, temel bilgilendirme) yapay zeka ile otomatize ederek, sağlık profesyonellerinin gerçek tıbbi görevlere odaklanmasını sağlamak.

**Amaç Değildir:**
Tıbbi tanı koymak, reçete yazmak veya sağlık personelinin yerini almak. Sistem bir bilgilendirme ve yönlendirme asistanıdır, klinik karar verme aracı değildir.

---

## 2. Sağlık Sektöründeki Acı Noktalar

### Mevcut Durum: Hasta ve Kurum Perspektifi

| **Sorun** | **Hasta Deneyimi** | **Kurum Yükü** |
|-----------|-------------------|----------------|
| **Uzun Kayıt Süreçleri** | Sabah 08:00'de danışmada 20-30 dakika kuyruk | Kayıt personeli operasyonel kapasitenin %40'ını rutin işlere harcar |
| **Poliklinik Şaşkınlığı** | "Bel ağrım için Ortopedi mi Fizik Tedavi mi?" | Yanlış poliklinik başvuruları, gereksiz yönlendirmeler |
| **Randevu Karmaşası** | MHRS, hastane uygulaması, telefon... hangisi güncel? | Çift randevu, no-show oranları %25+ |
| **Bilgi Asimetrisi** | "Tahlil sonuçlarım ne zaman hazır?" "Röntgen nerede çektiriliyor?" | Aynı soruların binlerce kez tekrarı, personel yorgunluğu |
| **Dijital Uçurum** | 60+ yaş grubu, kiosklarda kaybolur veya personele bağımlıdır | Self-servis sistemlerden %70 kullanıcı yararlanamıyor |

### Beklentiler ve Sektör Gerçekleri

- **%68 hasta**, hastanede bekleme süresini azaltacak teknolojik çözümler bekliyor *(Kaynak: Sağlık Bakanlığı Hasta Memnuniyeti Anketi 2024)*
- **%52 hasta**, sesli/konuşarak etkileşim kurabileceği self-servis sistemleri tercih ediyor
- **KVKK ve Sağlık Mevzuatı**: Hasta verileri binadan çıkamaz, 3. parti bulut hizmetlerine gönderilemez
- **Tekinsiz Vadi (Uncanny Valley) Riski**: Hiper-gerçekçi avatarlar, sağlık ortamında güven kaybına neden olabilir

---

## 3. context-kiosk: Dört Duyu, Dört Katman

### 3.1 Temel Yetenekler (Multimodal AI Stack)

#### **1. Görüyor (Vision - Görsel Algı)**
- **Kullanım:** Hasta kimlik kartı/QR kod okuma, yüz tanıma (opsiyonel, KVKK izinli), kalabalık analizi
- **Teknik:** OpenCV + YOLO (yerel çalışan obje tespit), hasta fotoğrafı ASLA saklanmaz
- **Örnek Senaryo:** Hasta kimlik kartını kameraya tutar → sistem TCKN okuması yapar → HIS'ten randevu kaydını getirir

#### **2. Duyuyor (Speech-to-Text - Konuşma Tanıma)**
- **Kullanım:** Sesli komut alma, triaj sorularına yanıt toplama
- **Teknik Stack:**
  - **Yerel (Air-Gapped):** Whisper Medium (Türkçe) - CPU/GPU optimized, 5-10 saniyelik gecikme
  - **Bulut (Fallback):** Deepgram Nova-2 (Tıbbi terminoloji desteği) - Sadece anonimize edilmiş verilerle
- **Erişilebilirlik:** Yaşlı hastalar için otomatik ses yükseltme, şive/aksan toleransı

#### **3. Konuşuyor (Text-to-Speech - Sesli Yanıt)**
- **Kullanım:** Yönlendirme talimatları, randevu onayı, temel bilgilendirme
- **Teknik Stack:**
  - **Yerel:** Piper TTS (Türkçe doğal ses, 2-3 saniye gecikme)
  - **Premium (Opsiyonel):** ElevenLabs (Sadece tanıtım videoları için)
- **Ton Optimizasyonu:** Sakin, güven verici, tıbbi jargondan arınık dil

#### **4. Düşünüyor (LLM - Doğal Dil İşleme ve Karar)**
- **Kullanım:** Hasta niyetini anlama, poliklinik öneri, bilgi bankası sorgulama
- **Teknik Stack (Hibrit Model):**
  - **Tier 1 - Yerel LLM:** Ollama Llama3.2 8B (Rutin sorgular, randevu kontrol, yönlendirme)
  - **Tier 2 - Bulut LLM:** GPT-4o-mini veya Claude Haiku (Sadece anonim triaj sorguları için)
  - **Kritik Kural:** TCKN, isim, tanı gibi hassas veriler ASLA bulut LLM'e gönderilmez

---

## 4. Mimari: Güvenlik Öncelikli Hibrit Tasarım

### 4.1 Veri Akışı ve Gizlilik Katmanları

```
┌─────────────────────────────────────────────────────────────┐
│  HASTA ETKILEŞIMI (Kiosk - Dokunmatik Ekran + Mikrofon)     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  PII Detection Layer       │  ← Hassas veri filtreleme
        │  (TCKN, isim, tanı maskeleme) │
        └────────────┬───────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ YEREL İŞLEME    │    │ BULUT İŞLEME     │
│ (On-Premise)    │    │ (Anonymized Only)│
├─────────────────┤    ├──────────────────┤
│ • Whisper STT   │    │ • Deepgram STT   │
│ • Ollama LLM    │    │ • GPT-4o-mini    │
│ • Piper TTS     │    │ • Claude Haiku   │
│ • Vision (YOLO) │    │ (Sadece triaj)   │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │  HIS Integration Layer │
        │  (HL7 FHIR / REST API) │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Hastane Bilgi Sistemi │
        │  (Randevu, Lab, Kayıt) │
        └────────────────────────┘
```

### 4.2 Güvenlik ve Uyumluluk

| **Gereksinim** | **Çözüm** | **Sertifikasyon/Standart** |
|----------------|-----------|----------------------------|
| **KVKK Uyumluluk** | Hasta verisi yerel sunucuda (on-premise), 7 gün otomatik silme | KVKK Md. 12, ISO 27001 |
| **Sağlık Veri Güvenliği** | End-to-end şifreleme, role-based access control (RBAC) | HL7 Security, IEC 62304 |
| **Tıbbi Cihaz Statüsü** | **Değildir** - Karar destek sistemi, tanı koyma yetkisi yok | MDR Class I (Bilgilendirme) |
| **Denetim İzi (Audit Log)** | Tüm etkileşimler SHA-256 hash ile kayıt (kimliksiz) | ISO 27799 |

---

## 5. Hasta Yolculuğu: 4 Adımlı Deneyim

### Adım 1: Karşılama ve Kimlik Doğrulama (15-30 saniye)

**Senaryo:**
Hasta kiosk'a yaklaşır → "Günaydın, size nasıl yardımcı olabilirim?" → Hasta kimlik kartını okuttur veya TCKN söyler

**Teknik Akış:**
- Proximity sensor (IR) → kiosk uyanır
- OCR (Tesseract) veya STT → TCKN okuma
- HIS API çağrısı → Hasta kaydı doğrulama

**KPI:** Ortalama kayıt süresi 3 dakikadan → **45 saniyeye** düşürülür

---

### Adım 2: Triaj ve Yönlendirme (30-60 saniye)

**Senaryo:**
"Ne için geldiniz?" → Hasta: "Bel ağrım var, 2 haftadır geçmiyor" → Sistem: "Anladım, öncelikle Ortopedi polikliniğine yönlendiriyorum. Ağrınız travma sonrası mı?"

**Teknik Akış:**
- STT → LLM (Ollama Llama3.2) → Semptom analizi
- Kurallar motoru (Rule Engine): "Bel ağrı + 2 hafta > Ortopedi VEYA Fizik Tedavi"
- HIS sorgusu → Ortopedi'de bugün randevu var mı?

**Önemli Sınırlama:**
Sistem ASLA "Tanınız disk hernisi" gibi bir sonuç vermez. Sadece "Bu şikayetler için Ortopedi polikliniğimiz uygun olabilir" der.

**KPI:** Yanlış poliklinik başvurusu %30 azalma

---

### Adım 3: İşlem ve Entegrasyon (30-45 saniye)

**Senaryo:**
"Randevunuz bugün 10:30'da Dr. Mehmet Yılmaz ile. Kat 2, Oda 215. Numara alacak mısınız?"

**Teknik Akış:**
- HIS API → Randevu kaydı çek
- Sıra numarası oluştur (Queue Management System entegrasyonu)
- SMS/E-posta ile onay gönder (hasta onayı ile)
- Termal yazıcıdan sıra fişi bas

**KPI:** Danışma personeli yükü %50 azalma

---

### Adım 4: Bilgilendirme ve Kapanış (10-20 saniye)

**Senaryo:**
"Röntgen çektirmeniz gerekirse Radyoloji Zemin Kat'tadır. Tahlil sonuçları 2 saat içinde e-Nabız'dan erişilebilir olacak. İyi günler!"

**Teknik Akış:**
- Bilgi bankası (RAG - Retrieval Augmented Generation) → Hastane hizmetleri veritabanı
- TTS → Sesli yönlendirme
- Ekranda dinamik harita gösterimi (opsiyonel)

**KPI:** Tekrar soru oranı %40 azalma

---

## 6. Omnichannel Erişim Stratejisi

### 6.1 Fiziksel Kiosk (Öncelik 1)

**Donanım Gereksinimleri:**
- **Ekran:** 32" dokunmatik ekran (IP65 - hijyen temizliği dayanıklı)
- **İşlemci:** NVIDIA Jetson Orin (Yerel AI inference için)
- **Mikrofon:** Gürültü önleyici array mikrofon (2m mesafeden sesli komut)
- **Kamera:** 1080p USB kamera (QR/Kimlik okuma)
- **Bağlantı:** LAN (Wi-Fi yedek), VPN ile HIS entegrasyonu

**Konumlar:**
- Hastane girişi (Ana karşılama)
- Poliklinik koridorları (Yönlendirme)
- Laboratuvar/Radyoloji bekleme (Bilgilendirme)

### 6.2 Mobil Uygulama Entegrasyonu (Öncelik 2)

**Kullanım:**
Hasta QR kod okutarak mobil uygulama üzerinden aynı asistana erişir (Evden randevu öncesi bilgilendirme)

**Teknik:**
WebRTC + Pixel Streaming (Unreal Engine rendering bulutta, mobilde sadece video stream)

### 6.3 Web Portalı (Öncelik 3)

Tarayıcı üzerinden erişim (Özellikle COVID-19 gibi salgınlarda fiziksel teması azaltmak için)

---

## 7. Teknik Stack: Modüler ve Ölçeklenebilir

### 7.1 Katman Bazlı Mimari

```
┌───────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (UI/UX)                               │
│  • Unreal Engine 5.7 (3D Avatar - Opsiyonel)              │
│  • React Native (Mobil/Web fallback)                      │
│  • Accessibility: Büyük butonlar, sesli geri bildirim     │
└─────────────────────┬─────────────────────────────────────┘
                      │
┌─────────────────────┴─────────────────────────────────────┐
│  APPLICATION LAYER (İş Mantığı)                           │
│  • NestJS/FastAPI (API Gateway)                           │
│  • Redis (Session/Cache)                                  │
│  • PostgreSQL (Audit logs, analytics)                     │
└─────────────────────┬─────────────────────────────────────┘
                      │
┌─────────────────────┴─────────────────────────────────────┐
│  AI INFERENCE LAYER                                       │
│  • Ollama (Yerel LLM - Docker container)                  │
│  • Whisper (STT - ONNX Runtime)                           │
│  • Piper (TTS - Python service)                           │
│  • YOLO (Vision - OpenCV)                                 │
└─────────────────────┬─────────────────────────────────────┘
                      │
┌─────────────────────┴─────────────────────────────────────┐
│  INTEGRATION LAYER (HIS Bağlantısı)                       │
│  • HL7 FHIR API (Standart sağlık veri değişimi)           │
│  • REST API (Hastane özel sistemleri)                     │
│  • Kafka/RabbitMQ (Asenkron mesajlaşma)                   │
└───────────────────────────────────────────────────────────┘
```

### 7.2 Deployment Modeli

**Öneri:** Hibrit (Edge + Cloud)

| **Bileşen** | **Konum** | **Neden** |
|-------------|-----------|-----------|
| Whisper STT | Edge (Jetson Orin) | Düşük gecikme, gizlilik |
| Ollama LLM | Edge (Jetson Orin) | KVKK uyumlu, offline çalışır |
| Piper TTS | Edge | Hızlı yanıt |
| Vision (YOLO) | Edge | Kamera verisi paylaşılmaz |
| GPT-4o-mini (Fallback) | Cloud | Sadece anonim triaj sorguları |
| Analytics & Monitoring | Cloud | Merkezi raporlama (kimliksiz) |

---

## 8. Gerçekçi Riskler ve Sınırlamalar

### 8.1 Teknik Kör Noktalar

#### **Risk 1: "Yerel LLM Kalite Farkı"**

**İddia:** Ollama Llama3.2 8B, GPT-4o kadar iyi çalışır.
**Gerçek:** Hayır. Özellikle karmaşık tıbbi terminoloji ve çok adımlı muhakeme gerektiren sorularda yerel modeller halüsinasyon yapabilir.
**Çözüm:**
- Triaj kuralları için **Deterministik Karar Ağaçları** (Decision Trees) kullan
- LLM sadece doğal dil anlama (intent detection) için kullan, karar verme için değil
- Kritik sorgularda doktor onayı gerektir

#### **Risk 2: "Gerçek Zamanlı HIS Entegrasyonu"**

**İddia:** Kod yazmadan HIS entegrasyonu yapılır.
**Gerçek:** Türkiye'deki hastanelerin %80'i eski nesil HIS kullanır (Enlil, Probel, vb.) ve modern API'leri yoktur.
**Çözüm:**
- HL7 v2.x mesajlaşma yerine HL7 FHIR'a geçiş için hastane IT ile birlikte çalış
- Entegrasyon süresi: 3-6 ay (Kod yazmadan değil, ama reusable middleware ile)

#### **Risk 3: "Uncanny Valley - Avatar Gerçekçiliği"**

**İddia:** MetaHuman avatarı hasta güvenini artırır.
**Gerçek:** Sağlık ortamında hiper-gerçekçi ama robotik mimikler, hastaları rahatsız edebilir.
**Çözüm:**
- **Avatar Lite:** Basit 2D animasyonlu karakter (Duolingo Duo tarzı)
- Odak noktası: Ekran üzerindeki net bilgiler (randevu saati, poliklinik haritası)
- Avatar sadece sesli rehberlik için, ekran ana bilgi kaynağı

### 8.2 Operasyonel Sınırlamalar

| **Senaryo** | **Sistem Davranışı** | **Yedek Plan** |
|-------------|---------------------|----------------|
| **HIS sistemi çökerse** | Kiosk offline moda geçer, sadece bilgilendirme yapar | Personele bildirim gönder |
| **Hasta aksanlı/şive ile konuşursa** | STT %70 altına düşerse otomatik dokunmatik moda geçer | Manuel TCKN girişi |
| **Yaşlı hasta teknolojiden çekinirse** | 30 saniye etkileşim yoksa danışma personeline bildirim | Personel yardımı |
| **Acil durum (Hasta bayılma, vb.)** | Kamera algılarsa otomatik acil buton aktif + 112 arama | Fiziksel panik butonu |

---

## 9. İş Etkisi ve KPI Hedefleri (6 Ay Pilot)

### 9.1 Operasyonel Kazanımlar

| **Metrik** | **Mevcut Durum** | **Hedef** | **Ölçüm** |
|------------|------------------|-----------|-----------|
| Ortalama Kayıt Süresi | 3-5 dakika | **< 1 dakika** | Kiosk log analizi |
| Danışma Personeli İş Yükü | 100% (200 soru/gün) | **-50%** | Rutin sorular kiosk'a kayar |
| Yanlış Poliklinik Başvurusu | %35 | **< %20** | HIS yönlendirme raporu |
| No-Show (Randevuya Gelmeme) | %25 | **< %15** | SMS hatırlatma + QR onay |
| Hasta Memnuniyeti (NPS) | 45 | **> 65** | Anket (Kiosk sonrası) |

### 9.2 Maliyet Analizi (300 Yataklı Hastane Örneği)

**Yatırım:**
- Kiosk donanımı (5 adet): 500.000 TL
- Yazılım lisansı (yıllık): 200.000 TL
- HIS entegrasyon: 150.000 TL
- **Toplam İlk Yıl:** 850.000 TL

**Kazanım (Yıllık):**
- 2 kayıt personelinin rutin işlerden kurtulması: 720.000 TL (Maaş tasarrufu değil, kapasite artışı)
- No-show azalması (%10 düşüş = 1200 randevu): ~600.000 TL (Boş slot ekonomisi)
- **ROI (Return on Investment):** 18-24 ay

---

## 10. Roadmap: Aşamalı Devreye Alma

### Faz 1: Proof of Concept (3 Ay)

**Kapsam:**
- Tek lokasyon (Hastane girişi)
- Sadece randevu kontrol + temel bilgilendirme
- Yerel Ollama + Whisper (Bulut entegrasyonu yok)

**Başarı Kriteri:**
%70 hasta memnuniyeti, < 5% teknik hata oranı

### Faz 2: Pilot Genişletme (6 Ay)

**Kapsam:**
- 3 lokasyon (Giriş + Poliklinik + Lab)
- Triaj önerileri eklenir
- HIS entegrasyonu (Sadece okuma - randevu görüntüleme)

**Başarı Kriteri:**
%80 self-servis başarı oranı (Personel müdahalesiz tamamlama)

### Faz 3: Tam Entegrasyon (12 Ay)

**Kapsam:**
- Tüm hastane (10+ kiosk)
- Randevu oluşturma, sıra alma, ödeme entegrasyonu
- Mobil uygulama entegrasyonu

**Başarı Kriteri:**
Danışma personeli %50 iş yükü azalması, NPS > 70

---

## 11. Sonuç: Gerçekçi İnovasyon

context-kiosk, sağlık sektöründe yapay zeka kullanımının **nasıl olmaması gerektiğinin** aksine, **gerçekçi** ve **güvenlik öncelikli** bir yaklaşım sunmaktadır.

### Başarı İçin Kritik Prensipler

1. **Tıbbi Karar Vermez, Bilgilendirir:** Sistem ASLA teşhis koymaz, sadece yönlendirir.
2. **Gizlilik İhlal Edilemez:** TCKN, tanı, kişisel sağlık verisi buluta gitmez.
3. **Personeli Destekler, Değiştirmez:** Karmaşık durumlar otomatik personele escalate edilir.
4. **Başarısızlık Planı Var:** Her sistem hatası için manuel fallback mekanizması.
5. **Ölçülebilir KPI'lar:** "Havalı teknoloji" değil, "Operasyonel kazanç" odaklı.

### Kaçınılması Gereken Tuzaklar

- **Pazarlama > Gerçeklik:** "Sıfır hata, tamamen otonom" iddiaları
- **Avatar Odaklılık:** Hasta, güzel yüz değil, doğru bilgi ister
- **Cloud-First Mantığı:** Sağlık verisi, on-premise kalmalı
- **HIS Bağımsız Çalışma İddası:** HIS entegrasyonu ZORUNLU, yoksa sistem yararsız

---

**İletişim:**
xtatistix/dev - context-med Ekibi
E-posta: [context-med@xtatistix.dev]
Proje Deposu: `/home/seyyah/works/xtatistix/dev/context-med`

---

*Bu belge, Turkcell IAMX Dijital İş Gücü projesinden ilham alınarak, sağlık sektörünün özel gereksinimlerine uyarlanmıştır. Ancak, IAMX belgesindeki pazarlama iddiaları yerine, klinik güvenlik ve operasyonel gerçekçilik önceliklendirilmiştir.*

# context-avatar

*Doğrulanmış metinden (wiki özeti, narrate script'i veya harici içerik), kişinin yüz ve ses klonuyla kısa-form sosyal medya videosu üreten; kullanıcıyı kendi dijital ikizinin karşısına geçiren görsel-işitsel anlatı sistemi.*

> Bu belge IDEA standardını takip eder. Hiçbir kod yazılmadan önce context-avatar'ın ne olduğunu, neden var olması gerektiğini ve hangi mühendislik kararlarıyla şekillendiğini açıklar. Kendi LLM ajanına doğrudan kopyala-yapıştır olarak verilmek üzere tasarlanmıştır.

---

## 1. Tez (Thesis)

Medikal ve uzmanlık alanlarında içerik üreten profesyoneller (klinik hekimler, akademisyenler, eğitmenler) "bilgi üretme" ile "bilgiyi yayma" arasında sıkışmış durumdadır. Instagram/TikTok/YouTube Shorts gibi kısa-form video platformları hasta eğitimi ve bilinirlik için kritik kanallardır, ancak her 30 saniyelik video profesyonel bir prodüksiyon ekibi, çekim günü ve post-prodüksiyon maliyeti anlamına gelir. Sonuç: uzman kıt bir kaynak, kamera önünde geçirdiği 1 saat için 8 saatlik uzmanlık bilgisini harcar.

`context-narrate` bu problemi audio tarafında çözdü: wiki içeriğinden kaynak-doğrulanmış, çok-sesli sesli özet üretir. Fakat medikal eğitim içeriklerinin dağıtım kanalı ağırlıklı olarak **video**'dur — hastalar podcast dinlemez, doktoru ekranda konuşurken görmek ister. Aradaki boşluk şudur: **script var, ses var; eksik olan "konuşan yüz"tür.**

context-avatar'ın çekirdek iddiası: **Bir kişinin yüz ve ses klonu, doğrulanmış bir script verildiğinde, aynı kişinin kamera önünde çektiği videodan ayırt edilemeyecek kalitede sosyal medya içeriği üretmelidir.** Bu bir deepfake projesi değildir; kullanıcının **kendi yüzüyle, kendi izniyle, kendi içeriğini** otomatize ettiği bir dijital prodüksiyon hattıdır.

Sistem iki mod'da çalışır:

1. **Composed mod (`context-med` zinciri):** `context-wiki` → `context-narrate` (script) → `context-avatar` (video). Uzman kaynak içeriğini yükler; sistem wiki'leştirir, scripte çevirir, uzmanın avatarıyla kısa video üretir.
2. **Standalone mod (agentic mentor):** Kullanıcının kendi yaşlandırılmış avatarı, 10 yıllık kariyer roadmap'indeki tıkanma noktalarında bağlamsal motivasyon videoları gönderir. (bkz. `cerebra/10-draft-ideas/bitirme-proje/bp-mentor.md`)

**Temel değer önermesi:** Uzman bir kez yüz + ses örneği verir, sonrasında her yeni içerik için sadece onay verir. Sistem script'ten videoya kadar tüm pipeline'ı işletir. Çıktı: watermark'lı sosyal medya video'su, green-screen kompozisyon kaynağı veya dolu-arka-planlı tamamlanmış klip.

---

## 2. Problem

### 2.1 Uzman Zamanının Kıtlığı

Dr. Ayşe Zehra Özdemir gibi aktif klinik pratisyenlerin Instagram içeriği üretmesi tipik olarak şu döngüdür:
1. Konu seçimi + senaryo yazımı (30-60 dk)
2. Profesyonel ekiple çekim (1-2 saat / 5-10 video)
3. Kurgu + post-prodüksiyon (2-4 saat / ekip)
4. Yayın + etkileşim yönetimi

Her kısa video için uzmanın yaklaşık 1 saati ve ekibin 4-6 saati harcanır. Bu maliyet, içerik üretim sıklığını sınırlar ve haftalık/günlük yayın akışını imkansızlaştırır.

### 2.2 AI Video Araçlarının Alanyla Uyumsuzluğu

HeyGen, Synthesia, D-ID gibi araçlar iki yönde de yetersizdir:

- **Generic avatarlar** (yabancı jeneratörler): uzmanlık otoritesini aktaramaz; hasta "ben bu doktoru tanımıyorum" der.
- **Wiki/kaynak entegrasyonu yok:** kullanıcı script'i manuel yazar; halüsinasyon ve kaynaksızlık sorunu devam eder.
- **Sosyal medya format optimizasyonu yok:** 9:16 dikey format, altyazı timing'i, platform-spesifik süreler (Reels 30s, Shorts 60s) manuel ayarlanır.

### 2.3 "context-narrate" Görsel Boşluğu

context-narrate sadece audio + show-notes üretir (IDEA.md 305. satır: "Video üretmez"). Bu tasarım kararı bilinçliydi — audio odaklı tüketim için. Ancak sosyal medya dağıtımı için bu yeterli değildir. Script zaten hazır; üstüne yüz + ağız senkronu + arka plan eklemek doğal bir genişlemedir.

### 2.4 Gelecekteki Benlik Görselleştirme Eksikliği (Agentic Mentor Kontekstinde)

Psikolojik literatürde belgelenmiş hyperbolic discounting problemi: insanlar gelecekteki kendilerini **soyut bir yabancı** olarak algılar ve onun için bugün fedakarlık yapmaz (Hal Hershfield çalışmaları). Bugünkü üretkenlik araçlarında gelecekteki kullanıcının **somut, görsel, sesli** bir temsili yoktur. Bu, context-avatar'ın standalone modunun varlık nedenidir.

### 2.5 Kaynak Şeffaflığı ve Etik Sınırlar

"Bir doktoru kendi sesi ve yüzüyle konuşturmak" güç bir yetenektir. Bu yetenek:
- İzin olmaksızın başkasının avatarını üretmemeli (consent gate)
- Üretilen videoda AI-generated olduğu görsel/işitsel olarak işaretlenmeli (watermark zorunluluğu, v3+)
- Klinik iddialar için kaynak şeffaflığı korunmalı (wiki trace, show-notes)

---

## 3. Nasıl Çalışır (How It Works)

### Temel İçgörü 1 — Script Katmanı Paylaşılır, Video Katmanı Eklenir

context-narrate zaten script üretiyor. context-avatar bu script'i **ek bir katman** olarak ele alır:

```
[context-wiki]
     ↓ micro-wiki pages
[context-narrate: ScriptWriterAgent]
     ↓ timed script + voice mapping
[context-narrate: TTSOrchestrator]   ──→  audio output (mevcut çıktı)
     ↓ audio segments + timestamps
[context-avatar: VideoAssembler]     ──→  video output (yeni çıktı)
```

Script üretim katmanı **değişmez.** context-avatar yalnızca "script + audio" ikilisinin üstüne video render pipeline'ı ekler. Bu sayede:
- context-narrate kullanıcıları aynı deneyimi yaşar
- Ses üretim tarafındaki tüm iyileştirmeler (pronunciation dictionary, dil desteği, kaynak timestamp) otomatik olarak video tarafına akar

### Temel İçgörü 2 — Paylaşılan TTS Katmanı

Hem narrate hem avatar için TTS aynı soyutlama arkasında çalışır:

```python
# context-core/tts.py (yeni — paylaşılan)
class TTSProvider(Protocol):
    def synthesize(self, text: str, voice_profile: VoiceProfile) -> AudioSegment: ...

class VoiceProfile(BaseModel):
    kind: Literal["preset", "cloned"]
    preset_name: str | None          # "professional-female-tr"
    clone_source: Path | None        # voice_samples/ayse-ozdemir/*.wav
    engine: Literal["coqui", "piper", "xtts", "f5", "elevenlabs", ...]
```

**Önemli:** Bu paketleme narrate'in mevcut TTS kullanımını **değiştirir** (migration). Narrate şu anda `context_narrate.tts`'te hardcoded Coqui/Piper referansı tutuyor; paylaşılan katmana taşınmalı. context-avatar bu migration'ın itici gücü.

**TTS engine matrisi (pluggable, genişleyebilir):**

| Engine | Preset Voice | Voice Clone | Dil | Yorum |
|---|---|---|---|---|
| Coqui TTS | ✓ | Kısıtlı | TR/EN | narrate'in mevcut default'u |
| Piper TTS | ✓ | ✗ | EN güçlü | Hızlı, local |
| XTTS-v2 | ✓ | ✓ (6sn örnek) | 17 dil | Avatar için iyi aday |
| F5-TTS | ✓ | ✓ (15sn örnek) | EN/ZH | Yeni, kalite yüksek |
| ElevenLabs | ✓ | ✓ (1dk örnek) | 29 dil | Ticari, klinik kalite |
| Fish-Speech | ✓ | ✓ | Çoklu | Open, 2024 |

Yeni engine eklemek = `TTSProvider` protokolünü implement eden yeni sınıf. Ne narrate ne avatar kod değişikliği gerektirir.

### Temel İçgörü 3 — Avatar Teknolojisi Versiyonlama (v1 → v4)

Avatar render karmaşıklık açısından aşamalı:

#### **v1 — Photo-Realistic (2D foto + lip-sync)**

- **Input:** 1 adet profesyonel fotoğraf (tercihen yüz cephe, nötr ifade) + voice clone sample
- **Pipeline:** SadTalker / Wav2Lip / LatentSync / Hedra API → fotoğrafı animasyon, audio'ya göre ağız + göz kırpma + hafif baş hareketi
- **Output:** Dikey (9:16) video, yüz ve omuzlar görünür
- **Arka plan:** Fotoğrafın orijinal arka planı korunur veya LLM ile "doktor ofisi / klinik" arka planı üretilir
- **Kullanım:** Dr. Ayşe örneği için MVP — mevcut profil fotoğrafını kullanır
- **Maliyet:** Düşük (self-hosted SadTalker) veya orta (Hedra API)

#### **v2 — Talking Head (3D rekonstrüksiyon)**

- **Input:** 10-30 saniyelik kısa video klip (birden fazla açı) + voice clone
- **Pipeline:** NeRF / 3D Gaussian Splatting / GaussianAvatars → 3D baş modeli; custom kamera açıları, daha zengin mimik ve jest
- **Output:** 3D head, kamera angle kontrol edilebilir (profil, yarım profil, cephe)
- **Arka plan:** **Green screen** — post-prodüksiyon kompoziti için hazır. Kullanıcı videoyu After Effects / DaVinci'ye alıp başka sahneye taşıyabilir.
- **Kullanım:** "Ayşe hoca bir operasyonu anlatıyor" gibi bağlam değiştirme gerekiyor
- **Maliyet:** Orta-yüksek (eğitim süresi uzun)

#### **v3 — Tam Vücut**

- **Input:** Tam vücut video örneği (2-5 dk, farklı jestler) + voice clone
- **Pipeline:** HeyGen-style body avatar (Synthesia Enterprise, Hedra Character-3, Kling Avatar) → tam vücut animasyon, doğal jestler
- **Output:** Uzman ayakta veya oturur pozisyonda, el-kol hareketleri ile konuşur
- **Arka plan:** **Watermark görünür** ("AI-generated, consented by Dr. X" köşede) — doğrudan sosyal medya paylaşımı için hazır.
- **Kullanım:** "Uzun-form anlatım" içerikleri, 60-90 saniye
- **Maliyet:** Yüksek (ticari API'lere ek maliyet)

#### **v4 — Unreal Engine Modelleme**

- **Input:** Full 3D scan (photogrammetry veya iPhone Face ID pipeline) → MetaHuman template
- **Pipeline:** Unreal Engine MetaHuman + Audio2Face (NVIDIA) + Control Rig → render edilmiş, sinematik kalite
- **Output:** Sinematik kalitede, hareketli kamera, ışıklandırma kontrolü, sanal sahne
- **Arka plan:** Tam kontrollü 3D sahne (klinik, amfiteatr, sempozyum)
- **Kullanım:** Uzun-form eğitim, webinar intro, profesyonel branding videoları
- **Maliyet:** Çok yüksek (render farm + Unreal uzmanı)

**Sürümler birbirini iptal etmez:** v1 kullanıcısı v3'e zorlanmaz. Her sürüm kendi use-case'ine hizmet eder.

### Temel İçgörü 4 — İki Ayrı Mod: Composed vs Standalone

**Composed mod** (context-med ekosistemi içinde):

```
Dr. Ayşe: raw Instagram video arşivi + klinik notlar yükler
    ↓
context-wiki: raw'ı micro-wiki'ye derler (entity: "IVF takibi", concept: "yumurta kalitesi")
    ↓
context-narrate: wiki sayfasından 45 saniyelik social-media-short script üretir
    ↓
context-avatar: Dr. Ayşe'nin foto + voice clone'u ile script'i videoya render eder
    ↓
Çıktı: ayse-hoca-ivf-takibi.mp4 (9:16, 45s, watermark) → manuel inceleme → Instagram
```

**Standalone mod** (agentic mentor, `bp-mentor.md` tezi):

```
Kullanıcı: "10 yıl sonra Microsoft'ta Software Architect olmak istiyorum"
    ↓
Agentic Mentor (ayrı uygulama): roadmap üretir, progress takip eder
    ↓
(Tıkanma tetiklendiğinde)
    ↓
context-avatar: kullanıcının 10 yıl yaşlandırılmış fotoğrafı + voice clone'u ile
"gelecekteki sen" videosu render eder
    ↓
Çıktı: future-self-motivation-2035.mp4 → mobil uygulama bildirimi
```

`bp-mentor.md` bir standalone ürün tezidir; context-avatar **o ürünün substrate paketidir.** Mentor repo'su `context-avatar`'ı bağımlılık olarak kurar, kendi roadmap / scheduling / aging pipeline'ını üstüne yazar. context-med paketi olarak kalması gerekmez; Cerebra brain ekosisteminde standalone brain olarak konumlanabilir (bkz. Cerebra Brain Ekosistemi Kararları — Sinatra analojisi).

### Temel İçgörü 5 — Kaynak Şeffaflığı Video'ya Taşınır

context-narrate'in show-notes mekanizması video'da iki yolla korunur:

1. **Alt-bant altyazı (burned-in):** Her klinik iddia okunurken alt bantta kaynak adı görünür ("ESC Guideline 2023")
2. **Video açıklaması (platform description):** Tam transcript + kaynak listesi + wiki sayfa linkleri; YouTube description / Instagram caption formatında otomatik oluşturulur
3. **Watermark (v3+):** "AI-generated with consent. Sources: <link>" köşede

Kullanıcı video'yu izlerken **nereden geldiğini** anında görebilir. Bu, klinik güvenilirlik için zorunludur.

### Temel İçgörü 6 — Consent Gate

Avatar üretmek yüksek etik riskli bir işlemdir. context-avatar'da **hiçbir video, o kişinin consent imzası olmadan üretilemez:**

```yaml
# consent/ayse-ozdemir.yaml
subject:
  name: "Dr. Ayşe Zehra Özdemir"
  tckn_hash: "<hash>"
  email: "..."
consent:
  signed_at: "2026-03-01T10:00:00Z"
  signature_method: "digital"
  allowed_use_cases:
    - "medical_education_social_media"
    - "patient_education"
  prohibited_use_cases:
    - "political_speech"
    - "commercial_endorsement_non_medical"
  expires_at: "2027-03-01T10:00:00Z"
  revocation_url: "..."
```

Her render çağrısı bu consent dosyasının hash'ini çıktıya gömer (steganografi + metadata). Consent expire olursa veya revoke edilirse, yeni render başarısız olur; eski render'lar için takedown listesi tutulur.

---

## 4. Mimari (Architecture)

### Katman 1 — Bilgi Katmanı (Knowledge & Identity Layer)

- **identity-profiles/** — her subject için: yüz örnekleri, ses örnekleri, consent belgesi, stil referansları
- **avatar-configs/** — versiyon config'leri (v1-photo.yaml, v2-3dhead.yaml, v3-fullbody.yaml, v4-unreal.yaml)
- **style-presets/** — "instagram-short-9x16-45s", "youtube-short-60s", "linkedin-video-90s"
- **pronunciation-dict/** — medikal terim telaffuz sözlüğü (narrate ile paylaşılır)

### Katman 2 — Runtime Katmanı (Video Pipeline)

```
Script Input (from context-narrate or external)
       ↓
ConsentVerifier — subject için geçerli consent var mı? allowed use-case mi?
       ↓
VoiceCloner — subject'in voice sample'larından TTS clone session hazırlar
       ↓
TTSOrchestrator (shared with narrate) — script → audio segments
       ↓
FaceRenderer — version'a göre engine seçer (v1: SadTalker/Hedra, v2: 3DGS, v3: HeyGen, v4: Unreal)
       ↓
LipSyncAlignment — audio timestamp'lerini frame'lere maple
       ↓
BackgroundCompositor — arka plan seçimi (filled / green-screen / watermark)
       ↓
CaptionOverlay — alt-bant kaynak + subtitle
       ↓
FormatEncoder — hedef platform için encode (9:16 H.264, 60s max, 30fps)
       ↓
ConsentStamp — output'a consent hash'i metadata + steganografi ile gömülür
       ↓
Output: MP4 + description.txt (transcript + sources) + preview.gif
```

### Katman 3 — Geri Yazma Katmanı (Writeback & Analytics)

- **Engagement verisi:** platform view count, completion rate, comment sentiment (opsiyonel, manuel pull)
- **Kaynak tıklamaları:** description'daki wiki linkleri için outbound click rate
- **Subject geri bildirimi:** "bu video'da telaffuz yanlıştı" → pronunciation-dict update; "jest doğal değildi" → avatar config revize
- **Ratchet:** yeni render engine versiyonu aynı subject için eski testlerde regresyon yapmamalı

---

## 5. Operasyonlar (Operations)

### Senaryo 1 — Dr. Ayşe Hasta Eğitim Short Video

```bash
context-avatar render \
  --subject identity-profiles/ayse-ozdemir/ \
  --script narrate-output/ivf-takibi-script.yaml \
  --version v1-photo \
  --style instagram-short-9x16-45s \
  --background filled \
  --output output/ayse-ivf-takibi.mp4
```

**Çıktı:**
- `ayse-ivf-takibi.mp4` (0:42, 9:16, H.264, consent hash gömülü)
- `ayse-ivf-takibi-description.txt` (Instagram caption + hashtag önerileri + kaynak listesi)
- `ayse-ivf-takibi-preview.gif` (hızlı inceleme)

### Senaryo 2 — End-to-End Composed Pipeline

```bash
# Adım 1: context-wiki zaten derlenmiş varsayılıyor
# Adım 2-3: narrate + avatar zincirlenir

context-med pipeline run \
  --from-wiki micro-wiki/reproductive-health/ivf-monitoring.md \
  --through narrate:summary-45s \
  --through avatar:v1-photo \
  --subject ayse-ozdemir \
  --style instagram-short \
  --output output/ivf-monitoring/
```

**Çıktı:** klasör — script, audio, video, description, show-notes.

### Senaryo 3 — Green-Screen İhracat (v2 Talking Head)

```bash
context-avatar render \
  --subject identity-profiles/ayse-ozdemir/ \
  --script narrate-output/menopause-script.yaml \
  --version v2-3dhead \
  --background greenscreen \
  --output output/menopause-greenscreen.mp4
```

Çıktı post-prodüksiyon ekibine teslim edilir; ekip After Effects'te kendi sahnesiyle kompozit yapar.

### Senaryo 4 — Agentic Mentor (Standalone)

```bash
# Bu komut context-med içinden değil, mentor uygulamasından çağrılır
agentic-mentor trigger-motivation \
  --user user_12345 \
  --context "stuck on algorithm problem for 3 hours" \
  --goal "Microsoft Software Architect in 10 years"

# İçerde şu zincir çalışır:
# 1. mentor: LLM ile motivasyon script'i üretir (context'e özel)
# 2. context-avatar: kullanıcının AGED yüzü + voice clone ile render
# 3. mentor: mobil bildirim + video link
```

### Senaryo 5 — Toplu Üretim (Batch)

```bash
context-avatar batch \
  --subject ayse-ozdemir \
  --scripts-dir narrate-output/week-14/ \
  --version v1-photo \
  --style instagram-short \
  --output output/week-14/
```

Haftalık 7-10 video tek komutla render; her biri bağımsız incelenir.

---

## 6. Ne Yapmaz (What It Does Not Do)

- **İzinsiz avatar üretmez.** Consent olmadan hiçbir subject için render başlamaz. Ünlü kişi fotoğrafı yükleyip video üretme engellidir.
- **Script yazmaz.** Script `context-narrate` veya harici kaynaktan gelir. Avatar bir render motorudur; yaratıcılık yapmaz.
- **Platform yayınlamaz.** Video ve description üretir; Instagram/YouTube API'ye push etmez. Son onay ve paylaşım insan kararıdır.
- **Gerçek zamanlı değildir.** 45 saniyelik v1 render ~2-4 dakika; v3 ~10-20 dakika; v4 ~1-2 saat. Canlı yayın ya da interaktif sohbet değildir.
- **Müzik/SFX üretmez.** Saf konuşma videosu. Intro/outro müziği manuel eklenir.
- **Duygusal/siyasi içerik üretmeye optimize değildir.** Hedef: klinik/eğitim/profesyonel içerik. Politik konuşma veya reklam içeriği consent gate'inde prohibited_use_cases ile engellenebilir.
- **Watermark'ı kaldırmaz.** v3+ output'larda watermark zorunlu ve kaldırılamaz (üretim zincirinde embedded).

---

## 7. Neden Şimdi (Why Now)

**Voice clone kalitesi klinik kullanıma ulaştı:** XTTS-v2 (6 saniye sample), F5-TTS ve ElevenLabs Instant Voice Clone (1 dakika sample) 2024'te profesyonel kaliteye çıktı. Önce mümkün değildi.

**Photo-to-video lip-sync commoditize oldu:** SadTalker, Wav2Lip, LatentSync — hepsi open-source, GPU'da çalışır. Hedra, D-ID gibi API'ler ise saniyelik maliyete indi.

**Short-form video dağıtımı medikal eğitimde baskın oldu:** Dr. Ayşe'nin 114 Instagram video arşivi örneğinde olduğu gibi, uzmanlar zaten bu kanalı kullanıyor. Araç eksik.

**context-narrate substrate'i hazır:** Script + audio üretim katmanı çalışır durumda. Video, doğal bir genişleme.

**AI video regülasyonu netleşmeye başladı:** AB AI Act, California AB 2355 gibi yasalar AI-generated content için watermark ve consent zorunluluğu getirdi. context-avatar bu regülasyonları **tasarımdan** destekler — sonradan eklemez.

**"Future self" araştırmaları olgunlaştı:** Hershfield ve Schopler'in 2011-2023 boyunca yayımladığı çalışmalar, yaşlandırılmış self-avatar'ın tasarruf, disiplin ve uzun vadeli hedef takip davranışını ölçülebilir şekilde değiştirdiğini gösterdi. Agentic Mentor tezinin bilimsel temeli hazır.

---

## 8. Kim Fayda Sağlar (Who Benefits)

**Klinik Hekimler (context-med composed mod):** Haftada bir profesyonel çekim yerine günlük short video yayınlayabilir. Dr. Ayşe örneği: yılda 50-60 video yerine 300+ video.

**Tıp Fakülteleri ve Sürekli Eğitim Kurumları:** Modüler eğitim içerikleri için uzman avatarları; bir uzman bir kez kaydedilir, yüzlerce mikro-video üretilir.

**Hasta Eğitim Ajansları:** Hasta okuryazarlığı kampanyaları için yerelleştirilmiş, doktor-yüzlü içerik. Aynı doktor 10 farklı dilde konuşabilir (voice clone + multilingual TTS).

**Kariyer Koçluğu Ürünleri (Agentic Mentor standalone):** "Gelecekteki kendiniz" konseptini somut videoya dönüştüren üretkenlik uygulamaları.

**Uzaktan Eğitim Platformları:** Ders güncellemelerinde eğitmeni yeniden çekmek yerine avatar ile yeni videolar üretmek.

**Solo İçerik Üreticileri:** Tek kişilik operasyon olan uzmanlar (dietitian, klinik psikolog, diş hekimi) prodüksiyon ekibi olmadan sürdürülebilir sıklıkta yayın yapabilir.

---

## 9. Teknik Mimari (Technical Architecture)

**Stack:**
- Python 3.11+, Pydantic v2, Typer
- **TTS (shared):** pluggable layer — Coqui, Piper, XTTS-v2, F5-TTS, ElevenLabs, Fish-Speech (genişleyebilir)
- **Face Render:**
  - v1: SadTalker (local GPU), Wav2Lip (local), Hedra API (cloud), LatentSync (local)
  - v2: 3D Gaussian Splatting pipeline (GaussianAvatars), NeRF-based
  - v3: HeyGen API, Synthesia Enterprise, Kling Avatar, Hedra Character-3
  - v4: Unreal Engine + MetaHuman + NVIDIA Audio2Face
- **Video İşleme:** ffmpeg (encode, caption burn-in), OpenCV (frame manipulation), MoviePy (timeline composition)
- **LLM Providers:** Claude Sonnet (description/hashtag generation, script refinement), Gemini Flash (fallback)
- **Wiki Integration:** context-wiki API / file system
- **Consent & Crypto:** Ed25519 digital signatures, BLAKE3 for consent hash, FFmpeg metadata embedding
- **Output Formats:** MP4 (H.264, H.265), WebM (VP9); target aspect ratios 9:16, 1:1, 16:9

**Ajan Rolleri:**

- **ConsentVerifierAgent:** Subject consent dosyasını okur, use-case uygunluğunu ve expiry'i kontrol eder. Başarısız olursa render başlamaz.
- **VoiceCloneAgent:** Subject'in ses örneklerinden target TTS engine için clone session hazırlar.
- **FaceRenderAgent:** Version ve engine seçer, audio → video frame'lerini üretir.
- **LipSyncAgent:** Audio waveform ile frame timing'i hizalar; asenkron geçişleri düzeltir.
- **BackgroundAgent:** Arka plan kararı verir (filled / greenscreen / watermark) ve render'a uygular.
- **CaptionAgent:** Script'ten alt-bant altyazı ve kaynak etiketi üretir; FFmpeg ile yakılır.
- **DescriptionAgent:** Video açıklaması + platform-spesifik hashtag + show-notes bağlantıları.
- **QualityCheckAgent:** Output'u inceler — lip-sync bozulmuş mu? audio kırpılmış mı? watermark eksik mi? Başarısızlıkta re-render tetikler.
- **PromptRefiner:** Engagement analytics → avatar config ve script revizyon kuralları.

**Config Tipleri (MVP):**

- `v1-photo-instagram-short.yaml` — 2D foto, 9:16, 45s, filled bg
- `v1-photo-youtube-short.yaml` — 2D foto, 9:16, 60s, filled bg
- `v2-3dhead-greenscreen.yaml` — 3D head, 9:16, 60s, green bg
- `v3-fullbody-watermarked.yaml` — Full body, 9:16, 90s, watermark
- `v4-unreal-cinematic.yaml` — Unreal MetaHuman, 16:9, 120s+, custom scene

---

## 10. Kısıtlamalar (Constraints)

- **Render maliyeti sürüme bağlı:** v1 düşük (saniyelik $0.01-0.05); v3 yüksek ($0.20-1.00); v4 çok yüksek (render farm gerekir).
- **Voice clone kalitesi dil ve örnek süresine bağlı:** Türkçe için XTTS-v2 + 30 saniye örnek MVP kalitesi; klinik kalite için 2-3 dakika temiz örnek gerekir.
- **Consent revocation gecikmesi:** Subject consent'i iptal ederse, dağıtılmış video'lar hemen silinmez; takedown süreci platform-spesifik (Instagram 24-72 saat).
- **Halüsinasyon (script tarafından devralınır):** Avatar halüsinasyon üretmez, ancak script halüsinasyon içerirse görüntüye yansır. Bu yüzden composed mod'da context-narrate'in wiki-trace disiplini kritiktir.
- **Multilingual voice clone:** Türkçe voice clone + İngilizce konuşma genellikle aksanlı sonuç verir. Subject her dil için ayrı örnek sağlamalıdır (veya aksan kabullenilmelidir).
- **Regulation divergence:** AB AI Act (watermark zorunlu), Çin (devlet onayı gerekir), ABD (eyalet bazında farklılık). Output config'leri bölgeye göre ayarlanmalı.

---

## 11. Riskler (Risks)

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| **Consent sahteciliği (biri başkasının adına consent imzalar)** | Düşük-Orta | Çok Yüksek | Dijital imza + e-imza entegrasyonu (e-Devlet, DocuSign); tckn_hash doğrulama |
| **Lip-sync bozulması (Türkçe fonemler)** | Orta (başlangıçta) | Orta | Türkçe phoneme mapping iyileştirme; ratchet eval Türkçe test seti |
| **Avatar "uncanny valley" etkisi** | Yüksek (v1'de) | Orta | v1 hafif abartılı stil (illüstratif); v2-v3'te gerçekçiliğe geçiş |
| **Subject görüntü kalitesi yetersiz (düşük-çözünürlüklü foto)** | Yüksek | Orta | Minimum input kalitesi kontrolü (1080p, frontal, iyi ışık); upscaling fallback |
| **Halüsinasyon video'ya geçer (script hatalıysa)** | Düşük | Çok Yüksek | QualityCheckAgent script vs audio cross-check; narrate ratchet testleri zorunlu |
| **Regülatör takedown (watermark eksik)** | Düşük | Yüksek | Watermark zorunlu (v3+); ConsentStamp her output'a gömülür; audit log |
| **Deepfake misuse (politik içerik)** | Düşük-Orta | Çok Yüksek | allowed_use_cases whitelist; prohibited_use_cases blacklist; content classifier |
| **Voice clone sahteciliği** | Orta | Yüksek | Ses örnekleri yalnızca doğrulanmış kanalla alınır (live recording session); üçüncü taraftan upload edilen sample'lar reddedilir |

---

## 12. Açık Sorular (Open Questions)

1. **TTS shared layer'ın konumu:** `context-core`'un içinde mi yaşamalı, yoksa ayrı `context-tts` paketi mi? (context-core zaten CLI router; TTS ayrı paket bağımsızlığı korur.)
2. **Consent infrastructure:** Her subject için ayrı dosya mı, yoksa merkezi `consent-registry` mi? Çok subject'li ajanslar için ikincisi mantıklı.
3. **Agentic Mentor ne kadar context-med'e bağlı kalmalı?** Cerebra brain olarak tamamen ayrışırsa, context-avatar bağımlılık olarak kullanır ama context-med'in diğer paketlerine (wiki, gate, shield) ihtiyacı olmayabilir.
4. **Aging (yaşlandırma) pipeline'ı:** Standalone mod için 10 yıl yaşlandırılmış foto üretimi. DiffAE, StyleGAN-NADA gibi modeller context-avatar içinde mi olmalı, yoksa mentor uygulamasına mı bırakılmalı?
5. **Video watermark standardı:** C2PA (Content Authenticity Initiative) manifest'i mi, yoksa custom metadata + steganografi mi? C2PA giderek endüstri standardı oluyor.
6. **Green-screen chroma detayı:** Saf yeşil (R:0, G:255, B:0) mi, yoksa daha kolay key yapılabilen "chroma green" (R:0, G:177, B:64) mi? Post-prodüksiyon ekipleriyle konuşulmalı.
7. **Subject onboarding UX:** "Yüz + ses örneği + consent" akışı teknik kullanıcı için kolay, ama Dr. Ayşe gibi son-kullanıcı için mobil-first UI gerekir. UI kapsamı context-ui'da mı olmalı?
8. **Batch render orkestrasyonu:** 50+ video batch için iş kuyruğu (Celery, Temporal) gerekir mi, yoksa basit subprocess yeterli mi?
9. **Kısa video süresi:** Instagram Reels 30/60/90 saniye seçenekleri, YouTube Shorts 60 saniye, TikTok 3 dakikaya kadar. Hangisi default? Platform başına ayrı config mi?
10. **Multilingual lip-sync:** XTTS-v2 Türkçe sesi üretir, ama v1 (SadTalker) ağız şekilleri İngilizce fonem setine eğitilmiş. Türkçe için re-training gerekir mi?

---

## 13. Değerlendirme — Ratchet Beklentisi

**Her sürüm için altın-standart test seti:**

- **v1-photo:** 20 adet konu × 2 dil (TR/EN) = 40 referans render. Her birinde lip-sync kalitesi (SyncNet skor), voice clone benzerliği (SpeakerVerification skor), süre doğruluğu (hedef ±%5).
- **v2-3dhead:** 10 adet subject × 3 kamera açısı. Her birinde geometric consistency, artifact yokluğu.
- **v3-fullbody:** 10 adet subject × 5 jest kategorisi (nötr anlatım, vurgulu açıklama, soru, özet, kapanış). Her birinde naturalness skoru (insan değerlendirmesi 1-5).
- **Composed mod:** context-wiki → narrate → avatar uçtan-uca 10 senaryo. Her aşamada halüsinasyon kontrolü, kaynak traceability.

**Her iterasyonda sorulacak sorular:**

- FaceRenderAgent'ın yeni versiyonu önceki subject'lerde regresyon yapıyor mu?
- VoiceCloner yeni dil eklediğinde eski dil kalitesi düştü mü?
- ConsentVerifier yeni use-case tipinde yanlış-pozitif veriyor mu?
- Watermark pozisyonu tüm output boyutlarında doğru render oluyor mu?

**Başarısızlık Örnekleri → Writeback:**

- Subject "telaffuz yanlıştı" işaretlerse → pronunciation-dict update + TTS re-synthesis
- Quality check "lip-sync drift" tespit ederse → FaceRenderAgent config revize (frame rate, audio offset)
- Consent system bir use-case'i yanlış-reddederse → allowed_use_cases taxonomy güncellenir

---

## 14. Başarı Kriterleri (Success Criteria)

**Teknik Metrikler (zorunlu):**

- **Lip-sync doğruluğu:** SyncNet skoru ≥ 7/10 (v1), ≥ 8/10 (v2-v3).
- **Voice clone benzerliği:** SpeakerVerification cosine similarity ≥ 0.85.
- **Consent enforcement:** %100 — hiçbir render consent olmadan başlayamaz (unit test + integration test).
- **Render süresi (v1-photo, 45s output):** Tek GPU (RTX 4090 eq.) üzerinde < 5 dk.
- **Ratchet geçerliliği:** Her yeni release önceki test seti skorunu bozmaz.

**Kullanım Metrikleri:**

- **Subject başına video sayısı:** Onboarding'den sonra 30 günde ≥ 10 video (context-med composed mod).
- **İnsan onay oranı:** Otomatik üretilen video'ların ≥ %70'i ek düzenleme olmadan yayınlanır.
- **Pipeline hata oranı:** End-to-end başarısız render < %5.

**Kalite Metrikleri:**

- **"Bu gerçek mi AI mı" test (v1 için kabul edilir seviyede ayırt edilebilir, v3 için zor):** Uncanny valley panel testi.
- **Watermark görünürlüğü (v3+):** %100 output'ta görünür ve metadata'da mevcut.
- **Halüsinasyon oranı:** Script kaynaklı < %1; render kaynaklı (ekstra cümle eklemek vs.) = %0.

**Regülasyon Metrikleri:**

- **AB AI Act uyumu:** Her AI-generated output watermark'lı ve metadata'sında "synthetic" etiketi taşıyor.
- **Consent audit:** 12 aylık consent log'u her zaman erişilebilir; revocation takip edilebilir.

---

## 15. Bağlam / Referanslar (Context / References)

**Sistem Bağlamı:**

- `context-wiki` — content substrate; composed mod'da script'in kaynağı
- `context-narrate` — script + audio üretim; context-avatar'ın upstream bağımlılığı. **Güncellenecek:** TTS layer'ı `context-core` (veya ayrı paket) altına taşınmalı; hardcoded TTS referansları kaldırılmalı.
- `context-core` — CLI router; avatar komutları buradan dispatch edilir
- `context-gate` — kaynak doğrulama; script'te kullanılan her claim gate'den geçmiş olmalı (composed mod)
- `context-shield` — PII maskeleme; hasta fotoğrafı veya hasta sesi eğitim verisine girmemeli
- `context-ui` — subject onboarding UX (yüz + ses + consent toplama) opsiyonel olarak buraya eklenebilir

**Repo-Dışı Bağlamlar:**

- `cerebra/10-draft-ideas/bitirme-proje/bp-mentor.md` — Agentic Mentor standalone ürün tezi; context-avatar'ı substrate olarak kullanır. Dokunulmaz, olduğu gibi kalır.
- Cerebra Brain Ekosistemi — Agentic Mentor bir standalone brain olarak konumlanabilir (Sinatra analojisi).

**İlham Kaynakları:**

- **HeyGen, Synthesia:** Enterprise AI avatar video; ancak consent, wiki entegrasyonu ve open-source stack eksik.
- **D-ID:** Photo-to-video animation; API kullanılabilir ama kaynak-bağlantılı content orchestration yok.
- **Hedra Character-3 (2024):** Tam-vücut AI avatar, mimik zenginliği. Ticari API olarak v3 katmanında aday.
- **NotebookLM (Google):** Podcast üretir; "talking heads" özelliği 2025'te eklenebilir söylentisi var. context-avatar'ın klinik odağı farklılaştırıcıdır.
- **Dr. Ayşe Zehra Özdemir (instagram.com/doc.dr.aysezehraozdemir):** Use-case kaynağı; 114 video arşivi ve konuşma transkriptleri, composed mod MVP'si için referans dataset.
- **Hal Hershfield (UCLA) çalışmaları:** Future-self connectedness ve behavioral change; Agentic Mentor'un bilimsel temeli.

**Teknik Araçlar:**

- **Face Animation:** SadTalker (https://github.com/OpenTalker/SadTalker), Wav2Lip, LatentSync, GaussianAvatars
- **Voice Cloning:** XTTS-v2 (Coqui), F5-TTS, Fish-Speech, ElevenLabs API
- **3D / Unreal:** MetaHuman Creator, NVIDIA Audio2Face, Unreal Engine 5.4+
- **Video Stack:** ffmpeg, MoviePy, OpenCV
- **Consent/Provenance:** C2PA (https://c2pa.org/), Ed25519 signatures

**Standartlar:**

- Karpathy IDEA.md (2024) — bu dosyanın format standardı
- C2PA Content Credentials — AI-generated content provenance
- AB AI Act 2024 — transparency ve watermarking zorunlulukları
- context-med ekosistem kontratları (operational-schema, ratchet eval, writeback)

---

## 16. Cerebra ile İlişki (Dual-mode)

**Standalone Mod:**

context-avatar kendi `identity-profiles/` + `consent/` dizinlerinden okur, harici script alır, video üretir. Cerebra ekosistemi olmadan da kullanılabilir:

```bash
pip install context-med-avatar
context-avatar render --script my-script.yaml --subject me.yaml --version v1-photo
```

Bu mod özellikle Agentic Mentor gibi standalone ürünlerin context-avatar'ı substrate olarak kullanması için tasarlanmıştır.

**Cerebra-composed Mod:**

- context-wiki substrate'ine bağlanır; composed mod'da script otomatik olarak wiki'den üretilir
- context-narrate ile pipeline'da zincirlenir (narrate script + audio, avatar video)
- Kullanıcı analytics'i (engagement, replay, subject feedback) cerebra provenance grafiğine yazılır
- Consent revocation olayları cerebra'nın `human-in-loop-agent`'ına eskalasyon yapar
- Ratchet eval yetenekleri framework'ten miras alınır

---

## 17. context-narrate ile İlişki

**context-narrate = audio track üretir.** context-avatar bu audio'yu alır, görsel katman ekler:

| Özellik | context-narrate | context-avatar |
|---|---|---|
| Script üretimi | ✓ (ScriptWriterAgent) | ✗ (narrate'den veya harici) |
| Kaynak doğrulama | ✓ (SourceLinkerAgent) | Devralır |
| TTS / Voice | ✓ (preset voice) | ✓ (**voice clone** ek) |
| Audio output | ✓ MP3/M4A | ✓ (video track'in parçası) |
| Video output | ✗ (açıkça "video üretmez") | ✓ **ana çıktı** |
| Show-notes | ✓ HTML/PDF | Devralır + video description üretir |
| Consent gate | ✗ (script'e özel değil) | ✓ (subject-spesifik, zorunlu) |

**Migration:** context-avatar'ın yaşayabilmesi için context-narrate'deki TTS katmanı paylaşılır hale getirilmelidir. Bu narrate için **iyileştirmedir** (pluggable TTS = daha fazla engine desteği, voice clone desteği gelecek iterasyon için açık kapı).

**Migration kapsamı (narrate tarafında):**

1. `context_narrate.tts` → `context_core.tts` (veya `context_tts` ayrı paket)
2. `TTSProvider` protokolü tanımlanır
3. Mevcut Coqui/Piper implementasyonları bu protokole uyumlu hale getirilir
4. Narrate'in IDEA.md'si güncellenir (6. Madde — "Video üretmez" korunur; ek olarak "TTS katmanı shared" notu)

---

## 18. Agentic Mentor ile İlişki

`cerebra/10-draft-ideas/bitirme-proje/bp-mentor.md` bir **standalone ürün tezidir.** context-avatar o ürünün substrate paketidir:

```
bp-mentor (standalone app / Cerebra brain)
  ├── roadmap engine (LLM-driven 10-year decomposition)
  ├── progress tracker (mobile app)
  ├── trigger detector (context-aware motivation signals)
  ├── aging pipeline (future-self photo generation)
  └── depends on: context-avatar (video render)
```

**Rol ayrımı:**

- **Mentor:** kullanıcı, hedef, roadmap, tetikleyici, zamanlama bilir
- **Avatar:** yalnızca "verilen script'ten verilen subject için video üret" sorumluluğunu taşır

Agentic Mentor context-avatar'ı `pip install context-med-avatar` ile kurar; kendi aging pipeline'ıyla "10 yıl yaşlandırılmış foto" üretir, mentor script'iyle birleştirip avatar'a gönderir. Mentor'un context-wiki, context-gate, context-shield gibi diğer paketlere ihtiyacı yoktur.

**Bu ayrım neden önemli:** context-avatar medikal alanla sınırlanmaz. Eğitim, koçluk, kurumsal iletişim gibi kullanımlar için yeniden kullanılabilir substrate olur.

---

## 19. Sürüm Yol Haritası (Version Roadmap Özeti)

| Sürüm | Teknoloji | Arka Plan | Kullanım | Maliyet | MVP Hedefi |
|---|---|---|---|---|---|
| **v1** | 2D Photo + Lip-sync (SadTalker / Hedra) | Dolu (orijinal veya generated) | Instagram/YouTube Shorts | Düşük | **İlk release** — Dr. Ayşe use-case |
| **v2** | 3D Talking Head (Gaussian Splatting) | Green Screen | Post-prodüksiyon kompoziti, kurumsal | Orta | +3 ay |
| **v3** | Full Body (HeyGen/Kling Avatar) | Watermark zorunlu | Direkt sosyal medya, uzun-form | Yüksek | +6 ay |
| **v4** | Unreal Engine + MetaHuman | Custom 3D sahne | Sinematik eğitim, webinar | Çok Yüksek | +12 ay |

v1 birinci önceliktir. v4 vizyoner hedeftir; v1-v3 ticari viabiliteyi kanıtlamadan başlatılmaz.

---

> **Living Artifact Notu.** Bu belge yaşayan bir artefakttır. Yeni face/voice render engine'leri, yeni regülasyonlar, yeni consent standartları geldikçe güncellenir. Tezdeki "script + subject + consent = video" denklemi değişmedikçe teze dokunma; değiştiyse tezi yeniden yaz.

---

**Son Not:** context-avatar, context-med ekosisteminde **bilgi dağıtım modunu genişleten** bir modüldür. context-va grafik üretir (statik görsel), context-paper manuscript yazar (metin), context-slides sunum oluşturur (görsel+metin), context-narrate sesli özet üretir (audio), **context-avatar konuşan-yüz videosu üretir (audio+görsel+kimlik).** Beş modül birlikte, tek bir micro-wiki kaynağından tüm öğrenme ve dağıtım kanallarına hitap eden çıktılar sunar.

Aynı zamanda context-avatar bağımsız bir substrate olarak, `bp-mentor.md` gibi **context-med dışı ürünlerin** (agentic mentor, kariyer koçluğu, uzun-vadeli motivasyon sistemleri) video katmanını sağlar. Bu dual-positioning — hem context-med paketi hem standalone substrate — onu ekosistem içinde özel kılar.

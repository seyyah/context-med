# Context-Med CI/CD ve İş Akışı Dokümantasyonu (Antigravity Development)

Bu doküman, Google Antigravity tarafından **Context-Med** deposunda gerçekleştirilen CI/CD ve geliştirici deneyimi iyileştirmelerini özetler.

## Tamamlanan Geliştirmeler

### 1. Eğlenceli ve Yönetici Dostu PR Şablonu
- **Dosya:** `.github/PULL_REQUEST_TEMPLATE.md`
- Gamification hissini yaşatacak, geliştiricileri teşvik eden ve "Yalnızca belirlediğim alanda çalıştım" garantisi verdiren estetik bir şablon oluşturuldu.

### 2. İstenmeyen Core Değişikliklerine Karşı "Gate" Sistemi
- **Dosya:** `.github/workflows/gate-core-changes.yml`
- PR içerisine gelen dosyaları analiz eder. Temel paket (`packages/<pack-name>/`) kodları hariç herhangi bir `tests` (ana dizin) ya da `fixtures` ya da root config modifikasyonu tespit ederse anında PR'ı durdurarak **"HITL (Human In The Loop) Onayı Gerekli"** etiketi bırakır.

### 3. Gamification ve CI Denetimleri
- **Dosya:** `.github/workflows/ci-eval.yml`
- PR sırasında güncellenen paket tespit edilerek o pakete özel testler (`pytest`) otomatik çalıştırılır. Dönen konsol metni taranarak bir **Puan (Score)** çıkartılır ve PR'a yorum olarak otomatik gönderilir (Gamification). Test başarısız olursa Merge işlemi bloke edilir.

### 4. Semantik Versiyonlama ve Otomatik Changelog (Minor Bump)
- **Dosya:** `.github/workflows/auto-version-changelog.yml`
- Ana (main) branch'e her push veya merge yapıldığında devreye girer. Değişikliğe uğrayan paketi (örneğin `context-gate`) tespit eder.
- Eski versiyon etiketlerini bulur ve otomatik **Minor versiyon** atlatarak yeni tag oluşturur (`v1.2.3` -> `v1.3.0`).
- Katkı sağlayan kişinin GitHub ismini de alarak `CHANGELOG.md` dosyasını otomatik olarak güncelleyip commit atar ve sürüm etiketini GitHub'da yayınlar (Release).

> [!TIP]
> Antigravity tarafından eklenen CI/CD altyapısını test etmek isterseniz deponuza örnek bir dal açıp `packages/` dizininde küçük değişiklikler yollayabilirsiniz!

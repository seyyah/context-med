# AGENT.md

## Rol
Bu repo, akademik yayın pipeline'ı üretir. Her değişiklik net kapsamlı, bağımsız ve test edilebilir olmalıdır.

## Geliştirme Kuralları
- Bir phase'i tamamlamadan sonrakine geçme (bkz. `PLAN.md`).
- Her pakette değişiklik yaparken yalnızca o paketin kapsamında kal; cross-cutting değişiklikleri ayrı commit'e al.
- `packages/context-*/IDEA.md` dosyası o modülün kanonik tasarım belgesidir — davranış buradan türetilir.
- Halüsinasyon bariyeri kırılmazdır: üretilen her sayısal değer kaynak belgede verbatim bulunmalıdır.

## Versiyonlama ve Etiketleme
Her tamamlanan iterasyon sonunda şu adımları çalıştır:

```bash
# 1. Semver tag (MAJOR.MINOR.PATCH — kırıcı değişiklik / yeni özellik / düzeltme)
gh release create vX.Y.Z --title "vX.Y.Z — <tek satır özet>" --notes "$(sed -n '/## \[X.Y.Z\]/,/## \[/p' CHANGELOG.md | head -n -1)"

# 2. CHANGELOG.md başına yeni giriş ekle (bkz. Keep a Changelog formatı)
```

## CHANGELOG Formatı
`CHANGELOG.md` dosyasını [Keep a Changelog](https://keepachangelog.com) standardında tut:
- `### Added` / `### Changed` / `### Fixed` / `### Removed` başlıklarını kullan.
- Her release girişi `## [X.Y.Z] — YYYY-MM-DD` satırıyla açılır.
- Unreleased değişiklikler `## [Unreleased]` altında birikir; release anında versiyona taşınır.

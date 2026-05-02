# IDEA.md — pixel-office (Object-Centric 3D Surface)

## 1. Modülün Amacı ve Felsefesi
`pixel-office`, Context-Med monoreposunun 3D "Interaction Surface" (Etkileşim Yüzeyi) katmanıdır. 
Felsefesi nettir: **Görsel metafor = Operasyonel gerçek**. 
Ancak 3D karakterlerin (avatarların) pathfinding ve animasyon senkronizasyonu risklerine (yavaş yürüme, rastgele idle dolaşma) karşı **"Object-Centric" (Nesne Odaklı)** bir yaklaşım benimsenmiştir. Ofiste rastgele dolaşan işlevsiz karakterler yerine, ofisteki **eşyalar ve istasyonlar** ajanları temsil eder ve gerçek zamanlı reaksiyon verir.

## 2. Temel İlkeler ve "Object-Centric" Yaklaşım

Karakterlerin yavaş yürümesi veya animasyon gecikmesi operasyonel gerçeği yansıtmayı zorlaştırabilir. Bu nedenle odak, ofisin fiziksel yapısına kaydırılmıştır:

- **Ajan İstasyonları (Desks):** Her AI ajanı (`context-gate`, `context-paper` vb.) 3D ofiste bir "İstasyon" veya "Masa" ile temsil edilir. Bir ajan aktif olduğunda masa boş bile olsa, masadaki monitörler parlar, hologramlar döner veya bir işlem animasyonu başlar.
- **Kanban Tahtası:** Ofisin merkezinde yer alan fiziksel bir 3D tahtadır. Ajanlar tahtanın önünde olmasa bile, kullanıcı bu tahtaya tıkladığında `context-core` üzerindeki tüm task'ları, kimin ne üzerinde çalıştığını görebilir.
- **Toplantı Masası (Channel View):** Ajanların birbiriyle konuştuğu (cross-agent communication) anlarda, toplantı masasında iletişimde olan ajanların renk kodları veya ikonları belirir (holografik haritalar gibi).
- **Inbox / Outbox Kutuları:** Yeni bir döküman sisteme yüklendiğinde (`context-gate`), girişteki evrak masasında fiziksel döküman yığınları veya uyarı ışıkları belirir.

## 3. Runtime Binding (Event Stream)
Bu yüzey (surface) tamamen **Observational'dır (Sadece Okur)**. 
Cerebra/Context-Med event stream'ini dinler:
- `agent.tool.start` ➔ İlgili masadaki monitör/ışık animasyonu başlar.
- `agent.tool.end` ➔ Masa uyku moduna geçer.
- `hitl.checkpoint.pending` ➔ İlgili masanın üzerinde veya havada büyük bir ünlem/konuşma balonu belirir. Kullanıcı 3D objeye tıklayıp karar paneline (HTML Overlay) geçer.

## 4. Mimari ve Teknoloji
- **3D Engine:** React Three Fiber (`@react-three/fiber`) & Next.js.
- **HUD & UI:** Tailwind CSS. 3D sahnenin üzerine HTML/CSS olarak binen (Cam efektli) paneller (Drei'nin `Html` veya Next.js normal layout katmanı). Renkler ana dizindeki `DESIGN.md` (Xtatistix) dosyasından beslenir.
- **Data Source:** Monorepo'daki backend servislerinden WebSocket veya Polling ile güncel task ve event listesi.

## 5. CLI Komutları (Package Conformance)
| Komut | Açıklama |
|-------|----------|
| `pixel-office serve --port 3000` | Geliştirme ve prod sunucusunu başlatır. Sadece okuma/izleme modundadır. |
| `pixel-office build` | Next.js uygulamasını derler. |

## 6. Sınırlandırmalar ve Güvenlik (V1 Scope)
- **Zero Command Rule:** 3D arayüzden ajanlara "şunu yap" komutu gitmez (HITL onayları hariç). Sadece sistemin durumunu görselleştirir.
- **Karakter Kullanımı:** V1 aşamasında humanoid karakterler tamamen kaldırılabilir veya sadece dekor/kullanıcı avatarı olarak tutulup operasyonel yük onlardan alınır. Tüm bilgi "Etkileşimli Eşyalar" üzerinden verilir.

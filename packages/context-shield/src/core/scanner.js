'use strict';

/**
 * PII Scanner (Regex-Based NER)
 */

const PATTERNS = {
  TC: /\b[1-9](?:\s*\d){10}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/gi,
  PHONE: /\b(0?5[0-9]{2}[-.\s]??[0-9]{3}[-.\s]??[0-9]{2}[-.\s]??[0-9]{2}|0?5[0-9]{9}|0?2[0-9]{2}[-.\s]??[0-9]{3}[-.\s]??[0-9]{2}[-.\s]??[0-9]{2})\b/g,
  PERSON: /(?<![a-zçğıöşüA-ZÇĞİÖŞÜ])(?!(?:Hasta|Doğum|Tarih|Klinik|Rapor|Bulgu|Dosya|Yakını|Tanı|İletişim|Adres|Muayene|Laboratuvar|Glikoz|Üre|Kreatinin|Saat|HBG|WBC|PLT|Cihaz|Nem|Hata|Sürüm|Bakım|Teknisyen|Parça|Fiyat|Adet|Toplam|Kimlik|TC|No|Sayın|Doktor|Prof|Dr|Uzm|E-posta|Email|Telefon|Adı|Soyadı|Yedek|Bellek|Kodu|Son|Seri|Yüzde|Oran|Değer|Aralığı|Grade|HER2|SUVmax|LAP|Evre|USG|Patojenik|Modifiye|Radikal|Aksiller|Bölgede|Hipermetabolik|Metastatik|Kemik|Lezyonları|Meme|Dış|Üst|Duktal|Karsinom|İnvaziv|Onkoloji|Konsey|Kararı|Kemoterapi|Protokolü|Planı|Biyopsi|Sonucu|Cerrahi|Epikriz|Sevk|Takip|Notu|Hastanede|Yatan|İcra|Yapıldı)\b)((?:[a-zçğıöşüA-ZÇĞİÖŞÜ]{2,})(?:\s+(?:[a-zçğıöşüA-ZÇĞİÖŞÜ]{2,}))+)(?![a-zçğıöşüA-ZÇĞİÖŞÜ])/giu
};

const TOKEN_LABELS = {
  TC: 'TC',
  EMAIL: 'EPOSTA',
  PHONE: 'TELEFON',
  PERSON: 'KİŞİ'
};

function scan(text) {
  const entities = [];
  const map = {};
  const counters = {
    TC: 0,
    EMAIL: 0,
    PHONE: 0,
    PERSON: 0
  };

  // Combined list of headers and titles to strip from the beginning of a PERSON match
  const STRIP_LIST = ["Hasta", "Sayın", "Doktor", "Prof", "Dr", "Uzm", "Biyolog", "Hemşire", "Eczacı", "Prof.", "Dr.", "Uzm.", "Yakını", "Onaylayan", "Doktoru", "Yatan", "Ekibi", "Cerrah", "Hekim", "Hekimi", "Hastanede", "Klinik", "Raporu", "Sonucu", "Planı", "Notu", "Tanı", "Muayene"];

  // Constant list of medical headers/terms to exclude entirely if the whole match is one of these
  const EXCLUDE_LIST = ["Doğum", "Tarih", "Bulgu", "Dosya", "İletişim", "Adres", "Laboratuvar", "Glikoz", "Üre", "Kreatinin", "Saat", "HBG", "WBC", "PLT", "Cihaz", "Nem", "Hata", "Sürüm", "Bakım", "Teknisyen", "Parça", "Fiyat|Adet", "Toplam", "Kimlik", "TC", "No", "E-posta", "Email", "Telefon", "Adı", "Soyadı", "Yedek", "Bellek", "Kodu", "Son", "Seri", "Yüzde", "Oran", "Değer", "Aralığı", "Grade", "HER2", "SUVmax", "LAP", "Evre", "USG", "Patojenik", "Modifiye", "Radikal", "Aksiller", "Bölgede", "Hipermetabolik", "Metastatik", "Kemik", "Lezyonları", "Meme", "Dış", "Üst", "Duktal", "Karsinom", "İnvaziv", "Onkoloji", "Konsey", "Kararı", "Kemoterapi", "Protokolü", "Epikriz", "Sevk", "Takip", "Radyoterapi", "Genetik", "Bulgular", "Laboratuvarı", "Sorumlusu", "Teknik", "Analiz", "İmza", "Kaşe", "Mühür", "Onaylanacak", "Planlanmıştır", "Bilgilendirildi", "Üzerinden", "Sonraki", "Randevu", "Giriş", "Önizleme", "İcra", "Edildi", "Edilmiştir", "Yapıldı", "Saptanmıştır"];

  for (const [type, regex] of Object.entries(PATTERNS)) {
    let match;
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      let originalValue = match[1] || match[0];

      if (type === 'PERSON') {
        // Strip headers from the beginning recursively
        let stripped = false;
        do {
          stripped = false;
          const words = originalValue.split(/\s+/);
          const firstWord = words[0].replace(/[.,:;]$/, '').toLowerCase();
          if (words.length > 1 && (STRIP_LIST.some(s => s.toLowerCase() === firstWord) || EXCLUDE_LIST.some(e => e.toLowerCase() === firstWord))) {
            originalValue = words.slice(1).join(' ');
            stripped = true;
          }
        } while (stripped);

        // Check if ANY word in the remaining value is in the EXCLUDE_LIST
        const parts = originalValue.split(/\s+/);
        const isExcluded = parts.some(p => {
          const cleanWord = p.replace(/[.,:;]$/, '').toLowerCase();
          return EXCLUDE_LIST.some(e => e.toLowerCase() === cleanWord) || STRIP_LIST.some(s => s.toLowerCase() === cleanWord);
        });

        if (isExcluded || originalValue.length < 3) {
          continue;
        }
      }


      if (!map[originalValue]) {
        counters[type]++;
        const label = TOKEN_LABELS[type];
        const token = `[${label}_${counters[type]}]`;
        map[originalValue] = token;
      }


      entities.push({
        pii: originalValue,
        entity: type,
        detected: true,
        token: map[originalValue],
        index: match.index
      });
    }
  }




  // Sort entities by index for consistency
  entities.sort((a, b) => a.index - b.index);

  return {
    text,
    entities,
    map
  };
}

module.exports = { scan };

const { scan } = require('./src/core/scanner');
const { mask } = require('./src/core/masker');

const scenario1 = "Dosya No: 2026/X45. Hasta: SELİM YILDIZ. Bulgular: Sol aksiller bölgede hipermetabolik LAP (SUVmax: 12.4). Metastatik kemik lezyonları saptanmıştır. Raporu onaylayan: Uzm. Dr. Fatma Kaya. Telefon: 0212 555 44 33.";
const { entities, map } = scan(scenario1);
const masked = mask(scenario1, map);

console.log("Original:", scenario1);
console.log("Entities:", JSON.stringify(entities, null, 2));
console.log("Map:", JSON.stringify(map, null, 2));
console.log("Masked:", masked);

const pii = ["SELİM YILDIZ", "Fatma Kaya", "0212 555 44 33"];
pii.forEach(p => {
    const found = masked.toLowerCase().includes(p.toLowerCase());
    console.log(`Checking [${p}]: ${found ? 'FAILED (Still exists)' : 'PASSED (Masked)'}`);
});

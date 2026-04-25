---
title: Yeni Paket Eklemek
source: packages/context-wiki (referans implementasyon)
source_hash: derived-from-context-wiki-pattern
generated_at: "2026-04-25T00:00:00Z"
model: claude-sonnet-4-6
human_reviewed: false
---

# Yeni Paket Eklemek

Bu recipe, `context-wiki` referans implementasyonundan türetilmiştir.
Her adım gerçek dosyalardan doğrulanmıştır; tahmin içermez.

## Ön Koşullar

- Node.js ≥18, npm ≥9
- Repo kökünde `packages/` dizini mevcut
- `tests/helpers/cli-test-utils.js` paylaşılan test utility'si mevcut

---

## 1. Dizin Yapısı

```
packages/<paket-adı>/
  bin/
    cli.js                          ← shebang entry point
  src/
    <paket-adı>/                    ← rootDir (tsconfig.json)
      cli/
        index.ts                    ← Commander root
      commands/
        <komut>.ts
      core/
        <utility>.ts
      types/
        index.ts
  tests/
    cli/
      smoke.test.js
  dist/                             ← tsc outDir (gitignore)
  package.json
  tsconfig.json
```

CLI adı = dizin adı = `bin` key'i. Scoped paket adı (`@context-med/<paket>`) güvenlidir;
`getBinPath` dizin adını kullanır, `package.json` `name` alanını değil.

---

## 2. package.json

```json
{
  "name": "@context-med/<paket-adı>",
  "version": "0.1.0",
  "description": "<kısa açıklama>",
  "bin": {
    "<paket-adı>": "./bin/cli.js"
  },
  "main": "./dist/cli/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/<paket-adı>/cli/index.ts",
    "test": "jest",
    "test:cli": "jest tests/cli"
  },
  "dependencies": {
    "commander": "^11.1.0"
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

---

## 3. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src/<paket-adı>",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/<paket-adı>/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

`"types": ["node"]` zorunludur — olmadan VS Code `path`, `process` için
"Cannot find name" hatası verir (TS2591).

---

## 4. bin/cli.js

```javascript
#!/usr/bin/env node
require('../dist/cli/index.js');
```

Oluşturduktan sonra mutlaka:

```bash
chmod +x packages/<paket-adı>/bin/cli.js
```

---

## 5. src/\<paket-adı\>/cli/index.ts

```typescript
import { Command } from 'commander';
import * as path from 'path';

const pkg = require(path.resolve(__dirname, '../../package.json'));

const program = new Command();

program
  .name('<paket-adı>')
  .description(pkg.description)
  .version(pkg.version);

// Alt komutlar buraya eklenir:
// program.addCommand(makeIngestCommand());

program.parse(process.argv);
```

`path.resolve(__dirname, '../../package.json')` kullan — `'../../../package.json'` değil.
`__dirname` derleme sonrası `dist/cli/` olur; iki seviye yukarısı `packages/<paket>/` kökü.

---

## 6. src/\<paket-adı\>/types/index.ts

Pakete özgü tüm TypeScript arayüzleri buraya toplanır.
Komutlar ve core modülleri bu dosyadan import yapar.

```typescript
export interface MyOptions {
  input: string;
  output: string;
  format: 'md' | 'json';
  dryRun: boolean;
  verbose: boolean;
}
```

---

## 7. Exit Kodu Standardı

| Kod | Anlam                     |
|-----|---------------------------|
| 0   | Başarı                    |
| 1   | Genel hata                |
| 2   | Validasyon hatası         |
| 3   | Dış bağımlılık hatası     |

Kaynak: `wiki/guards/agent-rules.md`

---

## 8. Zorunlu CLI Flagler

Her komut şu flagleri desteklemelidir:

```
--input/-i      Girdi dosyası/dizini
--output/-o     Çıktı dosyası/dizini
--format/-f     Çıktı formatı (md | json)
--dry-run       Dosyaya yazmadan simüle et
--verbose/-v    Ayrıntılı log
```

---

## 9. tests/cli/smoke.test.js

```javascript
const path = require('path');
const {
  execCli,
  getBinPath,
  expectHelpWorks,
  setupOutputDir,
  teardownOutputDir,
} = require('../../../tests/helpers/cli-test-utils');

const BIN = getBinPath('<paket-adı>');

afterAll(() => teardownOutputDir('<paket-adı>'));

describe('<paket-adı> CLI smoke', () => {
  test('--help exits 0', () => {
    expectHelpWorks(BIN);
  });

  test('missing required flag exits non-zero', () => {
    const result = execCli(BIN, ['<komut>']);
    expect(result.exitCode).not.toBe(0);
  });
});
```

`getBinPath('<paket-adı>')` → `packages/<paket-adı>/bin/cli.js`

---

## 10. Build ve Test

```bash
cd packages/<paket-adı>

# Bağımlılıkları yükle
npm install

# TypeScript derle (dist/ oluşturur)
npm run build

# Testleri çalıştır
npx jest tests/cli/smoke.test.js

# CLI'yi direkt çalıştır
node bin/cli.js --help
```

---

## Checklist

- [ ] `packages/<paket-adı>/` dizin yapısı oluşturuldu
- [ ] `package.json` — name, bin, main, scripts, jest config
- [ ] `tsconfig.json` — rootDir, outDir, `"types": ["node"]`
- [ ] `bin/cli.js` — shebang + require dist/cli/index.js
- [ ] `chmod +x bin/cli.js`
- [ ] `src/<paket-adı>/cli/index.ts` — `path.resolve(__dirname, '../../package.json')`
- [ ] `src/<paket-adı>/types/index.ts`
- [ ] `tests/cli/smoke.test.js`
- [ ] `npm install && npm run build && npx jest`

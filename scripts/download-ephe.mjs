// Baixa os arquivos de efeméride do Swiss Ephemeris para a pasta ephe/.
// Necessário para corpos que dependem de arquivos (ex: Quíron) e para
// precisão máxima de planetas/Lua. Uso: npm run ephe:download
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = 'https://raw.githubusercontent.com/aloistr/swisseph/master/ephe';

// sepl: planetas | semo: Lua | seas: asteroides (Quíron) — todos cobrem 1800–2399
const FILES = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1'];

const here = dirname(fileURLToPath(import.meta.url));
const epheDir = join(here, '..', 'ephe');

await mkdir(epheDir, { recursive: true });

for (const file of FILES) {
  process.stdout.write(`Baixando ${file}... `);
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) {
    console.error(`falhou (HTTP ${res.status})`);
    process.exitCode = 1;
    continue;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(join(epheDir, file), buffer);
  console.log(`ok (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

console.log(`\nArquivos salvos em ${epheDir}`);
console.log('Defina EPHE_PATH=./ephe no .env para ativar a precisão máxima e o Quíron.');

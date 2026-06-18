# Plano de Desenvolvimento — astro-calc

Plano de implementação passo a passo da API REST de cálculos astrológicos. Segue o [Guia de Boas Práticas](../BOAS_PRATICAS.md) e o [Plano de Implementação geral](../PLANO_IMPLEMENTACAO.md).

> **Escopo do MVP:** endpoint `/v1/natal` com Sol, Lua, Ascendente, planetas pessoais, casas e aspectos. Trânsitos e progressões vêm em seguida.

## Stack

- **Node.js ≥ 20** (ES Modules nativos, `node:test`)
- **TypeScript** (strict)
- **Fastify** + `fastify-type-provider-zod`
- **Zod** (validação e contrato)
- **sweph** (Swiss Ephemeris, AGPL-3.0) — modo Moshier no MVP (sem arquivos `.se1`)
- **luxon** (conversão de data/hora com timezone)
- **ESLint + Prettier**, **Vitest** ou `node:test`

---

## Fase 0 — Bootstrap do projeto

### Passo 0.1 — Inicializar pacote
- [ ] `npm init -y`
- [ ] Definir `"type": "module"` no `package.json`
- [ ] Definir `engines.node >= 20`

### Passo 0.2 — TypeScript
- [ ] `npm i -D typescript @types/node tsx`
- [ ] Criar `tsconfig.json` com `strict: true`, `module: NodeNext`, `target: ES2022`, `outDir: dist`, `rootDir: src`
- [ ] Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist)

### Passo 0.3 — Qualidade
- [ ] `npm i -D eslint prettier eslint-config-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser`
- [ ] Configurar ESLint + Prettier
- [ ] `npm i -D vitest` (ou usar `node:test`)
- [ ] Script `lint`, `format`, `test`

### Passo 0.4 — Dependências de runtime
- [ ] `npm i fastify zod fastify-type-provider-zod sweph luxon`

### Passo 0.5 — Esqueleto de pastas
```
src/
├── routes/
├── services/
├── schemas/
├── lib/
└── app.ts
test/
```
- [ ] Criar `.env.example` (`PORT`, `EPHE_PATH`, `LOG_LEVEL`)
- [ ] Criar `.gitignore` (`node_modules`, `dist`, `.env`, `ephe/*.se1`)

**Entregável:** `npm run dev` sobe um Fastify vazio respondendo em `/health`.

---

## Fase 1 — Constantes e tipos de domínio

### Passo 1.1 — `lib/constants.ts`
- [ ] IDs dos planetas no sweph (`SE_SUN=0`, `SE_MOON=1`, ... `SE_PLUTO=9`), com nomes em inglês
- [ ] Lista dos pontos do MVP: Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno, Plutão
- [ ] Signos do zodíaco (12) e função `signFromLongitude(lon)` → signo + grau dentro do signo
- [ ] Sistemas de casas suportados → código sweph (`placidus: 'P'`, `koch: 'K'`, `whole-sign: 'W'`, `equal: 'E'`)
- [ ] Definição de aspectos maiores e orbes padrão:
  ```
  conjunction 0° / opposition 180° / trine 120° / square 90° / sextile 60°
  ```

### Passo 1.2 — Tipos de domínio
- [ ] `PlanetPosition`, `HouseData`, `Aspect`, `NatalChart` (alinhados ao schema de saída)

**Entregável:** módulo de constantes testável (`signFromLongitude` com testes unitários).

---

## Fase 2 — Schemas (contrato Zod)

### Passo 2.1 — `schemas/input.ts`
- [ ] `NatalInputSchema`: `date` (ISO), `time` (HH:mm), `timezone` (IANA), `latitude` (-90..90), `longitude` (-180..180), `houseSystem` (enum, default placidus)
- [ ] Validações: data válida, timezone IANA válido, coordenadas no range

### Passo 2.2 — `schemas/output.ts`
- [ ] `PlanetPositionSchema`, `HousesSchema`, `AspectSchema`, `NatalChartSchema`
- [ ] Exportar tipos inferidos (`z.infer`) — este é o **contrato** consumido pelo product-api

**Entregável:** schemas exportados e tipados; testes de validação (entradas inválidas rejeitadas).

---

## Fase 3 — Serviços de cálculo

### Passo 3.1 — `services/ephemeris.ts` (inicialização do sweph)
- [ ] Função `initEphemeris()`: define `set_ephe_path(EPHE_PATH)` se houver, senão modo Moshier
- [ ] Definir flag de cálculo global: `SEFLG_MOSEPH | SEFLG_SPEED` (velocidade para detectar retrógrado)
- [ ] `closeEphemeris()` chamando `sweph.close()` para shutdown gracioso
- [ ] Chamar `initEphemeris()` uma vez no bootstrap

### Passo 3.2 — `services/datetime.ts` (tempo → Julian Day)
- [ ] `toJulianDayUT(date, time, timezone)`: usar luxon para montar o instante local → converter para UTC → extrair Y/M/D/H decimal
- [ ] Chamar `sweph.julday(year, month, day, hourDecimal, SE_GREG_CAL)` → JD em UT
- [ ] Testes: instante conhecido → JD conhecido (validar contra valor de referência)

### Passo 3.3 — `services/planets.ts`
- [ ] `computePlanets(jd)`: para cada planeta do MVP, `sweph.calc_ut(jd, planetId, flags)`
- [ ] Extrair longitude eclíptica, velocidade (retrógrado = velocidade < 0)
- [ ] Derivar signo + grau via `signFromLongitude`
- [ ] Tratar erro de cálculo (retorno de erro do sweph) explicitamente
- [ ] Atribuição de casa feita após o cálculo das casas (Fase 3.4)

### Passo 3.4 — `services/houses.ts`
- [ ] `computeHouses(jd, lat, lon, system)`: `sweph.houses(jd, lat, lon, systemCode)`
- [ ] Extrair 12 cúspides, Ascendente (Asc), Meio-do-Céu (MC)
- [ ] `houseOfLongitude(lon, cusps)`: determina em qual casa cai cada planeta
- [ ] Testes contra mapa de referência

### Passo 3.5 — `services/aspects.ts`
- [ ] `computeAspects(planets)`: para cada par de planetas, calcular separação angular
- [ ] Verificar se está dentro do orbe de algum aspecto maior
- [ ] Retornar `{ from, to, type, orb, applying? }`
- [ ] Testes com ângulos conhecidos

### Passo 3.6 — Orquestração `services/natal.ts`
- [ ] `buildNatalChart(input)`: datetime → planets → houses → atribuir casas → aspects → montar `NatalChart`

**Entregável:** `buildNatalChart` produzindo um mapa completo, validado contra ≥ 3 mapas de referência do astro.com.

---

## Fase 4 — Camada HTTP (Fastify)

### Passo 4.1 — `app.ts`
- [ ] Criar instância Fastify com logger (pino) configurado por `LOG_LEVEL`
- [ ] Registrar `fastify-type-provider-zod` (validação automática via schemas)
- [ ] Rota `GET /health`
- [ ] Hook de shutdown chamando `closeEphemeris()`

### Passo 4.2 — `routes/natal.ts`
- [ ] `POST /v1/natal` com `NatalInputSchema` na entrada e `NatalChartSchema` na saída
- [ ] Rota fina: valida → chama `buildNatalChart` → retorna
- [ ] Erros de cálculo → `422` com payload padronizado `{ error: { code, message } }`

### Passo 4.3 — Middleware de erro
- [ ] Error handler global: erros de validação → `400`; erros de cálculo → `422`; inesperados → `500`
- [ ] **Nunca logar** data/hora/local de nascimento (dado pessoal) — logar apenas metadados não sensíveis

**Entregável:** `POST /v1/natal` funcional ponta a ponta.

---

## Fase 5 — Trânsitos (pós-MVP imediato)

### Passo 5.1 — `services/transits.ts`
- [ ] `computeTransits(natalChart, targetDate, mode)`: posições na data alvo vs. natal
- [ ] `mode`: `daily`/`weekly` → foco Lua; `monthly` → foco Sol
- [ ] Aspectos entre planetas em trânsito e planetas natais

### Passo 5.2 — `routes/transits.ts`
- [ ] `POST /v1/transits` com schema de entrada (natal + data + mode)

**Entregável:** `/v1/transits` retornando aspectos de trânsito sobre o natal.

---

## Fase 6 — Progressões (posterior)

### Passo 6.1 — `services/progressions.ts`
- [ ] Progressão secundária (dia após nascimento = ano de vida): JD progredido = JD natal + N dias
- [ ] Reusar `computePlanets` com o JD progredido
- [ ] (Opcional) Solar arc

### Passo 6.2 — `routes/progressions.ts`
- [ ] `POST /v1/progressions`

**Entregável:** `/v1/progressions` com progressão secundária.

---

## Fase 7 — Empacotamento e validação final

### Passo 7.1 — Docker
- [ ] `Dockerfile` multi-stage (build TS → runtime slim). Atenção ao binding nativo do sweph (precisa de build tools na imagem de build)
- [ ] `.dockerignore`

### Passo 7.2 — Testes de regressão
- [ ] Suite de mapas de referência (fixtures) cobrindo os 3 endpoints
- [ ] CI: lint + test no push (GitHub Actions)

### Passo 7.3 — Documentação
- [ ] Atualizar `README.md` com endpoints finais, exemplos e instruções de efeméride
- [ ] Garantir `LICENSE` AGPL-3.0 presente e citada

**Entregável:** módulo testado, dockerizado e documentado.

---

## Ordem de Execução Resumida

```
Fase 0  Bootstrap
Fase 1  Constantes e tipos
Fase 2  Schemas (contrato)
Fase 3  Serviços de cálculo  ← núcleo
Fase 4  HTTP /v1/natal       ← MVP pronto aqui
Fase 5  Trânsitos
Fase 6  Progressões
Fase 7  Empacotamento + CI
```

## Pontos de Atenção Técnicos

- **Modo Moshier no MVP** evita gerenciar arquivos `.se1`; migrar para arquivos de efeméride se precisar de mais precisão/corpos.
- **Timezone histórico:** luxon resolve regras de DST por data; cuidado com nascimentos em datas de mudança de horário de verão.
- **Retrógrado** depende da flag `SEFLG_SPEED` no `calc_ut`.
- **Binding nativo síncrono:** os cálculos bloqueiam o event loop. Para o MVP é aceitável; sob carga, avaliar worker threads ou fila.
- **Validação de precisão:** sempre conferir resultados contra o astro.com antes de marcar um endpoint como pronto.

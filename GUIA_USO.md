# Guia de Uso — astro-calc

Como rodar a API localmente, executar chamadas de teste e publicar via Docker.

---

## Rodando localmente

### Pré-requisitos
- Node.js ≥ 20
- npm

### Setup

```bash
# Instala dependências
npm install

# Cria o arquivo de variáveis de ambiente
cp .env.example .env
```

O `.env` padrão funciona sem nenhuma alteração — a API usa o modo Moshier (sem arquivos de efeméride externos).

### Arquivos de efeméride (necessário para o Quíron)

Para habilitar o **Quíron** e a precisão máxima de planetas/Lua, baixe os arquivos do Swiss Ephemeris:

```bash
npm run ephe:download
```

Isso baixa `sepl_18.se1`, `semo_18.se1` e `seas_18.se1` (cobertura 1800–2399) para a pasta `ephe/`. Em seguida, ative no `.env`:

```
EPHE_PATH=./ephe
```

Sem isso, a API roda em modo Moshier e a resposta sai **sem** o Quíron (os demais corpos funcionam normalmente).

### Iniciar em modo desenvolvimento (hot reload)

```bash
npm run dev
```

A API sobe em `http://localhost:3001`.

### Build e execução em produção local

```bash
npm run build
npm start
```

### Verificar que está no ar

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

---

## Chamadas de teste

Todos os exemplos usam `curl`. Substitua os dados de nascimento pelos seus para testar com um mapa real e comparar com [astro.com](https://www.astro.com).

---

### `POST /v1/natal` — Mapa natal

Calcula posições planetárias, casas e aspectos para uma data/hora/local de nascimento.

```bash
curl -s -X POST http://localhost:3001/v1/natal \
  -H "Content-Type: application/json" \
  -d '{
    "date": "1990-06-15",
    "time": "14:30",
    "timezone": "America/Sao_Paulo",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "houseSystem": "placidus"
  }' | jq .
```

**Campos de entrada:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `date` | `YYYY-MM-DD` | sim | Data de nascimento |
| `time` | `HH:mm` | sim | Hora local de nascimento |
| `timezone` | IANA string | sim | Ex: `America/Sao_Paulo`, `UTC`, `Europe/Lisbon` |
| `latitude` | número -90..90 | sim | Latitude da cidade de nascimento |
| `longitude` | número -180..180 | sim | Longitude da cidade de nascimento |
| `houseSystem` | enum | não | `placidus` (padrão), `koch`, `whole-sign`, `equal`, `regiomontanus`, `campanus` |
| `dst` | enum | não | Horário de verão: `auto` (padrão), `on`, `off` — ver seção abaixo |

#### Horário de verão (DST)

A maioria das pessoas não sabe se nasceu durante o horário de verão. **Você não precisa saber:** com `dst: "auto"` (padrão), a API consulta a base histórica IANA pelo `timezone` e pela data e aplica o offset correto automaticamente — inclusive períodos extintos, como o horário de verão brasileiro abolido em 2019.

| Valor | Comportamento |
|---|---|
| `auto` | **Recomendado.** Detecta automaticamente pela base histórica do timezone |
| `on` | Força horário de verão (use só se tiver certeza que era verão/DST) |
| `off` | Força horário padrão (use só se tiver certeza que não era DST) |

Toda resposta inclui o bloco `timeResolution` indicando o que foi aplicado:

```json
{
  "timeResolution": {
    "utc": "1990-01-15T16:30:00.000Z",
    "utcOffset": "-02:00",
    "dstApplied": true,
    "ambiguous": false,
    "adjusted": false
  }
}
```

- **`dstApplied`** — se o horário de verão foi aplicado àquela data.
- **`ambiguous`** — `true` quando a hora caiu na *volta* do horário de verão (o relógio marcou aquele horário duas vezes). O padrão é o horário padrão; force `dst: "on"` se souber que foi a primeira ocorrência.
- **`adjusted`** — `true` quando a hora caiu no *salto* do início do horário de verão (horário que não existiu no relógio); a hora foi avançada.

**Resposta (exemplo resumido):**

```json
{
  "planets": [
    {
      "name": "sun",
      "sign": "gemini",
      "degree": 24.32,
      "longitude": 84.32,
      "house": 10,
      "retrograde": false
    },
    {
      "name": "moon",
      "sign": "scorpio",
      "degree": 12.5,
      "longitude": 222.5,
      "house": 3,
      "retrograde": false
    },
    {
      "name": "lilith",
      "sign": "scorpio",
      "degree": 24.98,
      "longitude": 234.98,
      "house": 1,
      "retrograde": false
    }
  ],
  "houses": {
    "system": "placidus",
    "cusps": [327.14, 354.02, 24.24, 56.14, 87.66, 118.0, 147.14, 174.02, 204.24, 236.14, 267.66, 298.0],
    "ascendant": 327.14,
    "midheaven": 236.14
  },
  "aspects": [
    {
      "from": "sun",
      "to": "mercury",
      "type": "conjunction",
      "orb": 3.2,
      "applying": false
    }
  ],
  "timeResolution": {
    "utc": "1990-06-15T17:30:00.000Z",
    "utcOffset": "-03:00",
    "dstApplied": false,
    "ambiguous": false,
    "adjusted": false
  }
}
```

> **Validação:** compare o signo e grau do Sol, Lua e Ascendente com o resultado em [astro.com/horoscopes/natal](https://www.astro.com/cgi/chart.cgi). A diferença esperada em modo Moshier é < 1°.

> **Lilith:** o array `planets` inclui `lilith` — a Lua Negra Lilith **média** (apogeu lunar médio, `SE_MEAN_APOG`), a mais usada na astrologia ocidental. Ela recebe signo, casa e aspectos como os demais corpos. Por ser o apogeu médio, seu movimento é sempre direto (`retrograde: false`).

> **Quíron:** o array `planets` inclui `chiron` **quando os arquivos de efeméride estão presentes**. Diferente dos demais corpos, o Quíron é um asteroide/centauro e **não** existe no modo Moshier — ele exige o arquivo `seas_18.se1`. Sem o arquivo, o mapa continua funcionando normalmente, apenas **sem** o Quíron na resposta. Para habilitá-lo, baixe os arquivos (ver abaixo) e defina `EPHE_PATH`.

**Forçando o horário de verão** (quando o usuário tem certeza):

```bash
curl -s -X POST http://localhost:3001/v1/natal \
  -H "Content-Type: application/json" \
  -d '{
    "date": "1990-01-15",
    "time": "14:30",
    "timezone": "America/Sao_Paulo",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "dst": "off"
  }' | jq .timeResolution
```

---

### `POST /v1/transits` — Trânsitos

Calcula os trânsitos planetários em uma data alvo em relação ao mapa natal.

```bash
curl -s -X POST http://localhost:3001/v1/transits \
  -H "Content-Type: application/json" \
  -d '{
    "natal": {
      "date": "1990-06-15",
      "time": "14:30",
      "timezone": "America/Sao_Paulo",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "targetDate": "2026-06-18",
    "targetTime": "12:00",
    "targetTimezone": "UTC",
    "mode": "daily"
  }' | jq .
```

**Modos disponíveis:**

| `mode` | Planetas retornados | Uso |
|---|---|---|
| `daily` | Lua, Sol, Mercúrio, Vênus, Marte | Dica do dia |
| `weekly` | Lua, Sol, Mercúrio, Vênus, Marte | Visão da semana |
| `monthly` | Sol, Júpiter, Saturno, Urano, Netuno, Plutão | Visão do mês |

**Resposta (exemplo resumido):**

```json
{
  "date": "2026-06-18",
  "mode": "daily",
  "planets": [
    {
      "name": "moon",
      "sign": "cancer",
      "degree": 8.4,
      "longitude": 98.4,
      "house": 11,
      "retrograde": false,
      "aspectsToNatal": [
        {
          "from": "moon",
          "to": "sun",
          "type": "sextile",
          "orb": 2.1,
          "applying": true
        }
      ]
    }
  ]
}
```

---

### `POST /v1/progressions` — Progressões secundárias

Calcula o mapa progredido para uma data alvo usando progressão secundária (1 dia = 1 ano de vida).

```bash
curl -s -X POST http://localhost:3001/v1/progressions \
  -H "Content-Type: application/json" \
  -d '{
    "natal": {
      "date": "1990-06-15",
      "time": "14:30",
      "timezone": "America/Sao_Paulo",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "targetDate": "2026-06-18"
  }' | jq .
```

**Resposta (exemplo resumido):**

```json
{
  "progressedDate": "1990-08-29",
  "yearsElapsed": 35.92,
  "planets": [
    {
      "name": "sun",
      "sign": "leo",
      "degree": 5.1,
      "longitude": 125.1,
      "house": 11,
      "retrograde": false
    }
  ],
  "aspects": [
    {
      "from": "sun",
      "to": "moon",
      "type": "trine",
      "orb": 1.8,
      "applying": false
    }
  ]
}
```

> `progressedDate` é a data real do calendário correspondente ao JD progredido — útil para referência cruzada com efemérides.

---

### Testando respostas de erro

**Entrada inválida (400):**
```bash
curl -s -X POST http://localhost:3001/v1/natal \
  -H "Content-Type: application/json" \
  -d '{
    "date": "não-é-uma-data",
    "time": "14:30",
    "timezone": "America/Sao_Paulo",
    "latitude": -23.55,
    "longitude": -46.63
  }' | jq .
# {"error":{"code":"VALIDATION_ERROR","message":"..."}}
```

**Timezone inválido (400):**
```bash
curl -s -X POST http://localhost:3001/v1/natal \
  -H "Content-Type: application/json" \
  -d '{
    "date": "1990-06-15",
    "time": "14:30",
    "timezone": "Brasil/SaoPaulo",
    "latitude": -23.55,
    "longitude": -46.63
  }' | jq .
# {"error":{"code":"VALIDATION_ERROR","message":"Timezone IANA inválido"}}
```

---

## Publicando via Docker

### Build da imagem

```bash
docker build -t astro-calc .
```

> O build compila o addon nativo do `sweph` — requer conexão com internet para baixar as dependências na primeira vez.

### Rodar o container

```bash
docker run -d \
  --name astro-calc \
  -p 3001:3001 \
  -e LOG_LEVEL=info \
  astro-calc
```

### Verificar

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

### Com arquivo de efeméride (precisão máxima, opcional)

Para usar os arquivos `.se1` da Swiss Ephemeris (precisão de arco-segundo, necessário para datas antes de 1800 ou após 2400):

1. Baixe os arquivos em [astro.com/ftp/swisseph/ephe](https://www.astro.com/ftp/swisseph/ephe/) — para uso geral, baixe `seas_18.se1` e `semo_18.se1`
2. Coloque-os em uma pasta local, ex: `./ephe/`
3. Monte como volume:

```bash
docker run -d \
  --name astro-calc \
  -p 3001:3001 \
  -e EPHE_PATH=/ephe \
  -v $(pwd)/ephe:/ephe \
  astro-calc
```

### Variáveis de ambiente disponíveis

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta da API |
| `LOG_LEVEL` | `info` | `trace`, `debug`, `info`, `warn`, `error` |
| `EPHE_PATH` | `` (vazio) | Caminho dos arquivos `.se1`. Vazio = modo Moshier |

### Docker Compose (opcional)

```yaml
# docker-compose.yml
services:
  astro-calc:
    build: .
    ports:
      - "3001:3001"
    environment:
      - LOG_LEVEL=info
      - EPHE_PATH=
    restart: unless-stopped
```

```bash
docker compose up -d
```

---

## Referências de timezone (IANA)

Cidades mais comuns no Brasil:

| Cidade | Timezone |
|---|---|
| São Paulo / Rio de Janeiro | `America/Sao_Paulo` |
| Manaus | `America/Manaus` |
| Fortaleza / Recife / Salvador | `America/Fortaleza` |
| Porto Velho | `America/Porto_Velho` |
| Rio Branco | `America/Rio_Branco` |
| Fernando de Noronha | `America/Noronha` |

Lista completa: [en.wikipedia.org/wiki/List_of_tz_database_time_zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

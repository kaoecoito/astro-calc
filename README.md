# astro-calc

API REST para cálculos astrológicos de alta precisão: mapa natal, trânsitos e progressões.

> **Licença: AGPL-3.0** — Este módulo é publicado de forma aberta em conformidade com os termos da Swiss Ephemeris.

## Stack

- **Runtime:** Node.js
- **Efeméride:** [sweph](https://github.com/timotejroiko/sweph) — Swiss Ephemeris bindings para Node.js (AGPL-3.0)

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/natal` | Calcula mapa natal completo |
| `POST` | `/transits` | Calcula trânsitos para uma data |
| `POST` | `/progressions` | Calcula progressões secundárias e solar arc |

## Formato de entrada (exemplo `/natal`)

```json
{
  "date": "1990-06-15",
  "time": "14:30",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "houseSystem": "placidus"
}
```

## Formato de saída

Retorna posições planetárias (signo, grau, casa, retrógrado), cúspides de casas e aspectos em JSON estruturado.

## Instalação e execução

```bash
npm install
npm start
```

A API sobe em `http://localhost:3001` por padrão.

## Arquivos de efeméride

Os arquivos `.se1` da Swiss Ephemeris devem ser baixados separadamente e colocados em `./ephe/`. Consulte [astro.com/swisseph](https://www.astro.com/swisseph/) para download.

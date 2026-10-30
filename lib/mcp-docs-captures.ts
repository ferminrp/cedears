/** Real tools/call responses from https://cedears.com/mcp, trimmed ("…" marks cuts). Do not edit by hand. */
export const MCP_CAPTURED_AT_ISO = "2026-10-30T13:19:00.000Z"
export const MCP_CAPTURED_AT_LABEL = "30/10/2026 10:19 (hora Buenos Aires)"
export const MCP_TOOL_CAPTURES: Record<string, { args: Record<string, unknown>; response: unknown }> = {
  "list_cedears": {
    "args": {
      "query": "apple",
      "limit": 2
    },
    "response": {
      "count": 1,
      "total": 1,
      "columns": [
        "Ticker",
        "Empresa",
        "Mercado",
        "Ratio",
        "…"
      ],
      "rows": [
        {
          "Ticker": "AAPL",
          "Empresa": "Apple Inc.",
          "Mercado": "NASDAQ",
          "Ratio": "20",
          "Ticker original": "AAPL",
          "Precio ARS": 28840,
          "Var. %": 0.77,
          "Volumen": 0,
          "Precio US": 344.6,
          "Precio MEP": 18.39,
          "Precio CCL": 17.47,
          "Precio justo USD": 17.23,
          "Prima %": 6.732443412652351,
          "Tags": [
            "Tech"
          ]
        }
      ],
      "ui": "https://cedears.com"
    }
  },
  "get_cedear": {
    "args": {
      "ticker": "KO"
    },
    "response": {
      "found": true,
      "row": {
        "Ticker": "KO",
        "Empresa": "The Coca Cola Company",
        "Mercado": "NYSE",
        "Ratio": "5",
        "Ticker original": "KO",
        "Precio ARS": 30640,
        "Var. %": 0.66,
        "Volumen": 0,
        "Precio US": 94.595,
        "Precio MEP": 19.69,
        "Precio CCL": 18.7,
        "Precio justo USD": 18.919,
        "Prima %": 4.0752682488503655,
        "Tags": [
          "Consumo básico"
        ]
      },
      "ui": "https://cedears.com"
    }
  },
  "earnings": {
    "args": {},
    "response": {
      "start": "2026-10-30",
      "end": "2026-10-30",
      "window": {
        "start": "2026-10-30",
        "end": "2027-01-30"
      },
      "days": [
        {
          "date": "2026-10-30",
          "items": [
            {
              "cedear": "AZN",
              "name": "Astrazeneca Plc",
              "market": "NYSE",
              "tickerOriginal": "AZN",
              "earningsTime": "02:00:00",
              "isDateConfirmed": true
            },
            {
              "cedear": "BP",
              "name": "BP PCL",
              "market": "NYSE",
              "tickerOriginal": "BP",
              "earningsTime": "02:00:00",
              "isDateConfirmed": true
            },
            "…"
          ]
        }
      ],
      "ui": "https://cedears.com/earnings"
    }
  }
}

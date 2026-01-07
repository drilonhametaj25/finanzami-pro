# Enable Banking Integration Setup

Questa guida descrive come configurare l'integrazione con Enable Banking per la sincronizzazione automatica dei conti bancari.

## Prerequisiti

1. **Account Enable Banking**: Registrati su [enablebanking.com](https://enablebanking.com) e ottieni l'accesso al pannello di controllo.

2. **Certificato RSA**: Enable Banking richiede l'autenticazione tramite JWT firmato con RSA-256.

## Configurazione

### 1. Generare chiave privata RSA

```bash
# Genera la chiave privata RSA (2048 bit)
openssl genrsa -out enable_banking_private.pem 2048

# Genera il certificato self-signed
openssl req -new -x509 -key enable_banking_private.pem -out enable_banking_cert.pem -days 365
```

### 2. Configurare Enable Banking

1. Accedi al pannello di controllo Enable Banking
2. Vai su "Applications" e crea una nuova applicazione
3. Carica il certificato `enable_banking_cert.pem`
4. Annota l'**Application ID** (kid)

### 3. Configurare Variabili d'Ambiente Supabase

Aggiungi le seguenti variabili d'ambiente alle Edge Functions di Supabase:

```bash
# Nel dashboard Supabase > Project Settings > Edge Functions

ENABLE_BANKING_APP_ID=<your-application-id>
ENABLE_BANKING_PRIVATE_KEY=<contents-of-enable_banking_private.pem>
```

**Nota**: La chiave privata deve essere inserita come stringa singola con `\n` per le newline.

### 4. Eseguire la Migrazione del Database

```bash
# Esegui la migrazione per creare le tabelle necessarie
supabase db push
```

Oppure esegui manualmente:
```bash
supabase db reset
```

### 5. Deploy delle Edge Functions

```bash
# Deploy tutte le Edge Functions di Enable Banking
supabase functions deploy enable-banking-banks
supabase functions deploy enable-banking-auth
supabase functions deploy enable-banking-session
supabase functions deploy enable-banking-accounts
supabase functions deploy enable-banking-transactions
supabase functions deploy enable-banking-disconnect
```

### 6. Configurare Deep Links

Assicurati che il deep link `budgetwise://bank-callback` sia configurato:

**app.json**:
```json
{
  "expo": {
    "scheme": "budgetwise"
  }
}
```

## Architettura

### Flusso di Autorizzazione

```
1. Utente seleziona la banca
2. App chiama enable-banking-auth → ottiene URL di autorizzazione
3. Utente apre il browser e autorizza la banca
4. Banca reindirizza a budgetwise://bank-callback?code=xxx&state=yyy
5. App chiama enable-banking-session → crea sessione e ottiene conti
6. App chiama enable-banking-transactions → sincronizza transazioni
```

### Classificazione Automatica

Le transazioni vengono categorizzate automaticamente usando:

1. **Regole Globali**: Pattern predefiniti per merchant comuni (es. "ESSELUNGA" → "Spesa alimentare")
2. **Regole Utente**: Pattern appresi dalle correzioni manuali dell'utente
3. **Apprendimento**: Quando l'utente cambia categoria, il sistema crea/aggiorna regole

La funzione PostgreSQL `auto_categorize_transaction()` gestisce la categorizzazione con un punteggio di confidenza.

### Tabelle Database

| Tabella | Descrizione |
|---------|-------------|
| `enable_banking_sessions` | Sessioni di autorizzazione bancaria |
| `enable_banking_accounts` | Conti bancari collegati |
| `enable_banking_aspsps` | Cache delle banche disponibili |
| `transaction_category_rules` | Regole di categorizzazione |

### Edge Functions

| Funzione | Descrizione |
|----------|-------------|
| `enable-banking-banks` | Lista banche disponibili per paese |
| `enable-banking-auth` | Inizia autorizzazione bancaria |
| `enable-banking-session` | Completa autorizzazione e ottiene conti |
| `enable-banking-accounts` | Lista conti collegati |
| `enable-banking-transactions` | Sincronizza transazioni |
| `enable-banking-disconnect` | Disconnetti banca e revoca consenso |

## Sicurezza

- Le chiavi private sono memorizzate solo lato server (Edge Functions)
- I JWT hanno validità massima di 1 ora
- Le sessioni bancarie seguono le policy PSD2 della banca (90 giorni max)
- RLS (Row Level Security) protegge i dati per utente

## Rate Limits

Enable Banking ha rate limits per ASPSP. In caso di errore `ASPSP_RATE_LIMIT_EXCEEDED`:
- Attendere il tempo indicato prima di riprovare
- Usare la paginazione con `continuation_key` per le transazioni

## Troubleshooting

### Errore "Missing Enable Banking credentials"
Verifica che `ENABLE_BANKING_APP_ID` e `ENABLE_BANKING_PRIVATE_KEY` siano configurati nelle Edge Functions.

### Errore "Invalid or expired token"
La sessione dell'utente Supabase è scaduta. Effettua nuovamente il login.

### Sessione bancaria scaduta
Le sessioni hanno una validità massima di 90 giorni. L'utente deve ri-autorizzare la banca.

### Transazioni non categorizzate correttamente
L'utente può correggere la categoria manualmente. Il sistema apprende e applicherà la stessa regola per transazioni simili future.

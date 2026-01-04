# BudgetWise - App di Gestione Budget Intelligente con Expo e Supabase

## 🎯 Obiettivo del Progetto
Creare un'app mobile cross-platform (iOS/Android) con Expo/React Native per la gestione intelligente del budget personale. L'app non si limita a tracciare entrate/uscite, ma fornisce coaching finanziario attivo con consigli personalizzati, alert preventivi, e suggerimenti di ottimizzazione basati sui pattern di spesa dell'utente.

## 🛠 Stack Tecnologico
- **Frontend**: Expo SDK 52+, React Native, TypeScript
- **UI Components**: React Native Paper o NativeBase (scegli il più adatto)
- **Grafici**: react-native-chart-kit o victory-native
- **Backend/Database**: Supabase (Auth, Database PostgreSQL, Realtime)
- **State Management**: Zustand o Redux Toolkit
- **Navigazione**: Expo Router (file-based routing)
- **Notifiche**: expo-notifications
- **Storage locale**: expo-secure-store per dati sensibili
- **Icone**: @expo/vector-icons
- **Date**: date-fns
- **Valute**: exchangerate-api o simile per conversioni

## 📱 Funzionalità Core

### 1. Autenticazione (Supabase Auth)
- Registrazione con email/password
- Login con email/password
- Login social (Google, Apple)
- Password recovery
- Sessione persistente
- Sincronizzazione dati cross-device

### 2. Dashboard Principale
- Saldo netto del mese (entrate - uscite)
- Budget rimanente totale con barra di progresso
- Quick stats: speso oggi, questa settimana, questo mese
- Categorie più utilizzate (mini grafico a torta)
- Alert attivi e suggerimenti del giorno
- Accesso rapido per aggiungere spesa/entrata
- Prossime spese ricorrenti in arrivo
- Crediti da recuperare (se presenti)

### 3. Gestione Transazioni
**Spese:**
- Importo, categoria, descrizione, data
- Tag opzionali (es. "necessario", "impulsivo", "regalo")
- Allegare foto scontrino (opzionale)
- Selezione valuta con conversione automatica in EUR
- Opzione "Spesa condivisa" → seleziona N persone, calcola quota ciascuno, crea crediti automatici

**Entrate:**
- Importo, tipo (stipendio, bonus, regalo, rimborso, freelance, altro)
- Ricorrente sì/no
- Data

**Spese Ricorrenti:**
- Setup spese fisse: affitto, bollette, abbonamenti, rate
- Frequenza: mensile, trimestrale, annuale
- Reminder prima della scadenza
- Tracking automatico (segna come pagato)

### 4. Sistema Budget
- Budget mensile totale impostabile
- Budget per singola categoria
- Budget adattivo: se sfori una categoria, suggerisce ribilanciamento da altre
- Visualizzazione progresso per ogni categoria (barra colorata: verde/giallo/rosso)
- Storico budget vs speso per ogni mese

### 5. Categorie
**Preset iniziali:**
- 🏠 Casa (affitto, bollette, manutenzione)
- 🛒 Spesa alimentare
- 🍽 Ristoranti e bar
- 🚗 Trasporti (benzina, mezzi, taxi)
- 🎭 Svago e intrattenimento
- 👕 Abbigliamento
- 💊 Salute (medico, farmacia)
- 📚 Istruzione e formazione
- 🎁 Regali
- 💼 Lavoro (spese professionali)
- 📱 Tecnologia e abbonamenti digitali
- ✈️ Viaggi
- 🐕 Animali domestici
- 💇 Cura personale
- 🏦 Altro

**Personalizzazione:**
- L'utente può aggiungere categorie custom con nome, icona e colore
- Può nascondere categorie non usate
- Può impostare budget specifico per categoria

### 6. Obiettivi di Risparmio
- Creare N obiettivi con: nome, importo target, data target (opzionale), icona
- Allocazione manuale o automatica (% del risparmio mensile)
- Progress bar visuale
- Previsione data raggiungimento basata sul ritmo attuale
- Suggerimenti per accelerare il raggiungimento
- Celebrazione al completamento

### 7. Spese Condivise e Crediti
- Quando inserisci una spesa, opzione "Dividi con..."
- Seleziona contatti o inserisci nome manualmente
- Calcolo automatico quote (divisione equa o personalizzata)
- Lista crediti attivi con:
  - Chi deve quanto
  - Da quanto tempo
  - Reminder automatici configurabili
- Segna come "rimborsato" (parziale o totale)
- Notifica push per ricordare crediti vecchi

### 8. Multi-Valuta
- Valuta principale: EUR
- Possibilità di inserire spese in altre valute
- Conversione automatica al cambio del giorno
- Storico cambi applicati
- Report spese per valuta

### 9. Sistema di Notifiche e Alert
**Alert Budget:**
- Al 70% del budget categoria: notifica gentile
- All'85%: warning
- Al 95%: alert critico con suggerimento ribilanciamento
- Allo sforamento: notifica + proposta azione correttiva

**Reminder:**
- Reminder giornaliero per inserire spese (orario configurabile)
- Reminder spese ricorrenti in scadenza
- Reminder crediti da recuperare (configurabile: ogni X giorni)

**Report:**
- Report settimanale (ogni domenica): riepilogo settimana, confronto budget, alert
- Report mensile (primo del mese): analisi mese concluso, trend, consigli per il nuovo mese

### 10. Sistema di Intelligenza e Coaching (CORE FEATURE)
Implementa un motore di analisi che genera insight personalizzati. Ogni insight ha: tipo, messaggio, priorità (alta/media/bassa), azione suggerita (opzionale), categoria correlata.

**Categorie di Insight da implementare:**

**A. Alert Preventivi e Ribilanciamento**
- Alert progressivi al 70%, 85%, 95% del budget
- Previsione sforamento basata sul trend di spesa
- Suggerimento automatico di ribilanciamento tra categorie
- Consigli post-sforamento per recuperare

**B. Analisi Pattern Temporali**
- Confronto con mese precedente per categoria
- Confronto con stesso mese anno precedente
- Identificazione pattern: weekend vs feriali
- Identificazione pattern: inizio vs fine mese
- Pattern orario (spese serali = spesso impulsive)
- Giorno della settimana più costoso

**C. Ottimizzazione Obiettivi**
- Tempo stimato per raggiungere ogni goal
- Suggerimenti per accelerare (es. "riduci X, arrivi Y mesi prima")
- Proposta allocazione quando c'è surplus
- Alert se un goal è a rischio

**D. Analisi Spese Ricorrenti**
- Totale mensile in abbonamenti
- Identificazione abbonamenti potenzialmente inutilizzati
- Suggerimenti di ottimizzazione (bundle, alternative più economiche)
- Reminder rinnovi importanti

**E. Gestione Crediti**
- Reminder crediti da recuperare con aging
- Suggerimento sollecito per crediti vecchi
- Riepilogo situazione crediti/debiti

**F. Salute Finanziaria**
- Rapporto risparmio/entrate (target: 20%)
- Trend risparmio ultimi mesi
- Previsione saldo fine mese
- Analisi mesi in negativo vs surplus accumulato
- Calcolo mesi coperti dal fondo emergenza
- Rapporto spese fisse vs variabili

**G. Identificazione Sprechi**
- Micro-spese frequenti (es. caffè al bar)
- Spese impulsive (piccole, non pianificate)
- Categoria con maggior potenziale di risparmio
- Benchmark vs medie (se disponibili)

**H. Coaching Motivazionale**
- Streak giorni senza sforare
- Record personali
- Celebrazione miglioramenti
- Incoraggiamento dopo periodi difficili

**I. Consigli Contestuali**
- Inizio mese: recap mese precedente + consigli
- Fine mese con surplus: suggerimento allocazione
- Dopo grossa spesa: come ribilanciare
- Entrata extra: suggerimento divisione (goal/risparmio/svago)

### 11. Statistiche e Grafici
**Grafici da implementare:**
- Torta: distribuzione spese per categoria (mese corrente)
- Barre: confronto budget vs speso per categoria
- Linea: trend spese negli ultimi 6-12 mesi
- Linea: trend risparmio mensile
- Barre orizzontali: top 5 categorie di spesa
- Area: cash flow mensile (entrate vs uscite)
- Progress bars: avanzamento obiettivi

**Filtri:**
- Per periodo (settimana, mese, trimestre, anno, custom)
- Per categoria
- Per tipo (spese/entrate/tutto)

### 12. Sezione Guide Educative
Una sezione con contenuti statici (ma ben presentati) su:

**Guide da includere:**
1. **"Il metodo 50/30/20"** - Come dividere lo stipendio
2. **"Crea il tuo fondo emergenza"** - Quanto e come
3. **"Elimina i debiti"** - Strategie debt snowball e avalanche
4. **"Budgeting a base zero"** - Ogni euro ha uno scopo
5. **"Spese fisse vs variabili"** - Capire dove puoi tagliare
6. **"L'effetto latte"** - Come le piccole spese diventano grandi
7. **"Obiettivi SMART per i risparmi"** - Come definirli
8. **"Negoziare bollette e abbonamenti"** - Script e strategie
9. **"Meal planning per risparmiare"** - Organizzare la spesa
10. **"La regola delle 24 ore"** - Evitare acquisti impulsivi
11. **"Come aumentare le entrate"** - Side hustle e extra
12. **"Investire i risparmi"** - Introduzione base

Ogni guida ha: titolo, tempo di lettura, contenuto formattato, tips pratici.

### 13. Impostazioni
- Profilo utente (nome, email, avatar)
- Valuta principale
- Notifiche (on/off per ogni tipo, orari)
- Tema (light/dark/system)
- Esporta dati (CSV/PDF)
- Elimina account
- Info app e feedback

## 🎨 Design e UX

### Stile Visivo
- Design pulito e moderno, non minimalista estremo
- Colori: palette professionale con accenti vivaci per categorie
- Tipografia chiara e leggibile
- Icone consistenti per ogni categoria
- Micro-animazioni per feedback (es. quando aggiungi spesa)
- Empty states curati con illustrazioni

### Dark Mode
- Implementare theme switching completo
- Rispettare preferenze di sistema
- Colori ottimizzati per entrambi i temi
- Grafici leggibili in entrambe le modalità

### UX Principles
- Aggiungere una spesa deve richiedere massimo 3 tap
- Dashboard immediately useful (info chiave visibili subito)
- Insight e suggerimenti non invasivi ma sempre visibili
- Feedback immediato per ogni azione
- Gestione offline con sync quando torna connessione

## 🗄 Struttura Database Supabase

### Tabelle principali:
```sql
-- Users (estende auth.users)
profiles (
  id uuid references auth.users,
  full_name text,
  avatar_url text,
  main_currency text default 'EUR',
  monthly_budget decimal,
  notification_preferences jsonb,
  created_at timestamp
)

-- Categories
categories (
  id uuid,
  user_id uuid references profiles,
  name text,
  icon text,
  color text,
  budget decimal,
  is_preset boolean,
  is_active boolean,
  order_index int
)

-- Transactions
transactions (
  id uuid,
  user_id uuid,
  category_id uuid references categories,
  amount decimal,
  original_amount decimal,
  original_currency text,
  exchange_rate decimal,
  type enum ('expense', 'income'),
  description text,
  date date,
  is_recurring boolean,
  recurring_id uuid references recurring_transactions,
  tags text[],
  receipt_url text,
  is_shared boolean,
  created_at timestamp
)

-- Recurring Transactions
recurring_transactions (
  id uuid,
  user_id uuid,
  category_id uuid,
  amount decimal,
  description text,
  frequency enum ('monthly', 'quarterly', 'yearly'),
  next_date date,
  is_active boolean
)

-- Goals
goals (
  id uuid,
  user_id uuid,
  name text,
  icon text,
  target_amount decimal,
  current_amount decimal,
  target_date date,
  monthly_allocation decimal,
  is_completed boolean,
  completed_at timestamp
)

-- Shared Expenses
shared_expenses (
  id uuid,
  transaction_id uuid references transactions,
  total_amount decimal,
  user_share decimal,
  created_at timestamp
)

-- Shared Expense Participants
shared_expense_participants (
  id uuid,
  shared_expense_id uuid references shared_expenses,
  participant_name text,
  amount_owed decimal,
  is_paid boolean,
  paid_at timestamp,
  reminder_sent_at timestamp
)

-- Insights (cache per performance)
insights (
  id uuid,
  user_id uuid,
  type text,
  message text,
  priority enum ('high', 'medium', 'low'),
  action_type text,
  action_data jsonb,
  is_read boolean,
  is_dismissed boolean,
  valid_until timestamp,
  created_at timestamp
)

-- Monthly Summaries (per report veloci)
monthly_summaries (
  id uuid,
  user_id uuid,
  month date,
  total_income decimal,
  total_expenses decimal,
  savings decimal,
  savings_rate decimal,
  category_breakdown jsonb,
  created_at timestamp
)
```

### Row Level Security
Implementa RLS su tutte le tabelle per garantire che ogni utente veda solo i propri dati.

### Edge Functions (Supabase)
Considera edge functions per:
- Calcolo insight complessi
- Generazione report
- Conversione valute
- Pulizia dati periodica

## 📁 Struttura Progetto Expo
```
budget-wise/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Auth flow screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Main tab navigator
│   │   ├── index.tsx        # Dashboard
│   │   ├── transactions.tsx # Lista transazioni
│   │   ├── stats.tsx        # Statistiche
│   │   ├── goals.tsx        # Obiettivi
│   │   └── profile.tsx      # Profilo/Settings
│   ├── transaction/
│   │   ├── add.tsx          # Aggiungi transazione
│   │   └── [id].tsx         # Dettaglio transazione
│   ├── category/
│   │   └── [id].tsx         # Dettaglio categoria
│   ├── insights/
│   │   └── index.tsx        # Tutti gli insight
│   ├── guides/
│   │   ├── index.tsx        # Lista guide
│   │   └── [slug].tsx       # Singola guida
│   ├── shared/
│   │   └── index.tsx        # Gestione spese condivise
│   └── _layout.tsx
├── components/
│   ├── ui/                  # Componenti base riutilizzabili
│   ├── charts/              # Componenti grafici
│   ├── transactions/        # Componenti transazioni
│   ├── insights/            # Componenti insight/coaching
│   └── forms/               # Form components
├── hooks/                   # Custom hooks
├── services/
│   ├── supabase.ts          # Client e helpers Supabase
│   ├── insights.ts          # Logica generazione insight
│   ├── notifications.ts     # Gestione notifiche
│   └── currency.ts          # Conversione valute
├── stores/                  # Zustand stores
├── utils/                   # Utility functions
├── constants/               # Colori, categorie preset, etc.
├── types/                   # TypeScript types
└── assets/                  # Immagini, fonts
```

## ⚙️ Fasi di Sviluppo

### Fase 1: Setup e Infrastruttura
1. Inizializza progetto Expo con TypeScript
2. Configura Supabase (progetto, tabelle, RLS)
3. Implementa autenticazione completa
4. Setup navigazione base con Expo Router
5. Configura tema (light/dark) e componenti UI base

### Fase 2: Core Features
6. CRUD transazioni (spese/entrate)
7. Sistema categorie (preset + custom)
8. Dashboard con stats base
9. Budget mensile e per categoria
10. Visualizzazione progresso budget

### Fase 3: Features Avanzate
11. Spese ricorrenti
12. Obiettivi di risparmio
13. Grafici e statistiche
14. Spese condivise e crediti
15. Multi-valuta

### Fase 4: Intelligenza
16. Implementa motore insight
17. Tutti gli alert e suggerimenti
18. Report settimanali/mensili
19. Sistema notifiche push

### Fase 5: Polish
20. Sezione guide educative
21. Esportazione dati
22. Animazioni e micro-interazioni
23. Testing e bug fixing
24. Ottimizzazione performance

## 🚀 Note Implementative

- Usa TypeScript strict mode
- Implementa error boundaries
- Gestisci stati di loading ed empty states
- Implementa pull-to-refresh dove appropriato
- Cache dati localmente per performance
- Implementa retry logic per operazioni di rete
- Log analytics eventi chiave (opzionale)
- Testa su dispositivi reali iOS e Android

## 📝 Per iniziare

1. Crea il progetto Expo: `npx create-expo-app@latest budget-wise -t expo-template-blank-typescript`
2. Crea progetto Supabase e configura le tabelle
3. Procedi fase per fase, testando ogni feature prima di passare alla successiva
4. Committa frequentemente con messaggi descrittivi

---

Inizia dalla Fase 1 e procedi metodicamente. Per ogni fase, implementa, testa, e poi passa alla successiva. Chiedi conferma prima di procedere a fasi successive se hai dubbi architetturali.
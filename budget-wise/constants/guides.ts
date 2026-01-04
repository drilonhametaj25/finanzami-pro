export interface Guide {
  slug: string;
  title: string;
  description: string;
  readingTime: number; // minutes
  icon: string;
  content: string;
  tips: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'metodo-50-30-20',
    title: 'Il metodo 50/30/20',
    description: 'Come dividere lo stipendio in modo efficace',
    readingTime: 5,
    icon: 'chart-pie',
    content: `# Il Metodo 50/30/20

Il metodo 50/30/20 e una delle regole piu semplici e efficaci per gestire il proprio budget. Ideato dalla senatrice americana Elizabeth Warren, questo sistema divide le entrate in tre categorie principali.

## Come funziona

### 50% - Necessita
Meta del tuo reddito dovrebbe andare alle spese essenziali:
- Affitto o mutuo
- Bollette (luce, gas, acqua, internet)
- Spesa alimentare base
- Trasporti per lavoro
- Assicurazioni obbligatorie
- Spese mediche essenziali

### 30% - Desideri
Un terzo per le spese non essenziali ma che migliorano la qualita della vita:
- Ristoranti e uscite
- Abbonamenti streaming
- Shopping non essenziale
- Hobby e intrattenimento
- Viaggi e vacanze
- Palestra

### 20% - Risparmio e Debiti
Il restante 20% va dedicato al futuro finanziario:
- Fondo di emergenza
- Risparmi a lungo termine
- Investimenti
- Estinzione debiti (oltre il minimo)
- Obiettivi di risparmio specifici

## Come applicarlo

1. Calcola il tuo reddito netto mensile
2. Moltiplica per 0.5, 0.3 e 0.2
3. Imposta budget per categoria in FinanzaMi.pro
4. Monitora le spese settimanalmente
5. Ribilancia se necessario`,
    tips: [
      'Se vivi in una citta costosa, potresti dover adattare le percentuali (es. 60/20/20)',
      'Inizia tracciando le spese per un mese per capire il tuo punto di partenza',
      'Se hai debiti, considera di aumentare temporaneamente la quota risparmio/debiti',
    ],
  },
  {
    slug: 'fondo-emergenza',
    title: 'Crea il tuo fondo emergenza',
    description: 'Quanto risparmiare e come costruirlo',
    readingTime: 6,
    icon: 'shield-check',
    content: `# Il Fondo di Emergenza

Un fondo di emergenza e denaro messo da parte per affrontare spese impreviste o periodi difficili. E la base di qualsiasi piano finanziario solido.

## Perche e fondamentale

- Protegge da spese impreviste (riparazioni auto, spese mediche)
- Offre sicurezza in caso di perdita del lavoro
- Evita di indebitarsi per emergenze
- Riduce lo stress finanziario
- Permette di prendere decisioni migliori

## Quanto risparmiare

### Obiettivo minimo: 3 mesi di spese
Per chi ha un lavoro stabile e poche responsabilita.

### Obiettivo consigliato: 6 mesi di spese
Per la maggior parte delle persone.

### Obiettivo elevato: 12 mesi di spese
Per freelancer, imprenditori o chi ha responsabilita familiari.

## Come calcolarlo

1. Somma le tue spese mensili essenziali
2. Moltiplica per il numero di mesi target
3. Quello e il tuo obiettivo di fondo emergenza

Esempio: €1.500/mese x 6 mesi = €9.000

## Come costruirlo

1. Inizia in piccolo: anche €50/mese fanno differenza
2. Automatizza: imposta un bonifico automatico dopo lo stipendio
3. Usa un conto separato per non essere tentato
4. Aumenta gradualmente quando possibile
5. Non toccare il fondo se non per vere emergenze`,
    tips: [
      'Un conto deposito o un conto separato aiuta a non spendere il fondo',
      'Inizia con obiettivo €1.000, poi cresci gradualmente',
      'Dopo aver usato il fondo, ricostruiscilo il prima possibile',
    ],
  },
  {
    slug: 'eliminare-debiti',
    title: 'Elimina i debiti',
    description: 'Strategie debt snowball e avalanche',
    readingTime: 7,
    icon: 'credit-card-off',
    content: `# Strategie per Eliminare i Debiti

Liberarsi dai debiti richiede un piano. Ecco le due strategie piu efficaci.

## Metodo Snowball (Palla di neve)

### Come funziona
1. Elenca tutti i debiti dal piu piccolo al piu grande
2. Paga il minimo su tutti tranne il piu piccolo
3. Sul piu piccolo, versa tutto l'extra possibile
4. Quando e estinto, passa al successivo

### Vantaggi
- Vittorie rapide che motivano
- Psicologicamente gratificante
- Crea momentum positivo

### Esempio
- Debito A: €500 (minimo €50)
- Debito B: €2.000 (minimo €100)
- Debito C: €5.000 (minimo €200)

Con €500 disponibili: €50+€100+€350 sul debito A.

## Metodo Avalanche (Valanga)

### Come funziona
1. Elenca i debiti dal tasso di interesse piu alto al piu basso
2. Paga il minimo su tutti tranne quello con tasso piu alto
3. Su quello, versa tutto l'extra possibile
4. Quando e estinto, passa al successivo

### Vantaggi
- Risparmi piu soldi in interessi
- Matematicamente ottimale
- Estinzione totale piu veloce

## Quale scegliere?

- **Snowball**: se hai bisogno di motivazione e vittorie rapide
- **Avalanche**: se sei disciplinato e vuoi risparmiare al massimo

Entrambi funzionano. L'importante e sceglierne uno e seguirlo con costanza.`,
    tips: [
      'Non creare nuovi debiti mentre estingui quelli esistenti',
      'Considera di consolidare i debiti se i tassi sono molto alti',
      'Celebra ogni debito estinto, ma non con una spesa!',
    ],
  },
  {
    slug: 'budgeting-base-zero',
    title: 'Budgeting a base zero',
    description: 'Ogni euro ha uno scopo',
    readingTime: 5,
    icon: 'target',
    content: `# Budgeting a Base Zero

Nel budget a base zero, ogni euro delle tue entrate viene assegnato a una categoria specifica. Il risultato? Entrate - Spese pianificate = 0.

## Il concetto

Non significa spendere tutto, ma pianificare tutto. Anche il risparmio e una "spesa" nel budget a base zero.

## Come funziona

1. **Calcola le entrate totali del mese**
2. **Elenca tutte le spese previste**
   - Fisse: affitto, bollette, abbonamenti
   - Variabili: spesa, benzina, svago
   - Risparmio: fondo emergenza, obiettivi
3. **Assegna ogni euro**
   - Entrate €2.500
   - Spese fisse €1.200
   - Spese variabili €800
   - Risparmio €500
   - Totale: €2.500 - €2.500 = €0

## Vantaggi

- Pieno controllo sulle finanze
- Nessuna "fuga" di denaro
- Priorita chiare per ogni euro
- Facilita il raggiungimento degli obiettivi

## Gestire l'imprevisto

Crea una categoria "Buffer" o "Varie" per piccole spese non previste. Questo non rompe la regola: stai pianificando di avere un margine.

## Consigli pratici

- Rivedi il budget all'inizio di ogni mese
- Adatta alle spese stagionali (regali, vacanze)
- Usa FinanzaMi.pro per tracciare in tempo reale`,
    tips: [
      'Inizia con categorie ampie, poi affina nel tempo',
      'Prevedi sempre un margine per imprevisti',
      'Non essere troppo rigido: il budget deve adattarsi alla vita',
    ],
  },
  {
    slug: 'spese-fisse-variabili',
    title: 'Spese fisse vs variabili',
    description: 'Capire dove puoi tagliare',
    readingTime: 4,
    icon: 'scale-balance',
    content: `# Spese Fisse vs Variabili

Capire la differenza tra questi due tipi di spesa e fondamentale per ottimizzare il budget.

## Spese Fisse

Importi costanti che paghi regolarmente:
- Affitto/mutuo
- Bollette base
- Assicurazioni
- Abbonamenti fissi
- Rate di prestiti
- Spese condominiali

### Caratteristiche
- Prevedibili
- Difficili da modificare nel breve termine
- Spesso automatizzate

## Spese Variabili

Importi che cambiano mese per mese:
- Spesa alimentare
- Ristoranti e uscite
- Carburante
- Shopping
- Intrattenimento
- Regali

### Caratteristiche
- Flessibili
- Piu facili da controllare
- Richiedono attenzione costante

## Dove tagliare?

### Spese fisse
- Rinegozia affitto o mutuo
- Cambia fornitore luce/gas
- Rivedi abbonamenti inutilizzati
- Cerca assicurazioni migliori

### Spese variabili
- Pianifica la spesa alimentare
- Limita le uscite al ristorante
- Usa app di cashback
- Aspetta prima di comprare

## Il rapporto ideale

Obiettivo: spese fisse < 50% delle entrate

Se le spese fisse sono troppo alte, hai poco margine di manovra. Lavora per ridurle nel lungo termine.`,
    tips: [
      'Rivedi le spese fisse almeno una volta l\'anno',
      'Le variabili sono dove puoi avere impatto immediato',
      'Automatizza le fisse per non pensarci',
    ],
  },
  {
    slug: 'effetto-latte',
    title: "L'effetto latte",
    description: 'Come le piccole spese diventano grandi',
    readingTime: 4,
    icon: 'coffee',
    content: `# L'Effetto Latte (Latte Factor)

Il termine "Latte Factor" e stato coniato da David Bach. Rappresenta le piccole spese quotidiane che sembrano insignificanti ma si accumulano enormemente nel tempo.

## Il concetto

Un caffe al bar costa €1.50. Sembra poco, vero?

- 1 giorno: €1.50
- 1 settimana: €10.50
- 1 mese: €45
- 1 anno: €547
- 10 anni: €5.475

E questo e solo UN caffe al giorno.

## Esempi comuni di "latte factor"

- Caffe o cappuccino al bar
- Bottiglietta d'acqua
- Snack dal distributore
- Sigarette
- App e abbonamenti dimenticati
- Consegne a domicilio evitabili
- Parcheggi a pagamento

## Non significa privarsi

Il punto non e eliminare ogni piccola gioia, ma essere CONSAPEVOLI di quanto spendiamo in queste piccole cose.

## Come gestirlo

1. **Traccia tutto per un mese**
   Usa FinanzaMi.pro per registrare OGNI spesa, anche la piu piccola.

2. **Identifica i pattern**
   Quali piccole spese fai piu spesso?

3. **Decidi consapevolmente**
   Scegli quali mantenere e quali eliminare.

4. **Calcola il risparmio**
   €3/giorno = €1.095/anno. Cosa potresti fare con quei soldi?

5. **Reindirizza i risparmi**
   Metti la differenza in un obiettivo di risparmio.`,
    tips: [
      'Non devi eliminare tutto: scegli cosa conta davvero per te',
      'Porta il pranzo da casa anche solo 2-3 volte a settimana',
      'Un caffe a casa costa circa €0.20, al bar €1.50',
    ],
  },
  {
    slug: 'obiettivi-smart',
    title: 'Obiettivi SMART per i risparmi',
    description: 'Come definire obiettivi raggiungibili',
    readingTime: 5,
    icon: 'bullseye-arrow',
    content: `# Obiettivi SMART per il Risparmio

Un obiettivo vago come "voglio risparmiare" raramente funziona. Gli obiettivi SMART ti guidano al successo.

## Cosa significa SMART

### S - Specifico
Non "risparmiare di piu" ma "risparmiare per un viaggio in Giappone".

### M - Misurabile
Non "abbastanza" ma "€3.000".

### A - Achievable (Raggiungibile)
Realistico rispetto alle tue entrate e spese.

### R - Rilevante
Allineato con i tuoi valori e priorita.

### T - Temporizzato
Con una scadenza: "entro dicembre 2025".

## Esempio completo

❌ "Voglio risparmiare per le vacanze"

✅ "Voglio risparmiare €2.000 per un viaggio in Spagna ad agosto 2025, mettendo da parte €200 al mese per 10 mesi"

## Come creare obiettivi in FinanzaMi.pro

1. Vai alla sezione Obiettivi
2. Clicca su "Nuovo obiettivo"
3. Inserisci:
   - Nome specifico
   - Importo target
   - Data target (opzionale)
   - Allocazione mensile

## Consigli per il successo

- Inizia con 1-2 obiettivi massimo
- Visualizza il tuo obiettivo (foto, immagini)
- Celebra i traguardi intermedi
- Rivedi e aggiusta se necessario`,
    tips: [
      'Scrivi i tuoi obiettivi e rileggili spesso',
      'Collega ogni obiettivo a un\'emozione positiva',
      'Obiettivi troppo grandi? Dividili in sotto-obiettivi',
    ],
  },
  {
    slug: 'negoziare-bollette',
    title: 'Negoziare bollette e abbonamenti',
    description: 'Script e strategie pratiche',
    readingTime: 6,
    icon: 'phone',
    content: `# Come Negoziare Bollette e Abbonamenti

Molte aziende preferiscono mantenerti come cliente piuttosto che perderti. Sfrutta questo a tuo vantaggio.

## Principi base

1. **Preparati prima di chiamare**
   - Conosci quanto paghi attualmente
   - Cerca offerte della concorrenza
   - Sappi cosa vuoi ottenere

2. **Sii gentile ma deciso**
   - Gli operatori sono persone
   - La gentilezza apre porte
   - Ma non cedere facilmente

3. **Non aver paura di chiedere**
   - Il peggio che puo succedere e un "no"
   - Spesso ottieni almeno qualcosa

## Script per la chiamata

### Apertura
"Buongiorno, sono [Nome] e sono vostro cliente da [X anni]. Sto rivedendo le mie spese e ho notato che esistono offerte piu convenienti sul mercato. Vorrei capire se potete fare qualcosa per mantenermi come cliente."

### Se dicono no
"Capisco. Potrei parlare con l'ufficio retention o con un supervisore? Ho davvero bisogno di ridurre questa spesa."

### Ultimo tentativo
"Se non e possibile migliorare l'offerta, devo valutare di passare a [concorrente]. C'e qualcosa che potete fare?"

## Cosa negoziare

- Telefonia mobile e fissa
- Internet
- Assicurazioni (auto, casa)
- Abbonamenti streaming
- Palestra
- Servizi bancari

## Quando chiamare

- Fine contratto
- Dopo un aumento di prezzo
- Quando trovi offerta migliore
- Inizio anno (budget freschi)`,
    tips: [
      'Chiama sempre di mattina: operatori piu freschi e disponibili',
      'Annota nome operatore e numero pratica',
      'Se non ottieni risultati, richiama: potresti trovare qualcuno piu disponibile',
    ],
  },
  {
    slug: 'meal-planning',
    title: 'Meal planning per risparmiare',
    description: 'Organizzare la spesa alimentare',
    readingTime: 5,
    icon: 'food-apple',
    content: `# Meal Planning: Risparmiare sulla Spesa

La spesa alimentare e una delle voci dove si puo risparmiare di piu con una buona organizzazione.

## Perche funziona

- Evita acquisti impulsivi
- Riduce lo spreco alimentare
- Meno uscite al supermercato
- Pasti piu sani
- Meno consegne a domicilio

## Come fare meal planning

### 1. Pianifica i pasti della settimana
- Colazione
- Pranzo
- Cena
- Spuntini

### 2. Controlla cosa hai gia
- Frigo
- Dispensa
- Freezer

### 3. Crea la lista della spesa
- Solo cio che serve per le ricette
- Ingredienti base mancanti
- Niente extra!

### 4. Fai la spesa UNA volta
- Risparmia tempo
- Evita tentazioni
- Compra a stomaco pieno

## Consigli pratici

**Cucina in batch**
Prepara porzioni extra e congela. Pranzi pronti per la settimana.

**Riutilizza gli ingredienti**
Pollo arrosto → insalata di pollo → brodo

**Sfrutta le offerte**
Pianifica i pasti intorno a cosa e in sconto.

**Menu a rotazione**
3-4 menu settimanali che ruotano semplificano tutto.

## Risparmio stimato

Una famiglia che passa dal "compro cosa mi viene in mente" al meal planning risparmia in media il 25-30% sulla spesa alimentare.`,
    tips: [
      'Dedica 30 minuti la domenica alla pianificazione',
      'Usa app come Mealime o semplicemente Notes',
      'Coinvolgi la famiglia: ognuno sceglie un pasto',
    ],
  },
  {
    slug: 'regola-24-ore',
    title: 'La regola delle 24 ore',
    description: 'Evitare gli acquisti impulsivi',
    readingTime: 4,
    icon: 'clock-outline',
    content: `# La Regola delle 24 Ore

Una delle strategie piu semplici ed efficaci per evitare acquisti impulsivi.

## Come funziona

Prima di ogni acquisto non essenziale, aspetta 24 ore.

1. Vedi qualcosa che vuoi comprare
2. NON comprarlo subito
3. Torna a casa (o chiudi il sito)
4. Aspetta 24 ore
5. Se lo vuoi ancora, valuta se comprarlo

## Perche funziona

- Elimina l'impulso emotivo
- Permette di valutare razionalmente
- Spesso ti dimentichi dell'oggetto
- Evita il "rimorso dell'acquirente"

## Quando applicarla

✅ Shopping online
✅ Abbigliamento non necessario
✅ Gadget e tecnologia
✅ Decorazioni per casa
✅ Acquisti "in offerta"

## Quando NON applicarla

❌ Emergenze reali
❌ Necessita immediate
❌ Acquisti gia pianificati e budgetati

## Versioni estese

- **Regola 7 giorni**: per acquisti €100-500
- **Regola 30 giorni**: per acquisti oltre €500

## Il test delle 3 domande

Durante le 24 ore, chiediti:
1. Ne ho davvero BISOGNO o lo VOGLIO?
2. Ho qualcosa di simile a casa?
3. Cosa potrei fare con quei soldi invece?

Se dopo 24 ore vuoi ancora l'oggetto E passa il test delle 3 domande, probabilmente e un acquisto ragionevole.`,
    tips: [
      'Togli le app di shopping dal telefono',
      'Disattiva le notifiche "offerta in scadenza"',
      'Crea una wishlist: aggiungi li invece di comprare',
    ],
  },
  {
    slug: 'aumentare-entrate',
    title: 'Come aumentare le entrate',
    description: 'Side hustle e reddito extra',
    readingTime: 6,
    icon: 'cash-plus',
    content: `# Aumentare le Entrate

Risparmiare e importante, ma c'e un limite a quanto puoi tagliare. Non c'e limite a quanto puoi guadagnare.

## Strategie nel lavoro attuale

### Chiedi un aumento
- Documenta i tuoi risultati
- Cerca dati di mercato sul tuo ruolo
- Scegli il momento giusto (dopo un successo)
- Presenta una richiesta specifica

### Cerca promozioni
- Fai sapere che vuoi crescere
- Prendi responsabilita extra
- Sviluppa nuove competenze
- Costruisci relazioni interne

## Side Hustle (Lavori Extra)

### Basati sulle tue competenze
- Freelancing (scrittura, design, programmazione)
- Consulenza nel tuo settore
- Tutoring/Lezioni private
- Traduzioni

### Basati sul tempo
- Consegne (food delivery, corrieri)
- Dog sitting/Pet sitting
- Affitto stanza (Airbnb)
- Babysitting

### Basati su asset
- Vendita oggetti usati
- Affitto auto/bici
- Affitto attrezzature
- Affitto parcheggio

### Basati sulla creativita
- Vendita artigianato (Etsy)
- Contenuti digitali (ebook, corsi)
- YouTube/Podcast
- Fotografia

## Come iniziare

1. **Valuta il tuo tempo disponibile**
   Quante ore settimanali puoi dedicare?

2. **Identifica le tue competenze**
   Cosa sai fare che altri pagherebbero?

3. **Inizia in piccolo**
   Testa l'idea prima di investire troppo.

4. **Scala gradualmente**
   Aumenta l'impegno solo se funziona.`,
    tips: [
      'Un side hustle non deve essere per sempre: anche 6 mesi possono fare la differenza',
      'Reinvesti parte dei guadagni extra nei tuoi obiettivi',
      'Attenzione al burnout: il riposo e importante',
    ],
  },
  {
    slug: 'investire-risparmi',
    title: 'Investire i risparmi',
    description: 'Introduzione base agli investimenti',
    readingTime: 7,
    icon: 'trending-up',
    content: `# Introduzione agli Investimenti

Una volta costruito il fondo emergenza e eliminate le spese inutili, e il momento di far lavorare i tuoi soldi.

## Prima di investire

### Prerequisiti essenziali
1. ✅ Fondo emergenza di 3-6 mesi
2. ✅ Nessun debito ad alto interesse
3. ✅ Entrate stabili
4. ✅ Budget sotto controllo
5. ✅ Obiettivi chiari

## Concetti base

### Interesse composto
E l'ottava meraviglia del mondo. I tuoi guadagni generano altri guadagni.

€100 al mese, 7% annuo:
- 10 anni: €17.409
- 20 anni: €52.397
- 30 anni: €121.997

### Rischio e rendimento
Maggiore il potenziale rendimento, maggiore il rischio. Non esistono investimenti "sicuri" ad alto rendimento.

### Diversificazione
Non mettere tutte le uova in un paniere. Dividi tra asset diversi.

## Opzioni principali

### Basso rischio
- Conti deposito
- Titoli di stato
- Obbligazioni investment grade

### Medio rischio
- ETF diversificati
- Fondi bilanciati
- Obbligazioni corporate

### Alto rischio
- Azioni singole
- Criptovalute
- Startup

## Per iniziare

1. **Definisci l'orizzonte temporale**
   Quando ti serviranno i soldi?

2. **Valuta la tolleranza al rischio**
   Quanto potresti sopportare di perdere?

3. **Inizia con poco**
   Anche €50/mese su un ETF globale.

4. **Automatizza**
   PAC (Piano di Accumulo) mensile.

5. **Formati continuamente**
   Mai investire in cio che non capisci.

## Disclaimer

Questa e solo un'introduzione educativa. Per decisioni di investimento, consulta un consulente finanziario qualificato.`,
    tips: [
      'Il momento migliore per iniziare era ieri. Il secondo migliore e oggi.',
      'I costi contano: preferisci strumenti a basse commissioni',
      'Non guardare il portafoglio ogni giorno: investi a lungo termine',
    ],
  },
];

# BudgetWise - Strategia di Monetizzazione

## Panoramica Progetto

**Nome App**: BudgetWise
**Tipo**: App di gestione budget e finanza personale
**Stack**: React Native (Expo SDK 54), TypeScript, Supabase
**Target**: iOS, Android, Web

---

## Analisi di Mercato

### Competitor Principali
| App | Modello | Prezzo Premium |
|-----|---------|----------------|
| YNAB | Abbonamento | €14.99/mese |
| Copilot | Abbonamento | €9.99/mese |
| Buddy | Freemium | €4.99/mese |
| Money Manager | Freemium + Ads | €2.99/mese |
| Spendee | Freemium | €2.99/mese |

### Benchmark Metriche
- **Conversion rate Free→Premium**: 2-5%
- **ARPU** (Average Revenue Per User): €0.50-2.00/mese
- **Retention 30 giorni**: 20-35%
- **Churn rate Premium**: 5-8%/mese

---

## Punti di Forza di BudgetWise

1. **Gamification Avanzata**
   - 8 livelli (Principiante → Leggenda)
   - 30+ badge/achievement
   - Daily streaks con bonus XP
   - Monthly challenges
   - Health Score (0-100)

2. **Insights Intelligenti**
   - Coaching personalizzato
   - Alert budget progressivi (70%, 85%, 95%)
   - Analisi pattern di spesa
   - Suggerimenti ottimizzazione

3. **Ecosistema Completo**
   - Budget tracking
   - Obiettivi di risparmio
   - Spese condivise
   - Tracking investimenti/patrimonio
   - Gestione abbonamenti
   - 12 guide educative

4. **UX Moderna**
   - Design pulito con React Native Paper
   - Grafici interattivi
   - Navigazione intuitiva (Expo Router)

---

## Modello di Monetizzazione: FREEMIUM

### Decisione: NO Pubblicità

**Motivi:**
- App di finanza = richiede fiducia utente
- Pubblicità compromette percezione di serietà
- Guadagno per utente troppo basso (€0.01-0.05/giorno)
- Servono 100k+ utenti attivi per guadagni decenti
- UX peggiore = recensioni negative = meno download

---

## Struttura Piani

### Piano FREE (Gratuito per sempre)

**Funzionalità incluse:**
- Dashboard base con saldo mensile
- Transazioni illimitate (spese/entrate)
- 5 categorie preset (Casa, Spesa, Trasporti, Svago, Altro)
- 1 obiettivo di risparmio
- Budget mensile totale
- Statistiche ultimo mese
- 3 guide educative base
- Gamification base (livelli 1-3, badge base)

**Limitazioni:**
- Max 5 categorie
- Max 1 obiettivo
- No insights avanzati
- No spese condivise
- No tracking investimenti
- No export/report
- No temi custom

### Piano PREMIUM

**Prezzo:**
- **Mensile**: €3.99/mese
- **Annuale**: €29.99/anno (risparmio 37%)
- **Lifetime**: €79.99 una tantum (futuro)

**Funzionalità sbloccate:**
- Tutte le 15+ categorie preset
- Categorie custom illimitate
- Obiettivi di risparmio illimitati
- Insights intelligenti completi
- Spese condivise
- Tracking investimenti e patrimonio
- Gestione abbonamenti
- Statistiche avanzate (6-12 mesi)
- Tutte le 12 guide educative
- Gamification completa (tutti i livelli, badge, challenges)
- Temi e personalizzazione
- Export dati
- Report PDF annuale
- Badge "Premium Member"
- Supporto prioritario

---

## Acquisti Una Tantum

### Report PDF Annuale - €2.99
**Contenuto:**
- Riepilogo entrate/uscite anno
- Grafici distribuzione per categoria
- Trend mensili
- Top 5 categorie di spesa
- Obiettivi raggiunti
- Confronto anno precedente (se disponibile)
- Statistiche gamification (livello, badge, streak)
- Consigli personalizzati

### Tip Jar (Supporta lo Sviluppatore)
| Opzione | Prezzo | Badge |
|---------|--------|-------|
| Caffè | €1.99 | "Supporter" |
| Pizza | €4.99 | "Super Supporter" |
| Cena | €9.99 | "Amazing Supporter" |

**Benefici:**
- Badge permanente nel profilo
- Nome nei credits dell'app
- Accesso anticipato a nuove feature (beta)

---

## Proiezioni di Guadagno

### Scenario Conservativo
| Periodo | Download | Utenti Attivi | Premium (3%) | Guadagno/Mese |
|---------|----------|---------------|--------------|---------------|
| 6 mesi | 5.000 | 1.500 | 45 | €180 |
| 12 mesi | 15.000 | 4.500 | 135 | €540 |
| 24 mesi | 40.000 | 12.000 | 360 | €1.440 |

**Guadagno Anno 2**: ~€17.000

### Scenario Moderato
| Periodo | Download | Utenti Attivi | Premium (5%) | Guadagno/Mese |
|---------|----------|---------------|--------------|---------------|
| 6 mesi | 15.000 | 5.000 | 250 | €1.000 |
| 12 mesi | 50.000 | 17.000 | 850 | €3.400 |
| 24 mesi | 150.000 | 50.000 | 2.500 | €10.000 |

**Guadagno Anno 2**: ~€120.000

### Scenario Ottimistico
| Periodo | Download | Utenti Attivi | Premium (7%) | Guadagno/Mese |
|---------|----------|---------------|--------------|---------------|
| 6 mesi | 50.000 | 20.000 | 1.400 | €5.600 |
| 12 mesi | 200.000 | 70.000 | 4.900 | €19.600 |
| 24 mesi | 500.000 | 175.000 | 12.250 | €49.000 |

**Guadagno Anno 2**: ~€588.000

---

## Costi Operativi

### Costi Fissi
| Voce | Costo |
|------|-------|
| Apple Developer Program | €99/anno |
| Google Play Console | €25 (una tantum) |
| Dominio (opzionale) | €10-15/anno |

### Costi Variabili (Supabase)
| Utenti Attivi | Piano | Costo/Mese |
|---------------|-------|------------|
| 0-500 | Free | €0 |
| 500-10.000 | Pro | €25 |
| 10.000-100.000 | Pro + usage | €25-100 |
| 100.000+ | Team | €200+ |

### Break-even Analysis
- **Costi fissi annui**: ~€150
- **Costi variabili**: dipende da utenti
- **Break-even**: ~40 utenti premium/mese (con piano Pro Supabase)

---

## Implementazione Tecnica

### Tecnologia Scelta: RevenueCat

**Perché RevenueCat:**
- Gestisce iOS + Android + Web
- Dashboard analytics inclusa
- Webhook per Supabase
- Free fino a $2.500/mese di revenue
- SDK React Native ufficiale

### Prodotti da Configurare

```
SUBSCRIPTION:
- budgetwise_premium_monthly (€3.99/mese)
- budgetwise_premium_yearly (€29.99/anno)

ONE-TIME:
- budgetwise_report_annual (€2.99)
- budgetwise_tip_coffee (€1.99)
- budgetwise_tip_pizza (€4.99)
- budgetwise_tip_dinner (€9.99)
```

### Entitlements
```
premium:
  - budgetwise_premium_monthly
  - budgetwise_premium_yearly

supporter:
  - budgetwise_tip_coffee
  - budgetwise_tip_pizza
  - budgetwise_tip_dinner
```

---

## Roadmap Monetizzazione

### Fase 1 - MVP (Ora)
- [x] Definire piani Free/Premium
- [x] Implementare subscription store
- [x] Integrare RevenueCat
- [x] Creare paywall UI
- [x] Implementare logica blocco feature
- [x] Aggiungere Report PDF
- [x] Aggiungere Tip Jar

### Fase 2 - Post-Lancio
- [ ] A/B test prezzi
- [ ] Aggiungere piano Lifetime
- [ ] Pack temi premium
- [ ] Widget iOS/Android

### Fase 3 - Crescita
- [ ] Referral program
- [ ] Affiliate marketing
- [ ] Contenuti educativi premium
- [ ] Coaching 1:1

---

## Metriche da Tracciare

### KPI Principali
- **MRR** (Monthly Recurring Revenue)
- **Conversion Rate** (Free → Premium)
- **Churn Rate** (cancellazioni/mese)
- **LTV** (Lifetime Value per utente)
- **CAC** (Customer Acquisition Cost)

### Formula LTV
```
LTV = ARPU × (1 / Churn Rate)

Esempio:
ARPU = €3.99/mese
Churn = 5%/mese
LTV = €3.99 × (1/0.05) = €79.80
```

---

## Strategie di Crescita

### ASO (App Store Optimization)
**Keywords target:**
- budget app
- gestione spese
- risparmio
- finanza personale
- money manager
- budget tracker

### Content Marketing
- Blog su finanza personale
- TikTok/Instagram Reels
- YouTube tutorial

### Viral Loops
- Referral: €1 credit per amico
- Spese condivise: invita amici per splittare
- Sfide social: competi con amici

---

## Note Legali

### Privacy
- GDPR compliant
- Dati finanziari criptati
- No vendita dati a terzi
- Privacy policy chiara

### Termini di Servizio
- Abbonamento auto-rinnovante
- Cancellazione in qualsiasi momento
- Rimborso secondo policy Apple/Google

---

## Contatti e Risorse

### Documentazione
- [RevenueCat Docs](https://docs.revenuecat.com)
- [Expo In-App Purchases](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/console/about/guides/monetize/)

---

*Documento generato il 2 Gennaio 2026*
*BudgetWise - La tua finanza personale, gamificata*

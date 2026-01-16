# 🌐 Modalità Offline - PULSE ERP

## Panoramica

PULSE ERP è ora completamente **offline-first**: puoi continuare a lavorare senza connessione internet, e tutti i dati verranno sincronizzati automaticamente quando la connessione torna disponibile.

## Funzionalità

### ✅ Detez rilevamento automatico connessione
- Verifica costante dello stato di connessione ogni 30 secondi
- Rilevamento istantaneo tramite eventi browser (online/offline)
- Health check al server per conferma connettività

### 📦 Queue di sincronizzazione
- Tutte le operazioni offline vengono salvate in una coda locale
- Retry automatico fino a 3 tentativi per operazione fallita
- Salvataggio persistente nel localStorage del browser

### 🔔 Notifiche intelligenti
- Notifica quando si passa offline: "📡 Modalità offline attivata"
- Notifica quando si torna online: "🌐 Connessione ripristinata"
- Notifica al completamento sincronizzazione
- Badge con contatore operazioni in attesa

### 🔄 Sincronizzazione automatica
- Parte automaticamente quando la connessione torna disponibile
- Sincronizza tutte le operazioni in coda rispettando l'ordine
- Report finale con esito sincronizzazione

## Come Usare

### 1. Utilizzare l'indicatore di stato

Aggiungi l'indicatore nella UI (es. in topbar o sidebar):

```tsx
import { OfflineIndicator } from '@/components/OfflineIndicator';

function YourComponent() {
  return (
    <div>
      <OfflineIndicator />
      {/* resto del componente */}
    </div>
  );
}
```

L'indicatore mostra:
- **🌐 Online** (verde) - Connesso al server
- **📡 Offline** (arancione) - Modalità offline
- **🔄 Sincronizzazione...** (blu) - Sync in corso
- **Badge rosso** - Numero operazioni in attesa

### 2. Usare lo stato offline nei componenti

```tsx
import { useOfflineStatus } from '@/lib/offline-manager';

function YourComponent() {
  const { status, pendingCount, isOnline } = useOfflineStatus();

  return (
    <div>
      {!isOnline && (
        <Alert>Modalità offline - I dati verranno sincronizzati</Alert>
      )}
      {pendingCount > 0 && (
        <span>{pendingCount} operazioni in attesa</span>
      )}
    </div>
  );
}
```

### 3. Accodare operazioni offline (opzionale)

Di default il sistema funziona in modalità **offline-first** automatica. 

Se vuoi accodare manualmente un'operazione:

```tsx
import { offlineManager } from '@/lib/offline-manager';

const handleSave = async (data) => {
  try {
    // Prova a salvare normalmente
    await fetch('/api/something', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    // Se fallisce (offline), accoda
    offlineManager.queueOperation('/api/something', 'POST', data);
  }
};
```

## File di configurazione

### Componenti creati:

1. **`client/src/lib/offline-manager.ts`**
   - Logica principale di gestione offline
   - Service worker simulation
   - Hook React `useOfflineStatus()`

2. **`client/src/components/OfflineIndicator.tsx`**
   - Componente visivo indicatore stato
   - Banner notifiche floating

3. **`server/routes/health.ts`**
   - Endpoint `/api/health` per health check

## Comportamento

### Quando sei ONLINE
- Tutte le operazioni funzionano normalmente
- Se ci sono operazioni in coda, vengono sincronizzate automaticamente

### Quando vai OFFLINE
1. Viene mostrato banner "📡 Modalità offline attivata"
2. L'indicatore diventa arancione
3. Tutte le operazioni future vengono accodate
4. Puoi continuare a lavorare normalmente

### Quando torni ONLINE
1. Viene mostrato banner "🌐 Connessione ripristinata"
2. L'indicatore diventa blu (syncing)
3. Partono le sincronizzazioni automatiche
4. Al termine, banner "✅ Sincronizzazione completata"
5. L'indicatore torna verde

## Database Locale

PULSE ERP usa **SQLite** come database locale, quindi tutti i dati sono già salvati sul dispositivo. La sincronizzazione serve principalmente per:

- Notificare il server di modifiche locali
- Ricevere aggiornamenti da altri utenti/dispositivi
- Backup cloud (se configurato)

## Vantaggi

✅ **Zero interruzioni**: Lavori sempre, anche senza internet
✅ **Dati sicuri**: Tutto salvato localmente in SQLite  
✅ **Sincronizzazione intelligente**: Retry automatico e gestione errori
✅ **UX migliorata**: Notifiche chiare dello stato di connessione
✅ **Efficienza**: Non blocca l'utente durante operazioni di rete

## Note Tecniche

- **Storage locale**: `localStorage` per queue di sync
- **Database**: SQLite (già presente in PULSE ERP)
- **Retry policy**: Max 3 tentativi per operazione
- **Check interval**: 30 secondi
- **Dimensione max queue**: Illimitata (gestita da localStorage del browser)

## Troubleshooting

### "Le operazioni in coda non si sincronizzano"
1. Verifica che il server sia raggiungibile
2. Controlla la console browser per errori
3. Se necessario, pulisci manualmente la queue:
   ```js
   offlineManager.clearQueue()
   ```

### "Non vedo le notifiche"
1. Controlla i permessi notifiche del browser
2. Le notifiche desktop richiedono consenso esplicito
3. Il banner interno funziona sempre, anche senza permessi

### "L'indicatore non si aggiorna"
1. Assicurati di aver importato `<OfflineNotificationBanner />` in App.tsx
2. Verifica che non ci siano errori React nella console
3. Controlla che `/api/health` risponda correttamente

---

**Versione**: 1.0  
**Ultima modifica**: Gennaio 2026  
**Autore**: Team PULSE ERP

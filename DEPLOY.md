# Guida alla Pubblicazione (Internet Deployment)

Hai diverse opzioni per rendere accessibile PULSE ERP da internet, a seconda delle tue esigenze.

## Opzione 1: Cloudflare Tunnel (Consigliato per semplicità)
Questo metodo è il più sicuro e non richiede modifiche al router.
1. Scarica `cloudflared` da [cloudflare.com](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation).
2. Apri un terminale (PowerShell).
3. Esegui il comando:
   ```powershell
   cloudflared tunnel --url http://localhost:5000
   ```
4. Ti verrà fornito un link temporaneo `https://....trycloudflare.com` che puoi condividere.

**Per un dominio fisso:**
Se possiedi un dominio, puoi [configurare un tunnel persistente](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/) gratuitamente.

## Opzione 2: Port Forwarding (IP Pubblico)
Se hai un IP pubblico statico o usi un servizio Dynamic DNS (es. No-IP).
1. Accedi al tuo router.
2. Apri la porta **5000** (TCP) e indirizzala all'IP locale del tuo PC (es. `192.168.1.x`).
3. L'applicazione sarà accessibile su `http://TUO_IP_PUBBLICO:5000`.

> [!WARNING]
> Questa opzione espone direttamente il tuo server. Assicurati di avere firewall attivi.

## Opzione 3: Server Virtuale (VPS)
Se vuoi ospitare l'applicazione su un server dedicato (Linux/Windows).

### 1. Preparazione File
Esegui la build sul tuo PC di sviluppo:
```powershell
npm run build
```
Questo creerà una cartella `dist` e `dist-desktop` (ignora quest'ultima per il web).

### 2. Cosa Copiare
Copia sul server i seguenti file/cartelle:
- Cartella `dist`
- File `package.json`
- File `.env` (crealo con le variabili corrette)
- Cartella `migrations` (se presente e necessaria per il DB)

### 3. Setup su Server (Esempio Linux/Node)
Sul server:
```bash
# Installa le dipendenze di produzione
npm install --omit=dev

# Avvia l'applicazione
npm start
```
L'app girerà sulla porta definita in `PORT` (default 5000).

---

## Nota importante sul Database
PULSE ERP usa **SQLite**. Il database è un file (es. `sqlite.db`) che risiede sul disco.
- **Se usi Opzione 1 o 2**: Il database rimane sul tuo PC.
- **Se usi Opzione 3**: Devi decidere se copiare il tuo DB esistente o iniziarne uno nuovo sul server. Assicurati che la cartella dove risiede il DB sia scrivibile.

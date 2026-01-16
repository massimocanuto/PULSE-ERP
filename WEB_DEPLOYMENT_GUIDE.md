# Guida Deployment Web - PULSE ERP

Questa guida spiega come deployare la versione online/PWA di PULSE ERP.

## 🌐 Overview

La versione web di PULSE ERP include:
- Frontend React con supporto PWA
- Service Worker per funzionalità offline
- Backend Express API
- Database PostgreSQL (consigliato) o MySQL

## 📋 Requisiti Server

### Minimo

- **CPU**: 2 core
- **RAM**: 2 GB
- **Storage**: 20 GB
- **OS**: Linux (Ubuntu 20.04+), Windows Server
- **Node.js**: 18+
- **Database**: PostgreSQL 14+ o MySQL 8+

### Consigliato (Produzione)

- **CPU**: 4+ core
- **RAM**: 4+ GB  
- **Storage**: 50+ GB SSD
- **OS**: Linux (Ubuntu 22.04 LTS)
- **Node.js**: 20 LTS
- **Database**: PostgreSQL 15+

## 🏗️ Build per Produzione

### 1. Build Applicazione

```bash
npm install
npm run build:web
```

Output in `dist/`:
- `dist/public/` - Client statico
- `dist/index.cjs` - Server API

### 2. Verifica Build

```bash
# Test locale
npm start
```

Apri http://localhost:5000 per verificare.

## 🚀 Opzioni di Deployment

### Opzione A: VPS Manuale (DigitalOcean, Linode, etc.)

#### 1. Preparazione Server

```bash
# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Installa Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installa PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installa PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Setup Database

```bash
# Accedi a PostgreSQL
sudo -u postgres psql

# Crea database e utente
CREATE DATABASE pulse_erp;
CREATE USER pulse_user WITH ENCRYPTED PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE pulse_erp TO pulse_user;
\q
```

#### 3. Deploy Applicazione

```bash
# Crea directory app
sudo mkdir -p /var/www/pulse-erp
sudo chown -R $USER:$USER /var/www/pulse-erp
cd /var/www/pulse-erp

# Carica i file (via git, scp, ftp, etc.)
# Esempio con git:
git clone https://github.com/tuoaccount/PULSE-ERP.git .

# Installa dipendenze (solo produzione)
npm ci --production

# Esegui build
npm run build:web
```

#### 4. Configurazione Ambiente

Crea `.env` in `/var/www/pulse-erp/`:

```env
NODE_ENV=production
PORT=5000

# Database PostgreSQL
DATABASE_URL=postgresql://pulse_user:your_password_here@localhost:5432/pulse_erp

# Session Secret (genera una stringa casuale)
SESSION_SECRET=your-super-secret-key-change-this

# Email (opzionale)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth (opzionale)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 5. Avvio con PM2

```bash
# Avvia applicazione
pm2 start dist/index.cjs --name pulse-erp

# Salva configurazione PM2
pm2 save

# Avvio automatico al boot
pm2 startup
# Esegui il comando suggerito da PM2
```

#### 6. Setup Nginx (Reverse Proxy + HTTPS)

```bash
# Installa Nginx e Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Configurazione Nginx
sudo nano /etc/nginx/sites-available/pulse-erp
```

Contenuto del file:

```nginx
server {
    listen 80;
    server_name tuodominio.com www.tuodominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Abilita sito
sudo ln -s /etc/nginx/sites-available/pulse-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup HTTPS con Let's Encrypt
sudo certbot --nginx -d tuodominio.com -d www.tuodominio.com
```

### Opzione B: Vercel/Netlify (Solo Frontend - richiede backend separato)

**Non consigliato** per PULSE ERP completo, ma possibile per solo frontend:

```bash
# Vercel
npm i -g vercel
vercel deploy --prod

# Netlify
npm i -g netlify-cli
netlify deploy --prod
```

Dovrai deployare il backend separatamente (es. Railway, Render).

### Opzione C: Railway/Render (Platform as a Service)

#### Railway

1. Vai su https://railway.app
2. Connetti il repository GitHub
3. Aggiungi PostgreSQL addon
4. Configura variabili d'ambiente
5. Deploy automatico

#### Render

1. Vai su https://render.com
2. Crea nuovo Web Service
3. Collega repository
4. Build command: `npm install && npm run build:web`
5. Start command: `npm start`
6. Aggiungi PostgreSQL database
7. Configura variabili d'ambiente

### Opzione D: Docker (Containerizzato)

```bash
# Build immagine
docker build -t pulse-erp .

# Run con docker-compose
docker-compose up -d
```

Crea `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://pulse_user:password@db:5432/pulse_erp
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=pulse_erp
      - POSTGRES_USER=pulse_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔐 Sicurezza

### Checklist Produzione

- [ ] HTTPS attivo (certificato SSL)
- [ ] Firewall configurato (solo porte 80, 443, 22)
- [ ] Variabili d'ambiente securizzate (non committare `.env`)
- [ ] Session secret randomizzato e forte
- [ ] Database password forte
- [ ] Backup automatici configurati
- [ ] Rate limiting attivo (già implementato nel codice)
- [ ] CORS configurato correttamente
- [ ] Aggiornamenti sistema regolari

### Backup Database

```bash
# Backup manuale PostgreSQL
pg_dump -U pulse_user -d pulse_erp > backup_$(date +%Y%m%d).sql

# Backup automatico (cron)
crontab -e
# Aggiungi: 0 2 * * * pg_dump -U pulse_user -d pulse_erp > /backup/pulse_erp_$(date +\%Y\%m\%d).sql
```

## 📱 Test PWA

Dopo il deployment:

1. Apri l'app in Chrome/Edge
2. Controlla DevTools > Application > Manifest
3. Verifica Service Worker attivo
4. Prova installazione PWA (pulsante + nella barra indirizzo)
5. Test modalità offline

## 📊 Monitoring

### PM2 Monitoring

```bash
# Dashboard
pm2 monit

# Logs
pm2 logs pulse-erp

# Status
pm2 status
```

### Logs Nginx

```bash
# Access log  
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Aggiornamenti

```bash
cd /var/www/pulse-erp

# Pull nuove modifiche
git pull origin main

# Reinstalla dipendenze se necessario
npm ci --production

# Rebuild
npm run build:web

# Restart
pm2 restart pulse-erp
```

## 🚨 Troubleshooting

### App non risponde

```bash
pm2 restart pulse-erp
pm2 logs pulse-erp --lines 100
```

### Database connection error

Verifica:
1. PostgreSQL è in esecuzione: `sudo systemctl status postgresql`
2. Credenziali corrette in `.env`
3. Database esiste: `psql -U pulse_user -d pulse_erp`

### HTTPS non funziona

```bash
# Rinnova certificato
sudo certbot renew

# Verifica Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 💰 Costi Stimati

### VPS
- **DigitalOcean**: $12-24/mese (4GB RAM)
- **Linode**: $12-24/mese
- **Hetzner**: €5-20/mese (più economico)

### PaaS
- **Railway**: $5-20/mese
- **Render**: $7-25/mese
- **Heroku**: $7-25/mese

### Domain + SSL
- **Domain**: ~$10-15/anno
- **SSL**: Gratis (Let's Encrypt)

## 📚 Risorse Utili

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

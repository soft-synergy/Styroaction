# 🚀 Deployment Guide - Styrtoaction.pl

## Wymagania wstępne

- VPS z Ubuntu/Debian (lub inny Linux)
- Node.js 18+ i npm
- Domeny wskazujące na VPS:
  - `styroaction.pl` → VPS IP
  - `api.styroaction.pl` → VPS IP
- SSH dostęp do serwera

## Szybki start

### 1. Przygotowanie serwera

```bash
# Zaktualizuj system
sudo apt update && sudo apt upgrade -y

# Zainstaluj Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Sprawdź wersje
node --version
npm --version
```

### 2. Sklonuj repozytorium

```bash
cd /opt  # lub inny katalog
git clone <twoje-repo> styroaction
cd styroaction
```

### 3. Skonfiguruj zmienne środowiskowe

```bash
# Skopiuj przykład
cp server/.env.example server/.env

# Edytuj plik
nano server/.env
```

**Ważne zmienne do ustawienia:**
- `MONGODB_URI` - connection string do MongoDB
- `JWT_SECRET` - losowy, długi string (np. `openssl rand -base64 32`)
- `SMTP_*` - dane do wysyłania emaili

### 4. Uruchom deployment

```bash
# Nadaj uprawnienia
chmod +x deploy.sh

# Uruchom skrypt
./deploy.sh
```

Skrypt automatycznie:
- ✅ Sprawdzi wymagane narzędzia
- ✅ Zainstaluje zależności
- ✅ Zbuduje aplikacje
- ✅ Skonfiguruje nginx
- ✅ Uruchomi przez PM2
- ✅ Skonfiguruje SSL (jeśli domeny są gotowe)

## Konfiguracja DNS

Upewnij się, że domeny wskazują na Twój VPS:

```
A     styroaction.pl        → IP_VPS
A     www.styroaction.pl    → IP_VPS
A     api.styroaction.pl     → IP_VPS
```

## SSL Certificates

Jeśli certyfikaty nie zostały wygenerowane automatycznie:

```bash
# Frontend
sudo certbot --nginx -d styroaction.pl -d www.styroaction.pl

# Backend API
sudo certbot --nginx -d api.styroaction.pl
```

## Zarządzanie aplikacją

### PM2 Commands

```bash
# Status
pm2 list

# Logi
pm2 logs styrtoaction-api
pm2 logs styrtoaction-client

# Restart
pm2 restart all
pm2 restart styrtoaction-api
pm2 restart styrtoaction-client

# Stop
pm2 stop all

# Monitorowanie
pm2 monit
```

### Nginx

```bash
# Restart
sudo systemctl restart nginx

# Status
sudo systemctl status nginx

# Logi
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Aktualizacja aplikacji

```bash
cd /opt/styroaction  # lub gdzie masz projekt

# Pobierz najnowsze zmiany
git pull

# Zainstaluj nowe zależności
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Rebuild
cd server && npm run build && cd ..
cd client && NEXT_PUBLIC_API_URL=https://api.styroaction.pl/api npm run build && cd ..

# Restart
pm2 restart all
```

## Tworzenie konta admina

```bash
cd server
npm run create-admin
```

## Troubleshooting

### Aplikacja nie działa

1. Sprawdź logi PM2:
   ```bash
   pm2 logs
   ```

2. Sprawdź status nginx:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. Sprawdź porty:
   ```bash
   sudo netstat -tulpn | grep -E '3000|5005'
   ```

### Certyfikaty SSL

Jeśli certyfikaty wygasły:
```bash
sudo certbot renew
sudo systemctl restart nginx
```

### MongoDB

Jeśli używasz lokalnego MongoDB:
```bash
sudo systemctl status mongod
sudo systemctl start mongod
```

## Backup

Zalecane regularne backupy:
- MongoDB database
- Pliki `.env`
- Konfiguracja nginx

## Monitoring

PM2 ma wbudowany monitoring:
```bash
pm2 monit
```

Możesz też użyć PM2 Plus dla zaawansowanego monitoringu.

## Kontakt

W razie problemów: info@soft-synergy.com


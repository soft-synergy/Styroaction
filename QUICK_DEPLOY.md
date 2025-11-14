# ⚡ Szybki Deployment - 5 minut

## Krok po kroku

### 1. Na VPS - przygotowanie

```bash
# Zaktualizuj system
sudo apt update && sudo apt upgrade -y

# Zainstaluj Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Zainstaluj MongoDB (lub użyj Atlas)
sudo apt install -y mongodb
# LUB skonfiguruj MongoDB Atlas i skopiuj connection string
```

### 2. Sklonuj projekt

```bash
cd /opt
git clone <twoje-repo> styroaction
cd styroaction
```

### 3. Skonfiguruj .env

```bash
cp server/.env.example server/.env
nano server/.env
```

**Uzupełnij:**
- `MONGODB_URI` - connection string
- `JWT_SECRET` - wygeneruj: `openssl rand -base64 32`
- `SMTP_*` - dane do emaili

### 4. Uruchom deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Skonfiguruj DNS

W panelu domeny ustaw:
```
A     styroaction.pl        → IP_VPS
A     www.styroaction.pl    → IP_VPS  
A     api.styroaction.pl    → IP_VPS
```

### 6. Wygeneruj SSL (po propagacji DNS)

```bash
sudo certbot --nginx -d styroaction.pl -d www.styroaction.pl
sudo certbot --nginx -d api.styroaction.pl
```

## Gotowe! 🎉

Aplikacja działa pod:
- https://styroaction.pl
- https://api.styroaction.pl

## Przydatne komendy

```bash
pm2 logs              # logi
pm2 restart all       # restart
pm2 monit             # monitoring
```


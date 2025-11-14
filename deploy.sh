#!/bin/bash

set -e

echo "🚀 Rozpoczynam deployment Styrtoaction.pl na produkcję..."

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sprawdź czy jesteś rootem lub masz sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo -e "${RED}❌ Ten skrypt wymaga uprawnień sudo${NC}"
    exit 1
fi

# Funkcja do sprawdzania czy komenda istnieje
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Sprawdź wymagane narzędzia
echo -e "${YELLOW}📦 Sprawdzam wymagane narzędzia...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js nie jest zainstalowany. Zainstaluj Node.js 18+${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm nie jest zainstalowany${NC}"
    exit 1
fi

if ! command_exists pm2; then
    echo -e "${YELLOW}⚠️  PM2 nie jest zainstalowany. Instaluję...${NC}"
    sudo npm install -g pm2
fi

if ! command_exists nginx; then
    echo -e "${YELLOW}⚠️  Nginx nie jest zainstalowany. Instaluję...${NC}"
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y nginx
    elif command_exists yum; then
        sudo yum install -y nginx
    else
        echo -e "${RED}❌ Nie można zainstalować nginx automatycznie. Zainstaluj ręcznie.${NC}"
        exit 1
    fi
fi

# Pobierz aktualną ścieżkę
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}✓ Wszystkie narzędzia są dostępne${NC}"

# Sprawdź czy pliki .env istnieją
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  Plik server/.env nie istnieje. Tworzę z przykładu...${NC}"
    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env
        echo -e "${YELLOW}⚠️  Uzupełnij server/.env przed kontynuacją!${NC}"
        read -p "Naciśnij Enter po uzupełnieniu .env..."
    else
        echo -e "${RED}❌ Brak pliku server/.env.example${NC}"
        exit 1
    fi
fi

# Instalacja zależności
echo -e "${YELLOW}📦 Instaluję zależności...${NC}"
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build backend
echo -e "${YELLOW}🔨 Buduję backend...${NC}"
cd server
npm run build
cd ..

# Build frontend
echo -e "${YELLOW}🔨 Buduję frontend...${NC}"
cd client
NEXT_PUBLIC_API_URL=https://api.styroaction.pl/api npm run build
cd ..

# Tworzenie katalogów dla PM2
mkdir -p ~/.pm2/logs

# Zatrzymaj istniejące procesy PM2
echo -e "${YELLOW}🛑 Zatrzymuję istniejące procesy...${NC}"
pm2 delete styrtoaction-api 2>/dev/null || true
pm2 delete styrtoaction-client 2>/dev/null || true

# Uruchom backend przez PM2
echo -e "${YELLOW}🚀 Uruchamiam backend...${NC}"
cd server
pm2 start dist/index.js --name styrtoaction-api --env production
cd ..

# Uruchom frontend przez PM2
echo -e "${YELLOW}🚀 Uruchamiam frontend...${NC}"
cd client
pm2 start npm --name styrtoaction-client -- start
cd ..

# Zapisz konfigurację PM2
pm2 save

# Konfiguracja nginx
echo -e "${YELLOW}⚙️  Konfiguruję nginx...${NC}"

# Frontend config (styroaction.pl)
# Sprawdź czy certyfikaty istnieją
SSL_CERT_EXISTS=""
if [ -f "/etc/letsencrypt/live/styroaction.pl/fullchain.pem" ]; then
    SSL_CERT_EXISTS="yes"
fi

if [ "$SSL_CERT_EXISTS" = "yes" ]; then
    # Konfiguracja z SSL
    sudo tee /etc/nginx/sites-available/styroaction.pl > /dev/null <<EOF
server {
    listen 80;
    server_name styroaction.pl www.styroaction.pl;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name styroaction.pl www.styroaction.pl;

    ssl_certificate /etc/letsencrypt/live/styroaction.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/styroaction.pl/privkey.pem;
EOF
else
    # Konfiguracja bez SSL (tylko HTTP)
    sudo tee /etc/nginx/sites-available/styroaction.pl > /dev/null <<EOF
server {
    listen 80;
    server_name styroaction.pl www.styroaction.pl;
EOF
fi

# Kontynuuj konfigurację
sudo tee -a /etc/nginx/sites-available/styroaction.pl > /dev/null <<EOF

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Backend config (api.styroaction.pl)
# Sprawdź czy certyfikaty istnieją
API_SSL_CERT_EXISTS=""
if [ -f "/etc/letsencrypt/live/api.styroaction.pl/fullchain.pem" ]; then
    API_SSL_CERT_EXISTS="yes"
fi

if [ "$API_SSL_CERT_EXISTS" = "yes" ]; then
    # Konfiguracja z SSL
    sudo tee /etc/nginx/sites-available/api.styroaction.pl > /dev/null <<EOF
server {
    listen 80;
    server_name api.styroaction.pl;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.styroaction.pl;

    ssl_certificate /etc/letsencrypt/live/api.styroaction.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.styroaction.pl/privkey.pem;
EOF
else
    # Konfiguracja bez SSL (tylko HTTP)
    sudo tee /etc/nginx/sites-available/api.styroaction.pl > /dev/null <<EOF
server {
    listen 80;
    server_name api.styroaction.pl;
EOF
fi

# Kontynuuj konfigurację
sudo tee -a /etc/nginx/sites-available/api.styroaction.pl > /dev/null <<EOF

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers (jeśli potrzebne)
    add_header Access-Control-Allow-Origin "https://styroaction.pl" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

    location / {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Aktywuj konfiguracje
sudo ln -sf /etc/nginx/sites-available/styroaction.pl /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.styroaction.pl /etc/nginx/sites-enabled/

# Usuń domyślną konfigurację jeśli istnieje
sudo rm -f /etc/nginx/sites-enabled/default

# Sprawdź konfigurację nginx
echo -e "${YELLOW}🔍 Sprawdzam konfigurację nginx...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Konfiguracja nginx jest poprawna${NC}"
else
    echo -e "${RED}❌ Błąd w konfiguracji nginx${NC}"
    exit 1
fi

# SSL Certificates (Let's Encrypt)
if ! command_exists certbot; then
    echo -e "${YELLOW}⚠️  Certbot nie jest zainstalowany. Instaluję...${NC}"
    if command_exists apt-get; then
        sudo apt-get install -y certbot python3-certbot-nginx
    elif command_exists yum; then
        sudo yum install -y certbot python3-certbot-nginx
    fi
fi

# Sprawdź czy certyfikaty istnieją
if [ ! -f "/etc/letsencrypt/live/styroaction.pl/fullchain.pem" ]; then
    echo -e "${YELLOW}🔒 Certyfikaty SSL nie zostały jeszcze wygenerowane${NC}"
    echo -e "${YELLOW}⚠️  Upewnij się, że domeny wskazują na ten serwer przed generowaniem certyfikatów!${NC}"
    echo -e "${YELLOW}📝 Aby wygenerować certyfikaty później, uruchom:${NC}"
    echo "   sudo certbot --nginx -d styroaction.pl -d www.styroaction.pl"
    echo ""
    read -p "Czy chcesz teraz wygenerować certyfikaty? (t/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Tt]$ ]]; then
        sudo certbot --nginx -d styroaction.pl -d www.styroaction.pl --non-interactive --agree-tos --email info@soft-synergy.com || {
            echo -e "${YELLOW}⚠️  Nie udało się wygenerować certyfikatu. Sprawdź DNS i spróbuj później.${NC}"
        }
    fi
else
    echo -e "${GREEN}✓ Certyfikat SSL dla styroaction.pl istnieje${NC}"
fi

if [ ! -f "/etc/letsencrypt/live/api.styroaction.pl/fullchain.pem" ]; then
    echo -e "${YELLOW}🔒 Certyfikat SSL dla api.styroaction.pl nie został jeszcze wygenerowany${NC}"
    echo -e "${YELLOW}📝 Aby wygenerować certyfikat później, uruchom:${NC}"
    echo "   sudo certbot --nginx -d api.styroaction.pl"
    echo ""
    read -p "Czy chcesz teraz wygenerować certyfikat? (t/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Tt]$ ]]; then
        sudo certbot --nginx -d api.styroaction.pl --non-interactive --agree-tos --email info@soft-synergy.com || {
            echo -e "${YELLOW}⚠️  Nie udało się wygenerować certyfikatu. Sprawdź DNS i spróbuj później.${NC}"
        }
    fi
else
    echo -e "${GREEN}✓ Certyfikat SSL dla api.styroaction.pl istnieje${NC}"
fi

# Restart nginx
echo -e "${YELLOW}🔄 Restartuję nginx...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

# Ustaw PM2 do autostartu
echo -e "${YELLOW}⚙️  Konfiguruję autostart PM2...${NC}"
pm2 startup systemd -u $USER --hp /home/$USER || pm2 startup

echo -e "${GREEN}"
echo "════════════════════════════════════════════════════════════"
echo "✅ Deployment zakończony pomyślnie!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Status aplikacji:"
pm2 list
echo ""
echo "🌐 Aplikacja dostępna pod:"
echo "   Frontend: https://styroaction.pl"
echo "   Backend:  https://api.styroaction.pl"
echo ""
echo "📝 Przydatne komendy:"
echo "   pm2 logs styrtoaction-api      - logi backendu"
echo "   pm2 logs styrtoaction-client  - logi frontendu"
echo "   pm2 restart all               - restart wszystkich"
echo "   pm2 monit                     - monitorowanie"
echo ""
echo "🔒 Jeśli certyfikaty SSL nie zostały wygenerowane:"
echo "   sudo certbot --nginx -d styroaction.pl -d www.styroaction.pl"
echo "   sudo certbot --nginx -d api.styroaction.pl"
echo ""
echo -e "${NC}"


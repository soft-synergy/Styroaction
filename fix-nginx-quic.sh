#!/bin/bash

# Skrypt do naprawy błędu QUIC_PROTOCOL_ERROR

echo "🔧 Naprawiam konfigurację nginx dla styroaction.pl..."

# Backup istniejących konfiguracji
sudo cp /etc/nginx/sites-available/styroaction.pl /etc/nginx/sites-available/styroaction.pl.backup
sudo cp /etc/nginx/sites-available/api.styroaction.pl /etc/nginx/sites-available/api.styroaction.pl.backup

# Sprawdź czy certyfikaty istnieją
if [ -f "/etc/letsencrypt/live/styroaction.pl/fullchain.pem" ]; then
    # Frontend z SSL - wyłącz QUIC, użyj tylko HTTP/2
    sudo tee /etc/nginx/sites-available/styroaction.pl > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name styroaction.pl www.styroaction.pl;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name styroaction.pl www.styroaction.pl;

    ssl_certificate /etc/letsencrypt/live/styroaction.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/styroaction.pl/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Wyłącz HTTP/3 (QUIC) - wymuś tylko HTTP/2
    add_header Alt-Svc 'h2=":443"; ma=86400' always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Wyłącz QUIC explicitnie
    add_header Alt-Svc 'clear' always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
else
    echo "⚠️  Certyfikaty SSL nie istnieją - używam konfiguracji HTTP"
    sudo tee /etc/nginx/sites-available/styroaction.pl > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name styroaction.pl www.styroaction.pl;

    location / {
        proxy_pass http://localhost:3000;
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
EOF
fi

# Backend API
if [ -f "/etc/letsencrypt/live/api.styroaction.pl/fullchain.pem" ]; then
    sudo tee /etc/nginx/sites-available/api.styroaction.pl > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.styroaction.pl;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.styroaction.pl;

    ssl_certificate /etc/letsencrypt/live/api.styroaction.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.styroaction.pl/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Wyłącz HTTP/3 (QUIC)
    add_header Alt-Svc 'h2=":443"; ma=86400' always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://styroaction.pl" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

    location / {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
else
    echo "⚠️  Certyfikaty SSL dla API nie istnieją - używam konfiguracji HTTP"
    sudo tee /etc/nginx/sites-available/api.styroaction.pl > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.styroaction.pl;

    location / {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

# Sprawdź konfigurację
echo "🔍 Sprawdzam konfigurację nginx..."
if sudo nginx -t; then
    echo "✅ Konfiguracja jest poprawna"
    echo "🔄 Restartuję nginx..."
    sudo systemctl restart nginx
    echo "✅ Nginx zrestartowany"
    echo ""
    echo "📝 Zmiany:"
    echo "   - Wyłączono QUIC/HTTP3"
    echo "   - Wymuszono tylko HTTP/2"
    echo "   - Dodano nagłówki Alt-Svc"
    echo "   - Dodano IPv6 support"
    echo ""
    echo "🌐 Sprawdź teraz: https://styroaction.pl"
else
    echo "❌ Błąd w konfiguracji nginx!"
    echo "Przywracam backup..."
    sudo cp /etc/nginx/sites-available/styroaction.pl.backup /etc/nginx/sites-available/styroaction.pl
    sudo cp /etc/nginx/sites-available/api.styroaction.pl.backup /etc/nginx/sites-available/api.styroaction.pl
    exit 1
fi


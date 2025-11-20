#!/bin/bash

echo "🔧 Naprawiam CORS w nginx dla api.styroaction.pl..."

# Backup
sudo cp /etc/nginx/sites-available/api.styroaction.pl /etc/nginx/sites-available/api.styroaction.pl.backup.$(date +%Y%m%d_%H%M%S)

# Sprawdź czy certyfikaty istnieją
if [ -f "/etc/letsencrypt/live/api.styroaction.pl/fullchain.pem" ]; then
    SSL_CONFIG="yes"
else
    SSL_CONFIG="no"
fi

if [ "$SSL_CONFIG" = "yes" ]; then
    sudo tee /etc/nginx/sites-available/api.styroaction.pl > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.styroaction.pl;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.styroaction.pl;

    ssl_certificate /etc/letsencrypt/live/api.styroaction.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.styroaction.pl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    add_header Alt-Svc 'h2=":443"; ma=86400' always;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS headers - allow all
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin" always;
    add_header Access-Control-Allow-Credentials "false" always;

    # Obsługa preflight OPTIONS requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin" always;
            add_header Access-Control-Max-Age "3600" always;
            add_header Content-Type "text/plain charset=UTF-8" always;
            add_header Content-Length "0" always;
            return 204;
        }

        proxy_pass https://api.styroaction.pl;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
else
    sudo tee /etc/nginx/sites-available/api.styroaction.pl > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.styroaction.pl;

    # CORS headers - allow all
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin" always;
    add_header Access-Control-Allow-Credentials "false" always;

    # Obsługa preflight OPTIONS requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin" always;
            add_header Access-Control-Max-Age "3600" always;
            add_header Content-Type "text/plain charset=UTF-8" always;
            add_header Content-Length "0" always;
            return 204;
        }

        proxy_pass https://api.styroaction.pl;
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
if sudo nginx -t; then
    echo "✅ Konfiguracja poprawna"
    echo "🔄 Restartuję nginx..."
    sudo systemctl restart nginx
    echo "✅ Gotowe! CORS powinien teraz działać."
    echo ""
    echo "🧪 Test:"
    echo "curl -X OPTIONS https://api.styroaction.pl/api/styrofoam-types -H 'Origin: https://styroaction.pl' -v"
else
    echo "❌ Błąd w konfiguracji!"
    exit 1
fi


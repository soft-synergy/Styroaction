# 🔧 Naprawa błędu QUIC_PROTOCOL_ERROR - Cloudflare

## Problem

Błąd `ERR_QUIC_PROTOCOL_ERROR` występuje nawet po wyłączeniu nginx, co oznacza że problem jest w **Cloudflare** (lub innym CDN), a nie w nginx.

## Rozwiązanie

### Opcja 1: Wyłącz HTTP/3 (QUIC) w Cloudflare (ZALECANE)

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Wybierz domenę `styroaction.pl`
3. Przejdź do **Network** w menu bocznym
4. Znajdź **HTTP/3 (with QUIC)**
5. **Wyłącz** przełącznik
6. Zapisz zmiany

### Opcja 2: Zmień DNS na "DNS only" (szara chmurka)

Jeśli nie potrzebujesz Cloudflare proxy:

1. Zaloguj się do Cloudflare Dashboard
2. Przejdź do **DNS** → **Records**
3. Dla każdego rekordu A (styroaction.pl, www.styroaction.pl, api.styroaction.pl):
   - Kliknij na pomarańczową chmurkę (Proxied)
   - Zmień na szarą chmurkę (DNS only)
4. Zapisz zmiany

**Uwaga:** Po zmianie na DNS only:
- Nie będziesz mieć DDoS protection od Cloudflare
- Nie będziesz mieć CDN cache
- IP serwera będzie widoczne publicznie
- Ale QUIC nie będzie próbował się łączyć

### Opcja 3: Wyłącz QUIC tylko dla tej domeny (Page Rules)

1. W Cloudflare Dashboard → **Rules** → **Page Rules**
2. Utwórz nową regułę:
   - URL: `*styroaction.pl/*`
   - Settings: **Disable Apps** (lub użyj Transform Rules do wyłączenia HTTP/3)

### Opcja 4: Użyj Cloudflare Workers (zaawansowane)

Możesz użyć Cloudflare Workers żeby wymusić HTTP/2 zamiast QUIC.

## Sprawdzenie

Po zmianach:

```bash
# Sprawdź czy QUIC jest wyłączony
curl -I https://styroaction.pl | grep -i alt-svc

# Powinno pokazać tylko h2 (HTTP/2), nie h3 (QUIC)
```

## Szybka naprawa (jeśli masz dostęp do Cloudflare API)

```bash
# Wyłącz HTTP/3 przez API
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/settings/http3" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"value":"off"}'
```

## Dlaczego to się dzieje?

Cloudflare domyślnie włącza HTTP/3 (QUIC) dla domen w trybie "Proxied". Jeśli Twój serwer nie obsługuje QUIC (co jest normalne - większość serwerów używa tylko HTTP/2), przeglądarka próbuje połączyć się przez QUIC, ale serwer nie odpowiada, stąd błąd.

## Rekomendacja

**Najlepsze rozwiązanie:** Wyłącz HTTP/3 w Cloudflare (Opcja 1). To najszybsze i najbezpieczniejsze - nadal masz ochronę Cloudflare, ale bez problemów z QUIC.


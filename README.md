# Styrtoaction.pl

Platforma porównująca ceny styropianu od 50+ producentów w Polsce.

## Funkcjonalności

- **Landing page** z formularzem zapytania o cenę
- **Panel administracyjny** do zarządzania:
  - Producentami
  - Rodzajami styropianu
  - Cenami
  - Zapytaniami użytkowników
- **Automatyczne wysyłanie emaili** z porównaniem cen

## Technologie

- **Frontend**: Next.js 14 (React z SSR)
- **Backend**: Node.js + Express
- **Baza danych**: MongoDB
- **Email**: Nodemailer

## Instalacja

1. Zainstaluj zależności:
```bash
npm run install:all
```

2. Skonfiguruj zmienne środowiskowe:

Backend (`server/.env`):
```
PORT=5005
MONGODB_URI=mongodb+srv://softsynerg_db_user:akcDa1BKaxY2NZpd@cluster0.gihj3kc.mongodb.net/styrtoaction?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-secret-key-change-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SENDER_NAME=Styroaction - giełda styropianu
SMTP_FROM=your-email@gmail.com
```

Frontend (`client/.env.local`):
```
NEXT_PUBLIC_API_URL=https://api.styroaction.pl/api
```

3. Uruchom MongoDB (lub użyj MongoDB Atlas)

4. Uruchom serwer deweloperski:
```bash
npm run dev
```

Lub osobno:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Użycie

### Strona główna
- Odwiedź `http://localhost:3000`
- Wypełnij formularz z rodzajem styropianu, kodem pocztowym i danymi kontaktowymi
- Otrzymasz email z porównaniem cen

### Panel administracyjny
- Odwiedź `http://localhost:3000/admin`
- Zaloguj się (pierwszy użytkownik można utworzyć przez endpoint `/api/admin/register`)
- Zarządzaj producentami, rodzajami styropianu i cenami
- Przetwarzaj zapytania użytkowników i wysyłaj emaile

## Tworzenie pierwszego administratora

Możesz utworzyć pierwszego administratora na dwa sposoby:

### Metoda 1: Skrypt (zalecane)
```bash
cd server
npm run create-admin [username] [email] [password]
```

Przykład:
```bash
npm run create-admin admin admin@styrtoaction.pl admin123
```

### Metoda 2: Przez API
```bash
curl -X POST http://localhost:5000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

## Struktura projektu

```
styrtoaction/
├── server/          # Backend (Node.js + Express)
│   ├── src/
│   │   ├── models/      # Modele MongoDB
│   │   ├── routes/      # Endpointy API
│   │   ├── services/    # Serwisy (email)
│   │   └── index.ts     # Główny plik serwera
│   ├── scripts/         # Skrypty pomocnicze
│   └── package.json
├── client/          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/         # Strony Next.js
│   │   └── components/  # Komponenty React
│   └── package.json
└── package.json     # Root package.json
```

## API Endpoints

### Requests
- `POST /api/requests` - Utwórz zapytanie
- `GET /api/requests` - Pobierz wszystkie zapytania
- `GET /api/requests/:id` - Pobierz pojedyncze zapytanie
- `POST /api/requests/:id/send-email` - Wyślij email z porównaniem cen

### Producers
- `GET /api/producers` - Pobierz wszystkich producentów
- `POST /api/producers` - Utwórz producenta
- `PUT /api/producers/:id` - Zaktualizuj producenta
- `DELETE /api/producers/:id` - Usuń producenta

### Styrofoam Types
- `GET /api/styrofoam-types` - Pobierz wszystkie rodzaje
- `POST /api/styrofoam-types` - Utwórz rodzaj
- `PUT /api/styrofoam-types/:id` - Zaktualizuj rodzaj
- `DELETE /api/styrofoam-types/:id` - Usuń rodzaj

### Prices
- `GET /api/prices` - Pobierz wszystkie ceny
- `GET /api/prices/by-type/:styrofoamTypeId` - Pobierz ceny dla typu
- `POST /api/prices` - Utwórz cenę
- `PUT /api/prices/:id` - Zaktualizuj cenę
- `DELETE /api/prices/:id` - Usuń cenę

### Admin
- `POST /api/admin/login` - Zaloguj się
- `POST /api/admin/register` - Zarejestruj administratora

## Rozwój

### Dodawanie nowych funkcji
1. Backend: Dodaj modele w `server/src/models/`
2. Backend: Dodaj endpointy w `server/src/routes/`
3. Frontend: Dodaj komponenty w `client/src/components/`
4. Frontend: Dodaj strony w `client/src/app/`

## Produkcja

1. Zbuduj frontend:
```bash
cd client
npm run build
```

2. Zbuduj backend:
```bash
cd server
npm run build
```

3. Uruchom serwer:
```bash
cd server
npm start
```

## Licencja

ISC


# Jak utworzyć admina w Styrtoaction

## Metoda 1: Użyj skryptu Node.js (Zalecana)

1. **Upewnij się, że plik `.env` istnieje w katalogu `server/`** z następującą zawartością:

```bash
MONGODB_URI=mongodb+srv://softsynerg_db_user:akcDa1BKaxY2NZpd@cluster0.gihj3kc.mongodb.net/styrtoaction?retryWrites=true&w=majority&appName=Cluster0
PORT=5005
JWT_SECRET=styrtoaction-secret-key-change-in-production
```

2. **Uruchom skrypt**:

```bash
cd server
npm run create-admin -- admin info@soft-synergy.com "1!Qaa2@Wss"
```

## Metoda 2: Przez API endpoint (jeśli serwer działa)

1. **Uruchom serwer**:

```bash
cd server
npm run dev
```

2. **Wykonaj request** (w osobnym terminalu):

```bash
curl -X POST http://localhost:5005/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "info@soft-synergy.com",
    "password": "1!Qaa2@Wss"
  }'
```

## Metoda 3: Ręcznie przez MongoDB Compass lub CLI

1. **Połącz się z MongoDB Atlas** używając connection stringa
2. **Przejdź do bazy danych `styrtoaction`**
3. **Utwórz kolekcję `admins`** (jeśli nie istnieje)
4. **Dodaj dokument**:

```json
{
  "username": "admin",
  "email": "info@soft-synergy.com",
  "password": "$2a$10$..." // zahashowane hasło bcrypt
}
```

⚠️ **Uwaga**: Hasło musi być zahashowane używając bcrypt. Lepiej użyj Metody 1 lub 2.

## Rozwiązywanie problemów

### Problem: "Operation buffering timed out after 10000ms"

**Rozwiązanie**:
1. Sprawdź czy plik `.env` istnieje i ma prawidłowy connection string
2. Sprawdź czy Twoje IP jest whitelisted w MongoDB Atlas:
   - Zaloguj się do MongoDB Atlas
   - Przejdź do "Network Access"
   - Dodaj swoje IP lub użyj `0.0.0.0/0` dla testów (niezalecane w produkcji)
3. Sprawdź czy użytkownik `softsynerg_db_user` ma odpowiednie uprawnienia
4. Sprawdź połączenie sieciowe

### Problem: "Admin already exists"

**Rozwiązanie**: Admin z tym username lub emailem już istnieje. Możesz:
- Użyć innego username/email
- Usunąć istniejącego admina z bazy danych
- Zalogować się używając istniejących danych

## Dane logowania po utworzeniu

- **Username**: `admin`
- **Email**: `info@soft-synergy.com`
- **Password**: `1!Qaa2@Wss`

## Testowanie logowania

Po utworzeniu admina możesz przetestować logowanie:

```bash
curl -X POST http://localhost:5005/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "1!Qaa2@Wss"
  }'
```

Powinieneś otrzymać token JWT w odpowiedzi.


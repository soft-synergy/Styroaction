#!/bin/bash

set -e

echo "🚀 Przygotowuję push do GitHub..."

# Sprawdź czy git jest zainstalowany
if ! command -v git &> /dev/null; then
    echo "❌ Git nie jest zainstalowany"
    exit 1
fi

# Sprawdź czy jesteśmy w repozytorium
if [ ! -d ".git" ]; then
    echo "📦 Inicjalizuję repozytorium git..."
    git init
fi

# Dodaj remote jeśli nie istnieje
if ! git remote | grep -q origin; then
    echo "🔗 Dodaję remote origin..."
    git remote add origin https://github.com/soft-synergy/Styroaction.git
else
    echo "✅ Remote origin już istnieje"
    git remote set-url origin https://github.com/soft-synergy/Styroaction.git
fi

# Sprawdź status
echo ""
echo "📊 Status repozytorium:"
git status --short | head -20

# Dodaj wszystkie pliki
echo ""
echo "➕ Dodaję wszystkie pliki..."
git add .

# Sprawdź czy są zmiany do commitowania
if git diff --staged --quiet; then
    echo "ℹ️  Brak zmian do commitowania"
else
    echo "💾 Tworzę commit..."
    git commit -m "Deploy: Dodano skrypt deploymentowy, poprawki formularza, mechanizmy retencji i cookie consent

- Dodano skrypt deploy.sh do automatycznego deploymentu
- Poprawiono formularz zapytania ofertowego (tryb guided/manual)
- Dodano mechanizmy retencji użytkownika (exit intent, scroll popup)
- Dodano cookie consent banner
- Zaktualizowano kontakt (telefon, email)
- Dodano pole useCases do typów styropianu
- Optymalizacje Next.js dla produkcji
- Konfiguracja nginx dla styroaction.pl i api.styroaction.pl"
    
    # Ustaw branch na main
    git branch -M main 2>/dev/null || true
    
    echo ""
    echo "📤 Wysyłam do GitHub..."
    echo "⚠️  Może być wymagana autentykacja (hasło/token)"
    git push -u origin main || {
        echo ""
        echo "❌ Push nie powiódł się. Możliwe przyczyny:"
        echo "   1. Brak uprawnień do repozytorium"
        echo "   2. Wymagana autentykacja (token GitHub)"
        echo ""
        echo "💡 Rozwiązanie:"
        echo "   - Użyj personal access token zamiast hasła"
        echo "   - Lub uruchom: git push -u origin main"
        exit 1
    }
    
    echo ""
    echo "✅ Sukces! Kod został wypchnięty do GitHub"
    echo "🔗 https://github.com/soft-synergy/Styroaction"
fi


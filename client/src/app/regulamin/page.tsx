import Link from 'next/link';

const sections = [
  {
    title: '1. Postanowienia ogólne',
    content:
      'Serwis Styrtoaction.pl jest własnością i jest prowadzony przez Soft Synergy sp. z o.o. Niniejszy regulamin określa zasady korzystania z serwisu, składania zapytań o wyceny styropianu oraz zasady odpowiedzialności.',
  },
  {
    title: '2. Zakres usług',
    content:
      'Serwis umożliwia przesłanie zapytania o ceny materiałów izolacyjnych. Po otrzymaniu zgłoszenia kontaktujemy się z producentami i przekazujemy użytkownikowi zestawienie ofert. Usługa jest darmowa dla użytkowników końcowych.',
  },
  {
    title: '3. Zasady korzystania',
    content:
      'Użytkownik zobowiązuje się do podawania prawdziwych danych kontaktowych oraz informacji dotyczących zapotrzebowania. Wysłanie formularza nie stanowi wiążącej oferty handlowej i nie zobowiązuje do zakupu.',
  },
  {
    title: '4. Odpowiedzialność',
    content:
      'Dołożymy wszelkich starań, aby przedstawiane informacje były aktualne i rzetelne. Nie odpowiadamy jednak za ostateczne decyzje zakupowe użytkownika ani za działania podmiotów trzecich (np. producentów, dostawców transportu).',
  },
  {
    title: '5. Reklamacje',
    content:
      'Uwagi dotyczące działania serwisu można przesyłać na adres info@styroaction.pl. Każde zgłoszenie rozpatrujemy w ciągu 14 dni roboczych.',
  },
  {
    title: '6. Postanowienia końcowe',
    content:
      'Korzystanie z serwisu oznacza akceptację niniejszego regulaminu. Zastrzegamy sobie prawo do jego zmiany. Aktualna wersja jest dostępna na stronie internetowej. W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="container max-w-4xl px-4">
        <header className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Regulamin</p>
          <h1 className="mt-3 text-4xl font-extrabold text-gray-900">Zasady korzystania z Styrtoaction.pl</h1>
          <p className="mt-4 text-lg text-gray-600">
            Dokument obowiązuje od 20 listopada 2025 r. i określa zasady świadczenia usług informacyjnych.
          </p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-gray-700">{section.content}</p>
            </section>
          ))}
        </div>

        <footer className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center text-sm text-blue-900">
          Masz pytania? Napisz na{' '}
          <a href="mailto:info@styroaction.pl" className="font-semibold underline decoration-dotted">
            info@styroaction.pl
          </a>{' '}
          lub wróć na{' '}
          <Link href="/" className="font-semibold underline decoration-dotted">
            stronę główną
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}



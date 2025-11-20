import Link from 'next/link';

const sections = [
  {
    title: '1. Administrator danych',
    content:
      'Administratorem danych osobowych jest Soft Synergy sp. z o.o., operator serwisu Styrtoaction.pl. W sprawach dotyczących danych można pisać na adres info@styroaction.pl.',
  },
  {
    title: '2. Jakie dane zbieramy',
    content:
      'W formularzu zapytania prosimy o imię, adres e-mail, telefon, kod pocztowy oraz szczegóły zapotrzebowania. Dane wykorzystujemy tylko do przygotowania zestawienia cen i kontaktu z użytkownikiem.',
  },
  {
    title: '3. Podstawa prawna przetwarzania',
    content:
      'Dane są przetwarzane w celu realizacji usługi (art. 6 ust. 1 lit. b RODO) oraz w prawnie uzasadnionym interesie administratora, jakim jest obsługa zapytań i analiza skuteczności kampanii (art. 6 ust. 1 lit. f RODO).',
  },
  {
    title: '4. Udostępnianie danych',
    content:
      'Dane mogą być przekazywane producentom i dystrybutorom materiałów izolacyjnych wyłącznie w zakresie niezbędnym do przygotowania oferty. Nie sprzedajemy danych podmiotom trzecim.',
  },
  {
    title: '5. Prawa użytkownika',
    content:
      'Masz prawo do dostępu, sprostowania, usunięcia lub ograniczenia przetwarzania danych, a także prawo sprzeciwu i przenoszenia danych. Żądanie można zgłosić mailowo.',
  },
  {
    title: '6. Cookies i analityka',
    content:
      'Serwis wykorzystuje podstawowe cookies techniczne oraz anonimowe dane analityczne (np. podział A/B). Możesz zarządzać zgodą w ustawieniach przeglądarki.',
  },
  {
    title: '7. Okres przechowywania',
    content:
      'Dane związane z zapytaniem przechowujemy maksymalnie 24 miesiące, aby móc udokumentować historię korespondencji i usprawniać proces doboru dostawców.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="container max-w-4xl px-4">
        <header className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Polityka prywatności</p>
          <h1 className="mt-3 text-4xl font-extrabold text-gray-900">Jak dbamy o Twoje dane</h1>
          <p className="mt-4 text-lg text-gray-600">
            Dokument informuje, w jaki sposób gromadzimy i przetwarzamy dane osobowe użytkowników serwisu.
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
          W razie pytań napisz na{' '}
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



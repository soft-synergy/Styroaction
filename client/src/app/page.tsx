'use client';

import { useState, useEffect, useMemo, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import RequestForm from '@/components/RequestForm';
import { trackGAEvent, trackPageView } from '@/lib/analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

interface StyrofoamType {
  _id: string;
  name: string;
  description?: string;
  thickness?: string;
  density?: string;
}

type LandingVariant = 'A' | 'B' | 'C';

type HowStep = {
  title: string;
  description: string;
};

type WhyItem = {
  title: string;
  description: string;
};

type ValuePoint = {
  title: string;
  description: string;
};

type ProcessDetail = {
  title: string;
  description: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type Testimonial = {
  quote: string;
  author: string;
};

type LandingContent = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButton: string;
  heroBullets: string[];
  howTitle: string;
  howSubtitle: string;
  howSteps: HowStep[];
  whyTitle: string;
  whyItems: WhyItem[];
  valueTitle: string;
  valueSubtitle: string;
  valuePoints: ValuePoint[];
  processTitle: string;
  processSubtitle: string;
  processDetails: ProcessDetail[];
  guaranteeTitle: string;
  guaranteeSubtitle: string;
  guaranteeBullets: string[];
  guaranteeNote: string;
  testimonialsTitle: string;
  testimonials: Testimonial[];
  testimonialsExtra: Testimonial[];
  faqTitle: string;
  faqItems: FAQItem[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
};

const variantContent: Record<LandingVariant, LandingContent> = {
  A: {
    heroBadge: 'Porównaj ceny w 2 minuty',
    heroTitle: 'Nie przepłacaj za styropian',
    heroSubtitle: 'Sprawdzimy ceny w fabrykach i pokażemy Ci najlepszą ofertę. Wszystko bez dzwonienia i za darmo.',
    heroButton: 'SPRAWDŹ CENY TERAZ',
    heroBullets: ['Bezpłatnie', 'Bez dzwonienia i biegania po składach', 'Email w kilka godzin'],
    howTitle: 'Jak to działa?',
    howSubtitle: 'Trzy proste kroki dla każdego',
    howSteps: [
      {
        title: 'Powiedz, czego potrzebujesz',
        description: 'Wpisz rodzaj styropianu, kod pocztowy i swoje dane',
      },
      {
        title: 'My zbieramy ceny',
        description: 'Sprawdzamy producentów i dystrybutorów w Twojej okolicy',
      },
      {
        title: 'Ty wybierasz najlepszą ofertę',
        description: 'Wszystkie ceny wysyłamy na Twój email – bez zobowiązań',
      },
    ],
    whyTitle: 'Dlaczego przez nas kupisz taniej?',
    whyItems: [
      {
        title: 'Negocjujemy w hurtowych cenach',
        description: 'Łączymy zamówienia wielu klientów, więc mamy lepsze stawki',
      },
      {
        title: 'Widzimy rynek na żywo',
        description: '50+ producentów w jednym miejscu – wiemy, kto schodzi z ceny',
      },
      {
        title: 'Bez pośredników',
        description: 'Współpracujemy prosto z fabrykami, nie ze sklepami',
      },
      {
        title: 'Szybka odpowiedź',
        description: 'W większości przypadków dostaniesz zestawienie w kilka godzin',
      },
    ],
    valueTitle: 'Co dostaniesz w mailu?',
    valueSubtitle: 'Przygotowujemy komplet informacji, żeby decyzja była banalnie prosta.',
    valuePoints: [
      {
        title: 'Lista producentów z cenami',
        description: 'Każdy producent w osobnym wierszu: cena netto/brutto, termin dostawy, numer telefonu.',
      },
      {
        title: 'Najtańsza oferta zaznaczona na zielono',
        description: 'Widzisz od razu, gdzie cena jest najniższa. Bez kalkulatora.',
      },
      {
        title: 'Szczegóły transportu',
        description: 'Informacja kto dowiezie, kiedy i za ile. Jeśli transport jest gratis – też zaznaczamy.',
      },
      {
        title: 'Numer kontaktowy do opiekuna',
        description: 'Jeśli chcesz dogadać rabat na kolejne zamówienie – masz kontakt do człowieka.',
      },
    ],
    processTitle: 'Pełny proces krok po kroku',
    processSubtitle: 'Żebyś dokładnie wiedział, kiedy dostaniesz ceny i jak to wygląda po drodze.',
    processDetails: [
      {
        title: '1. Zgłaszasz zapotrzebowanie (2 minuty)',
        description: 'Wpisujesz rodzaj styropianu, ilość i kod pocztowy. To wszystko.',
      },
      {
        title: '2. Analizujemy rynek (0-3 godziny)',
        description: 'Automatycznie odpytywani są producenci i dystrybutorzy. Operator sprawdza spójność cen.',
      },
      {
        title: '3. Otrzymujesz mail z zestawieniem',
        description: 'W mailu masz tabelę z cenami i wskazanie najkorzystniejszej oferty.',
      },
      {
        title: '4. Decydujesz i zamawiasz',
        description: 'Możesz zadzwonić do producenta lub zlecić nam załatwienie formalności.',
      },
      {
        title: '5. Dostawa i ew. negocjacje',
        description: 'Jeżeli potrzeba dodatkowych negocjacji albo transportu – pomagamy do końca.',
      },
    ],
    guaranteeTitle: 'Gwarancja oszczędności 500 zł',
    guaranteeSubtitle: 'Jeśli znajdziesz lepszą cenę, zwrócimy różnicę (do 500 zł)',
    guaranteeBullets: [
      'Minimalna wartość zakupu 4000 zł',
      'Te same parametry styropianu i dostawy',
      'Prosty formularz do weryfikacji oferty',
    ],
    guaranteeNote: 'Zero ryzyka. Albo oszczędzasz, albo oddajemy różnicę.',
    testimonialsTitle: 'Co mówią użytkownicy?',
    testimonials: [
      {
        quote: 'Dostałem ceny w 2 godziny. Zaoszczędziłem około 700 zł na ociepleniu domu.',
        author: 'Michał – inwestor prywatny, Warszawa',
      },
      {
        quote: 'Nie musiałam dzwonić do 10 składów. Wszystko przyszło mailem. Polecam!',
        author: 'Aneta – inwestorka, Kraków',
      },
      {
        quote: 'Rolnicy też budują. Dzięki tej platformie dostałem dobrą cenę na styropian do obory.',
        author: 'Jan – rolnik, Wielkopolska',
      },
    ],
    testimonialsExtra: [
      {
        quote: 'Zamówienie zamknięte w jeden dzień, oszczędność prawie 900 zł na całej inwestycji.',
        author: 'Karolina – właścicielka domu, Mazury',
      },
      {
        quote: 'Zestawienie cen pomogło mi przekonać inwestora. Konkretne liczby w PDF-ie.',
        author: 'Marcin – wykonawca, Podkarpacie',
      },
      {
        quote: 'Pomogli z transportem i terminami, wszystko przyjechało na czas.',
        author: 'Tomasz – ekipowy, Łódzkie',
      },
    ],
    faqTitle: 'Pytania, które słyszymy najczęściej',
    faqItems: [
      {
        question: 'Czy to jest naprawdę darmowe?',
        answer: 'Tak. Utrzymujemy się z prowizji uzyskanej od producentów. Ty nie płacisz ani złotówki.',
      },
      {
        question: 'Co jeśli nie wiem jaki styropian wybrać?',
        answer: 'Wybierz opcję najbliższą temu, co planujesz. W mailu możemy zaproponować alternatywy.',
      },
      {
        question: 'Czy ktoś będzie do mnie dzwonił?',
        answer: 'Tylko jeśli zaznaczysz taką opcję lub będzie potrzebna doprecyzowana ilość. Wszystko dzieje się mailowo.',
      },
      {
        question: 'Jak długo ważne są ceny?',
        answer: 'Zwykle 24-48 godzin. W mailu podajemy dokładne terminy ważności ofert.',
      },
    ],
    ctaTitle: 'Gotowy sprawdzić ceny?',
    ctaSubtitle: 'Wypełnij krótki formularz, resztę zrobimy za Ciebie.',
    ctaButton: 'SPRAWDŹ CENY TERAZ',
  },
  B: {
    heroBadge: 'Porównaj ceny w kilka godzin',
    heroTitle: 'Szybko sprawdzimy ceny styropianu i wskażemy najtańszą opcję',
    heroSubtitle: 'Jedno zgłoszenie = oferty od wielu producentów. Bez dzwonienia, bez jeżdżenia po składach.',
    heroButton: 'SPRAWDŹ CENY TERAZ',
    heroBullets: ['Darmowe zestawienie', 'Wszystko na mailu', '2–6 godzin odpowiedzi'],
    howTitle: 'Jak to działa?',
    howSubtitle: 'Prosto i przejrzyście – bez zbędnych kroków',
    howSteps: [
      {
        title: 'Wypełniasz krótki formularz',
        description: 'Rodzaj styropianu, kod pocztowy i Twoje dane – 2 minuty',
      },
      {
        title: 'Zbieramy i porównujemy ceny',
        description: 'Sprawdzamy producentów/dystrybutorów i układamy je w tabelę',
      },
      {
        title: 'Otrzymujesz najtańsze oferty',
        description: 'Wszystko przychodzi na mail – wybierasz i zamawiasz',
      },
    ],
    whyTitle: 'Dlaczego przez nas zapłacisz mniej?',
    whyItems: [
      {
        title: 'Łączymy popyt',
        description: 'Większy wolumen = niższa cena jednostkowa u producenta',
      },
      {
        title: 'Aktualne ceny w jednym miejscu',
        description: 'Widzimy rynek na żywo, wiemy gdzie jest przestrzeń na rabat',
      },
      {
        title: 'Krótszy łańcuch',
        description: 'Współpraca bezpośrednio z fabrykami i sprawdzonymi dostawcami',
      },
      {
        title: 'Szybkie terminy',
        description: 'Dostarczamy informacje wtedy, gdy ich potrzebujesz – dziś',
      },
    ],
    valueTitle: 'Co dostaniesz w zestawieniu?',
    valueSubtitle: 'Czytelna tabela + jasna rekomendacja najkorzystniejszej oferty.',
    valuePoints: [
      { title: 'Ceny i dostępność', description: 'Cena brutto/netto, termin dostawy i informacja o transporcie' },
      { title: 'Kontakt do dostawcy', description: 'Numer telefonu/mail do złożenia zamówienia od razu' },
      { title: 'Wyróżnienie najtańszej opcji', description: 'Zaznaczamy najbardziej opłacalną propozycję' },
      { title: 'Plik do pobrania', description: 'PDF/CSV z cenami do Twojej dokumentacji' },
    ],
    processTitle: 'Krok po kroku – pełny proces',
    processSubtitle: 'Od zgłoszenia do gotowego zestawienia w skróconym czasie.',
    processDetails: [
      { title: '1. Zgłoszenie (2 minuty)', description: 'Wysyłasz formularz' },
      { title: '2. Analiza (0–3 godziny)', description: 'Zbieramy i porównujemy oferty' },
      { title: '3. Zestawienie', description: 'Dostajesz tabelę cen na mail' },
      { title: '4. Decyzja', description: 'Wybierasz dostawcę i zamawiasz' },
      { title: '5. Dostawa', description: 'Informacja o terminie i kosztach transportu' },
    ],
    guaranteeTitle: 'Gwarancja oszczędności 500 zł',
    guaranteeSubtitle: 'Znajdziesz taniej? Oddamy różnicę (do 500 zł).',
    guaranteeBullets: [
      'Wartość zamówienia min. 4000 zł brutto',
      'Te same parametry i warunki dostawy',
      'Szybka weryfikacja konkurencyjnej oferty',
    ],
    guaranteeNote: 'Albo oszczędzasz, albo zwracamy różnicę – proste.',
    testimonialsTitle: 'Sprawdzone przez użytkowników',
    testimonials: [
      { quote: 'W 3 godziny miałem zestawienie. Oszczędność ~700 zł.', author: 'Michał – inwestor prywatny' },
      { quote: 'Wszystko na mailu, zero telefonów. Bardzo wygodne.', author: 'Aneta – właścicielka domu' },
      { quote: 'Lepsza cena niż bezpośrednio u producenta.', author: 'Piotr – wykonawca' },
    ],
    testimonialsExtra: [
      { quote: 'Dodatkowy rabat przy większym wolumenie – konkret.', author: 'Karolina – wykonawca' },
      { quote: 'PDF z cenami ułatwił mi podjęcie decyzji.', author: 'Marcin – inwestor' },
      { quote: 'Zaoszczędziłem czas i kilka stów na materiale.', author: 'Tomasz – właściciel domu' },
    ],
    faqTitle: 'Najczęstsze pytania',
    faqItems: [
      { question: 'Czy to jest darmowe?', answer: 'Tak. Rozliczamy się po stronie dostawców, dla Ciebie usługa jest bezpłatna.' },
      { question: 'Jak szybko dostanę ceny?', answer: 'Zazwyczaj w 2–6 godzin roboczych, czasem szybciej.' },
      { question: 'Czy transport jest w cenie?', answer: 'Zależy od dostawcy. W zestawieniu jasno to oznaczamy.' },
      { question: 'Czy mogę dostać plik PDF?', answer: 'Tak, wysyłamy PDF oraz CSV do pobrania.' },
    ],
    ctaTitle: 'Sprawdź ceny teraz',
    ctaSubtitle: 'Wypełnij krótki formularz – odpowiedź dziś.',
    ctaButton: 'SPRAWDŹ CENY TERAZ',
  },
  C: {
    heroBadge: 'Najprostszy sposób na ceny styropianu',
    heroTitle: 'Jedno zgłoszenie = wiele ofert, jasna rekomendacja',
    heroSubtitle: 'Porównujemy rynek, wskazujemy najtańszą opcję i dajemy kontakt do dostawcy.',
    heroButton: 'SPRAWDŹ CENY TERAZ',
    heroBullets: ['Darmowe', 'Szybko', 'Czytelnie'],
    howTitle: 'Jak to działa?',
    howSubtitle: 'Bez kombinowania – same konkrety.',
    howSteps: [
      { title: 'Formularz (2 minuty)', description: 'Rodzaj styropianu + kod pocztowy + kontakt' },
      { title: 'Porównanie cen', description: 'Zbieramy oferty i układamy je od najkorzystniejszej' },
      { title: 'Wybór i zamówienie', description: 'Klikasz w kontakt do dostawcy i załatwione' },
    ],
    whyTitle: 'Dlaczego działa to lepiej niż szukanie samemu?',
    whyItems: [
      { title: 'Łączymy zapytania', description: 'Wspólny wolumen daje lepszą cenę' },
      { title: 'Pełna przejrzystość', description: 'Widzisz ceny i warunki wielu ofert obok siebie' },
      { title: 'Oszczędność czasu', description: 'Ty robisz swoje, my dostarczamy liczby' },
      { title: 'Brak ryzyka', description: 'Usługa jest bezpłatna, a ceny zawsze aktualne' },
    ],
    valueTitle: 'Co dokładnie dostaniesz?',
    valueSubtitle: 'Tabelę cen, rekomendację i kontakty – gotowe do działania.',
    valuePoints: [
      { title: 'Najtańsza oferta na górze', description: 'Nie tracisz czasu na analizę – widzisz, co się opłaca' },
      { title: 'Terminy i transport', description: 'Kiedy dowiozą i ile to kosztuje – przy każdej ofercie' },
      { title: 'Dane kontaktowe', description: 'Od razu możesz dzwonić/zamawiać' },
      { title: 'Załączniki', description: 'PDF/CSV do pobrania i wysłania dalej' },
    ],
    processTitle: 'Proces – szybki i przewidywalny',
    processSubtitle: 'Zawsze wiesz, co się dzieje i co będzie dalej.',
    processDetails: [
      { title: '1. Zgłoszenie', description: 'Formularz online' },
      { title: '2. Porównanie', description: 'Zbieramy i filtrujemy oferty' },
      { title: '3. Zestawienie', description: 'Wysyłka na mail' },
      { title: '4. Decyzja', description: 'Ty wybierasz – gotowe' },
      { title: '5. Wsparcie', description: 'W razie potrzeby pomagamy z formalnościami' },
    ],
    guaranteeTitle: 'Gwarancja oszczędności 500 zł',
    guaranteeSubtitle: 'Ta sama oferta gdzieś taniej? Wyrównamy różnicę (do 500 zł).',
    guaranteeBullets: [
      'Minimalny koszyk 4000 zł',
      'Tożsame parametry i warunki',
      'Szybka weryfikacja mailowa',
    ],
    guaranteeNote: 'Z nami nie przepłacisz – to obiecujemy.',
    testimonialsTitle: 'Opinie użytkowników',
    testimonials: [
      { quote: 'Szybko, prosto, taniej niż u mnie w hurtowni.', author: 'Kamil – właściciel domu' },
      { quote: 'Widziałem wszystkie ceny obok siebie. To przekonuje.', author: 'Eryk – inwestor' },
      { quote: 'Formalności poszły błyskawicznie.', author: 'Iza – wykonawca' },
    ],
    testimonialsExtra: [
      { quote: 'Nie biegam po sklepach – mam liczby w skrzynce.', author: 'Mariusz – klient' },
      { quote: 'Za każdym razem znalazłem parę stów oszczędności.', author: 'Agnieszka – klientka' },
      { quote: 'Polecam znajomym, bo to oszczędza czas i nerwy.', author: 'Robert – klient' },
    ],
    faqTitle: 'Pytania i odpowiedzi',
    faqItems: [
      { question: 'Czy to coś kosztuje?', answer: 'Nie. Dla użytkowników usługa jest bezpłatna.' },
      { question: 'Skąd macie ceny?', answer: 'Zgłoszenia do producentów/dystrybutorów + aktualne cenniki.' },
      { question: 'Jak długo czekam?', answer: 'Najczęściej 2–6 godzin roboczych.' },
      { question: 'Czy mogę od razu zamówić?', answer: 'Tak – w zestawieniu masz kontakt do dostawcy.' },
    ],
    ctaTitle: 'Sprawdź ceny teraz',
    ctaSubtitle: 'Wypełnij formularz – odezwiemy się dziś.',
    ctaButton: 'SPRAWDŹ CENY TERAZ',
  },
};

const VARIANT_OPTIONS: LandingVariant[] = ['A', 'B', 'C'];

const isValidVariant = (value: string | null): value is LandingVariant => {
  if (!value) return false;
  return VARIANT_OPTIONS.includes(value.toUpperCase() as LandingVariant);
};

function HomeContent() {
  const [styrofoamTypes, setStyrofoamTypes] = useState<StyrofoamType[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [variant, setVariant] = useState<LandingVariant | null>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showScrollPopup, setShowScrollPopup] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [userCount] = useState(Math.floor(Math.random() * 50) + 120);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);
  const animatedElementsRef = useRef<HTMLElement[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await axios.get(`${API_URL}/styrofoam-types`);
        setStyrofoamTypes(response.data);
      } catch (error) {
        console.error('Error fetching styrofoam types:', error);
      }
    };

    fetchTypes();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const paramVariant = searchParams.get('variant');
    if (isValidVariant(paramVariant)) {
      const normalized = paramVariant.toUpperCase() as LandingVariant;
      localStorage.setItem('landingVariant', normalized);
      setVariant(normalized);
      return;
    }

    const stored = localStorage.getItem('landingVariant');
    if (isValidVariant(stored)) {
      setVariant(stored.toUpperCase() as LandingVariant);
      return;
    }

    const randomVariant = VARIANT_OPTIONS[Math.floor(Math.random() * VARIANT_OPTIONS.length)];
    localStorage.setItem('landingVariant', randomVariant);
    setVariant(randomVariant);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const content = useMemo(() => {
    if (!variant) {
      return variantContent.A;
    }
    return variantContent[variant];
  }, [variant]);

  const registerAnimatedElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    if (animatedElementsRef.current.includes(element)) return;
    animatedElementsRef.current.push(element);
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  const trackEvent = async (eventType: 'page_view' | 'open_modal') => {
    if (!variant) return;
    try {
      await axios.post(`${API_URL}/analytics/event`, {
        eventType,
        variant,
      });
    } catch (error) {
      console.warn('Failed to log analytics event', error);
    }
  };

  const trackGA = (action: string, category: string = 'engagement', label?: string) => {
    trackGAEvent(action, category, label ? `${label} (variant: ${variant})` : `variant: ${variant}`);
  };

  useEffect(() => {
    if (variant && !hasTrackedView && typeof window !== 'undefined') {
      trackEvent('page_view');
      trackPageView(window.location.pathname, `Landing Page - Variant ${variant}`);
      trackGA('page_view', 'page', `variant_${variant}`);
      setHasTrackedView(true);
    }
  }, [variant, hasTrackedView]);

  // Check cookie consent
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  // Exit intent detection - tylko raz na sesję
  useEffect(() => {
    if (isMobileLayout) return;

    const exitIntentShown = sessionStorage.getItem('exitIntentShown');
    if (exitIntentShown === 'true') return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !openDialog && !submitted && !showExitIntent) {
        // Sprawdź czy użytkownik był na stronie przynajmniej 10 sekund
        const timeOnPage = Date.now() - (window as any).pageLoadTime || 0;
        if (timeOnPage > 10000) {
          setShowExitIntent(true);
          sessionStorage.setItem('exitIntentShown', 'true');
          trackGA('exit_intent_shown', 'engagement', `time_on_page_${Math.round(timeOnPage / 1000)}s`);
        }
      }
    };

    (window as any).pageLoadTime = Date.now();
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [openDialog, submitted, showExitIntent, isMobileLayout]);

  // Scroll-based popup - tylko raz, po większym scrollu i czasie
  useEffect(() => {
    const scrollPopupShown = localStorage.getItem('scrollPopupShown');
    if (scrollPopupShown === 'true') return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const scrollPercentage = (documentHeight > windowHeight) 
          ? (scrollTop / (documentHeight - windowHeight)) * 100 
          : 0;
        setScrollProgress(scrollPercentage);

        // Tylko jeśli scroll > 80% i użytkownik był na stronie > 30 sekund
        const timeOnPage = Date.now() - (window as any).pageLoadTime || 0;
        if (scrollPercentage > 80 && timeOnPage > 30000 && !openDialog && !submitted && !showScrollPopup) {
          setShowScrollPopup(true);
          localStorage.setItem('scrollPopupShown', 'true');
          trackGA('scroll_popup_shown', 'engagement', `scroll_${Math.round(scrollPercentage)}%_time_${Math.round(timeOnPage / 1000)}s`);
        }
      }, 500); // Debounce
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [openDialog, submitted, showScrollPopup]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observerRef.current = observer;
    animatedElementsRef.current.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const handleOpenModal = () => {
    if (!openDialog) {
      setOpenDialog(true);
      trackEvent('open_modal');
      trackGA('open_modal', 'conversion', 'form_modal_opened');
    }
  };

  if (!variant) {
    return <div className="min-h-screen bg-white" />;
  }

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieConsent(false);
    trackGA('cookie_consent_accepted', 'engagement', 'cookies_accepted');
  };

  const quickStats = [
    { label: 'Producentów w bazie', value: '50+' },
    { label: 'Średnia oszczędność', value: '700 zł' },
    { label: 'Czas odpowiedzi', value: '2-6 h' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-green-400 transition-all duration-300 ease-out"
          style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 1 ? 1 : 0 }}
          aria-hidden="true"
        />
      </div>
      {/* Cookie Consent */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg border-t-2 border-blue-500">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-sm">
                <p className="mb-1 font-semibold">🍪 Ta strona używa plików cookie</p>
                <p className="text-gray-300 text-xs">
                  Używamy plików cookie, aby poprawić Twoje doświadczenie na stronie. Kontynuując przeglądanie, 
                  zgadzasz się na naszą{' '}
                  <a href="#" className="underline hover:text-blue-300">politykę prywatności</a>.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptCookies}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold"
                >
                  Akceptuję
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Contact Bar */}
      <div className="sticky top-0 z-40 bg-blue-600 text-white py-2 px-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <a 
              href="tel:+48576205389" 
              className="hover:underline font-semibold"
              onClick={() => trackGA('contact_click', 'engagement', 'phone_click')}
            >
              +48 576 205 389
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a 
              href="mailto:info@soft-synergy.com" 
              className="hover:underline font-semibold"
              onClick={() => trackGA('contact_click', 'engagement', 'email_click')}
            >
              info@styroaction.pl
            </a>
          </div>
          <div className="text-xs sm:text-sm opacity-90">
            📞 Zadzwoń lub napisz - pomożemy dobrać najlepszą cenę
          </div>
        </div>
      </div>

      {/* Social Proof Banner */}
      <div className="bg-green-50 border-b-2 border-green-200 py-2 px-4 text-center">
        <p className="text-sm text-green-800 font-semibold">
          🎉 Dziś już {userCount} osób sprawdziło ceny styropianu przez naszą platformę
        </p>
      </div>

      {/* Exit Intent Popup */}
      <Dialog open={showExitIntent} onOpenChange={setShowExitIntent}>
        <DialogContent className="sm:max-w-lg p-8">
          <DialogHeader className="space-y-4 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
              ⏰ Czekaj! Nie trać szansy na oszczędności
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700 leading-relaxed text-center">
              Wypełnij formularz w 2 minuty, a dostaniesz ceny od wszystkich producentów. 
              <strong className="block mt-2 text-blue-600">Zaoszczędzisz średnio 500-1000 zł!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-3 pt-6">
            <Button
              onClick={() => {
                setShowExitIntent(false);
                handleOpenModal();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
            >
              Tak, chcę sprawdzić ceny
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExitIntent(false)}
              className="w-full border-2 border-gray-300"
            >
              Nie, dziękuję
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scroll Popup */}
      <Dialog open={showScrollPopup} onOpenChange={setShowScrollPopup}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              💡 Zainteresowany?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-700 mt-2">
              Wypełnij formularz i dostaniesz porównanie cen w kilka godzin. Bez zobowiązań.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 pt-4">
            <Button
              onClick={() => {
                setShowScrollPopup(false);
                handleOpenModal();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sprawdź ceny teraz
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowScrollPopup(false)}
              className="w-full"
            >
              Może później
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <div className="p-6 md:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-bold text-center">Zapytaj o cenę styropianu</DialogTitle>
              <DialogDescription className="text-lg text-center mt-2 text-gray-700">
                Wypełnij formularz - wyślemy Ci ceny od wszystkich producentów
              </DialogDescription>
            </DialogHeader>
            <RequestForm
              styrofoamTypes={styrofoamTypes}
              variant={variant}
              onSubmit={() => {
                setSubmitted(true);
                setOpenDialog(false);
                setShowSuccessModal(true);
              }}
              onCancel={() => setOpenDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-lg p-8">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-3xl font-bold text-green-900">
              Dziękujemy za zgłoszenie!
            </DialogTitle>
            <DialogDescription className="text-lg text-green-800 leading-relaxed">
              Wysłaliśmy potwierdzenie na Twój email i zbieramy właśnie wyceny od fabryk. Konsultant Antoni Seba
              odezwie się, gdy tylko zestawimy najlepsze oferty.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-3 text-gray-700 text-base">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
              <p>Średni czas przygotowania ofert: 2–6 godzin roboczych.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
              <p>Jeśli masz dodatkowe informacje, odpowiedz na maila potwierdzającego lub zadzwoń pod +48 576 205 389.</p>
            </div>
          </div>
          <DialogFooter className="pt-6">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={() => setShowSuccessModal(false)}
            >
              Zamknij i wróć na stronę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b-2 bg-white shadow-sm">
        <div className="container flex flex-col gap-3 px-4 py-3 sm:h-20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Styrtoaction.pl Logo" 
              className="h-12 w-12 object-contain"
            />
            <span className="text-2xl font-bold">Styrtoaction.pl</span>
          </div>
          <Button
            size="lg"
            className="w-full text-base px-6 py-3 h-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
            onClick={handleOpenModal}
          >
            {content.heroButton}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white py-16 md:py-24">
        <div className="hero-orb hero-orb--left" aria-hidden="true" />
        <div className="hero-orb hero-orb--right" aria-hidden="true" />
        <div className="hero-spotlight" aria-hidden="true" />
        <div className="container px-4">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div
              ref={registerAnimatedElement}
              className="animate-section inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-lg font-semibold text-blue-600 shadow-sm backdrop-blur"
              style={{ transitionDelay: '100ms' }}
            >
              <Sparkles className="h-5 w-5" />
              <span>{content.heroBadge}</span>
            </div>
            <h1
              ref={registerAnimatedElement}
              className="animate-section text-4xl md:text-6xl font-bold leading-tight"
              style={{ transitionDelay: '200ms' }}
            >
              {content.heroTitle}
            </h1>
            <p
              ref={registerAnimatedElement}
              className="animate-section text-2xl text-gray-700 font-medium"
              style={{ transitionDelay: '300ms' }}
            >
              {content.heroSubtitle}
            </p>
            <div
              ref={registerAnimatedElement}
              className="animate-section"
              style={{ transitionDelay: '400ms' }}
            >
              <Button
                size="lg"
                className="hero-cta text-xl px-12 py-6 h-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg"
                onClick={handleOpenModal}
              >
                {content.heroButton}
              </Button>
            </div>
            <div
              ref={registerAnimatedElement}
              className="animate-section flex flex-wrap justify-center gap-4 text-lg text-gray-600"
              style={{ transitionDelay: '500ms' }}
            >
              {content.heroBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-1"
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        className="animate-section py-16 md:py-20 bg-white"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <h2 className="animate-section text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900" ref={registerAnimatedElement}>
            {content.howTitle}
          </h2>
          <p
            className="animate-section text-lg md:text-xl text-center text-gray-600 mb-12"
            ref={registerAnimatedElement}
            style={{ transitionDelay: '120ms' }}
          >
            {content.howSubtitle}
          </p>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {content.howSteps.map((step, index) => (
              <div
                key={step.title}
                ref={registerAnimatedElement}
                className="animate-section text-center"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="mb-6 flex justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-white text-4xl font-bold shadow-xl ring-4 ring-blue-100">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-lg text-gray-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section
        className="animate-section py-16 md:py-20 bg-gray-50"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <h2
            className="animate-section text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900"
            ref={registerAnimatedElement}
          >
            {content.whyTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {content.whyItems.map((item, index) => (
              <div
                key={item.title}
                ref={registerAnimatedElement}
                className="animate-section"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Card className="card-hover border-2 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">{item.title}</CardTitle>
                    <CardDescription className="text-lg text-gray-700 mt-2">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Section */}
      <section
        className="animate-section py-16 md:py-20 bg-white"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <h2
            className="animate-section text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900"
            ref={registerAnimatedElement}
          >
            {content.valueTitle}
          </h2>
          <p
            className="animate-section text-lg md:text-xl text-center text-gray-600 mb-12"
            ref={registerAnimatedElement}
          >
            {content.valueSubtitle}
          </p>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {content.valuePoints.map((point, index) => (
              <div
                key={point.title}
                ref={registerAnimatedElement}
                className="animate-section"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Card className="card-hover border-2 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">{point.title}</CardTitle>
                    <CardDescription className="text-lg text-gray-700 mt-2">{point.description}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section
        className="animate-section py-16 md:py-20 bg-gray-50"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <h2
            className="animate-section text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900"
            ref={registerAnimatedElement}
          >
            {content.processTitle}
          </h2>
          <p
            className="animate-section text-lg md:text-xl text-center text-gray-600 mb-12"
            ref={registerAnimatedElement}
          >
            {content.processSubtitle}
          </p>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {content.processDetails.map((detail, index) => (
              <div
                key={detail.title}
                ref={registerAnimatedElement}
                className="animate-section"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Card className="card-hover border-2 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">{detail.title}</CardTitle>
                    <CardDescription className="text-lg text-gray-700 mt-2">{detail.description}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section
        className="animate-section py-16 md:py-24 bg-blue-600 text-white"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <div className="animate-section max-w-3xl mx-auto text-center" ref={registerAnimatedElement}>
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-600 shadow-2xl">
                <DollarSign className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{content.guaranteeTitle}</h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">{content.guaranteeSubtitle}</p>
            <div className="bg-white/10 rounded-lg p-6 mb-8 text-left backdrop-blur">
              <p className="text-lg mb-4 font-semibold">Warunki:</p>
              <ul className="space-y-2 text-lg">
                {content.guaranteeBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2 className="h-6 w-6 mt-1 flex-shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button size="lg" className="hero-cta text-xl px-12 py-6 h-auto bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-lg" onClick={handleOpenModal}>
              {content.heroButton}
            </Button>
            <p className="mt-3 text-base text-blue-100">{content.guaranteeNote}</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="animate-section py-16 md:py-20 bg-white"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <h2
            className="animate-section text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900"
            ref={registerAnimatedElement}
          >
            {content.testimonialsTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {content.testimonials.map((testimonial, index) => (
              <div
                key={testimonial.quote}
                ref={registerAnimatedElement}
                className="animate-section"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Card className="card-hover border-2 border-gray-200">
                  <CardHeader>
                    <div className="mb-4 text-2xl text-yellow-500">★★★★★</div>
                    <CardDescription className="text-lg text-gray-700">“{testimonial.quote}”</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra Testimonials */}
      <section
        className="animate-section py-16 md:py-20 bg-gray-50"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <h2
            className="animate-section text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900"
            ref={registerAnimatedElement}
          >
            Dodatkowe opinie
          </h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {content.testimonialsExtra.map((testimonial, index) => (
              <div
                key={testimonial.quote}
                ref={registerAnimatedElement}
                className="animate-section"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Card className="card-hover border-2 border-gray-200">
                  <CardHeader>
                    <div className="mb-4 text-2xl text-yellow-500">★★★★★</div>
                    <CardDescription className="text-lg text-gray-700">“{testimonial.quote}”</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        className="animate-section py-16 md:py-20 bg-white"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <h2
            className="animate-section text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900"
            ref={registerAnimatedElement}
          >
            {content.faqTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {content.faqItems.map((faq, index) => (
              <div
                key={faq.question}
                ref={registerAnimatedElement}
                className="animate-section"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Card className="card-hover border-2 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg text-gray-700">{faq.answer}</CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!submitted && (
        <section
          className="animate-section py-16 md:py-24 bg-gradient-to-br from-blue-50 to-blue-100 border-t-4 border-blue-500"
          ref={registerAnimatedElement}
        >
          <div className="container px-4">
            <div className="animate-section max-w-3xl mx-auto text-center" ref={registerAnimatedElement}>
              <div className="mb-4 inline-block px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold animate-pulse">
                ⚡ Oferta ograniczona czasowo
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
                {content.ctaTitle}
              </h2>
              <p className="text-xl md:text-2xl mb-4 text-gray-700">
                {content.ctaSubtitle}
              </p>
              <div className="bg-white rounded-lg p-6 mb-8 border-2 border-blue-300 shadow-lg">
                <p className="text-lg font-semibold text-gray-900 mb-3">
                  💰 Co dostaniesz w mailu:
                </p>
                <ul className="text-left space-y-2 text-gray-700 max-w-md mx-auto">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Tabela z cenami od wszystkich producentów</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Wskazanie najtańszej oferty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Kontakty do producentów</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Informacje o transporcie i terminach</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-gray-600 italic">
                  Średnia oszczędność: 500-1000 zł na zamówieniu
                </p>
              </div>
              <Button size="lg" className="hero-cta text-xl px-12 py-6 h-auto bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg transform hover:scale-105 transition-transform" onClick={handleOpenModal}>
                {content.ctaButton}
              </Button>
              <p className="mt-4 text-sm text-gray-600">
                ⏱️ Wypełnienie formularza zajmuje tylko 2 minuty
              </p>
              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>100% darmowe</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Zero zobowiązań</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Bez spamu</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="animate-section border-t-2 bg-gray-900 text-white py-12"
        ref={registerAnimatedElement}
      >
        <div className="container px-4">
          <div className="grid gap-8 md:grid-cols-3 text-center md:text-left">
            <div>
              <div className="mb-4 flex items-center justify-center md:justify-start space-x-2">
                <img 
                  src="/logo.png" 
                  alt="Styrtoaction.pl Logo" 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-bold">Styrtoaction.pl</span>
              </div>
              <p className="text-gray-400">
                Sprawdzamy ceny styropianu u 50+ producentów
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-lg">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-5 w-5" />
                  <a 
                    href="mailto:info@soft-synergy.com" 
                    className="hover:text-white"
                    onClick={() => trackGA('contact_click', 'engagement', 'email_click_footer')}
                  >
                    info@styroaction.pl
                  </a>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="h-5 w-5" />
                  <a 
                    href="tel:+48576205389" 
                    className="hover:text-white"
                    onClick={() => trackGA('contact_click', 'engagement', 'phone_click_footer')}
                  >
                    +48 576 205 389
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-lg">Informacje</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/regulamin" className="hover:text-white">Regulamin</a></li>
                <li><a href="/polityka-prywatnosci" className="hover:text-white">Polityka prywatności</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400 space-y-2">
            <p>&copy; 2024 Styrtoaction.pl</p>
            <p className="text-xs">Wersja landing page: {variant}</p>
            <p className="text-xs">
              Systemy informatyczne wspierane przez{' '}
              <a
                href="https://soft-synergy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white underline decoration-dotted decoration-1 underline-offset-2 hover:text-blue-200"
              >
                Soft Synergy
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Ładowanie...</p>
      </div>
    </div>}>
      <HomeContent />
    </Suspense>
  );
}

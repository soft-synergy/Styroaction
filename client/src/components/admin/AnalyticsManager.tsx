'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import styles from './AnalyticsManager.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.styroaction.pl/api';

interface VariantSummary {
  variant: string;
  total: number;
  events: Record<string, number>;
}

interface DateRange {
  from: string;
  to: string;
}

interface AnalyticsManagerProps {
  token: string;
}

const EXPERIMENT_NOTES = [
  { variant: 'A', focus: 'Hero "Nie przepłacaj za styropian" + mocny argument ceny' },
  { variant: 'B', focus: 'Hero o szybkości odpowiedzi i tabeli z cenami' },
  { variant: 'C', focus: 'Hero o prostocie procesu i jasnej rekomendacji' },
];

const QUICK_RANGES = [
  { label: '7 dni', days: 7 },
  { label: '30 dni', days: 30 },
  { label: '90 dni', days: 90 },
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AnalyticsManager(_props: AnalyticsManagerProps) {
  const [summary, setSummary] = useState<VariantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DateRange>({ from: '', to: '' });
  const [appliedFilters, setAppliedFilters] = useState<DateRange>({ from: '', to: '' });

  useEffect(() => {
    fetchSummary(appliedFilters);
  }, [appliedFilters]);

  const fetchSummary = async (range: DateRange) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/analytics/summary`, {
        params: {
          from: range.from || undefined,
          to: range.to || undefined,
        },
      });
      setSummary(response.data.summary || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch analytics summary', err);
      setError(err?.response?.data?.error || 'Nie udało się pobrać danych analitycznych.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    const empty = { from: '', to: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const applyQuickRange = (days: number) => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - (days - 1));
    const newRange = { from: formatDateInput(fromDate), to: formatDateInput(toDate) };
    setFilters(newRange);
    setAppliedFilters(newRange);
  };

  const enrichedSummary = useMemo(() => {
    return summary.map((variant) => {
      const pageViews = variant.events.page_view ?? 0;
      const modalOpens = variant.events.open_modal ?? 0;
      const submissions = variant.events.submit_form ?? 0;
      const conversionRate = pageViews > 0 ? (submissions / pageViews) * 100 : 0;
      const modalRate = pageViews > 0 ? (modalOpens / pageViews) * 100 : 0;
      return {
        ...variant,
        pageViews,
        modalOpens,
        submissions,
        conversionRate,
        modalRate,
      };
    });
  }, [summary]);

  const totals = useMemo(() => {
    return enrichedSummary.reduce(
      (acc, variant) => {
        acc.pageViews += variant.pageViews;
        acc.submissions += variant.submissions;
        return acc;
      },
      { pageViews: 0, submissions: 0 }
    );
  }, [enrichedSummary]);

  const averageConversion =
    enrichedSummary.length > 0
      ? enrichedSummary.reduce((sum, variant) => sum + variant.conversionRate, 0) / enrichedSummary.length
      : 0;

  const bestVariant = useMemo(() => {
    if (!enrichedSummary.length) return null;
    return enrichedSummary.reduce((best, current) => {
      if (!best) return current;
      return current.conversionRate > best.conversionRate ? current : best;
    }, enrichedSummary[0]);
  }, [enrichedSummary]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Analityka i testy A/B</h2>
          <p className={styles.subtitle}>
            Podgląd ruchu i konwersji dla wariantów landing page&apos;a (A/B/C). Dane z endpointu{' '}
            <code>/analytics/summary</code>.
          </p>
        </div>
        <div className={styles.meta}>
          <span>Łączne wyświetlenia: {totals.pageViews}</span>
          <span>Łączne zgłoszenia: {totals.submissions}</span>
          <span>Średnia konwersja: {averageConversion.toFixed(1)}%</span>
        </div>
      </div>

      <form className={styles.filters} onSubmit={applyFilters}>
        <div className={styles.filterGroup}>
          <label>
            Od
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
          </label>
          <label>
            Do
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            />
          </label>
        </div>
        <div className={styles.filterActions}>
          <button type="submit" className={styles.primaryButton}>
            Zastosuj
          </button>
          <button type="button" className={styles.secondaryButton} onClick={resetFilters}>
            Wyczyść
          </button>
        </div>
        <div className={styles.quickFilters}>
          {QUICK_RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              className={styles.quickButton}
              onClick={() => applyQuickRange(range.days)}
            >
              Ostatnie {range.label}
            </button>
          ))}
        </div>
      </form>

      {loading && <div className={styles.loading}>Ładowanie danych...</div>}
      {error && !loading && <div className={styles.error}>{error}</div>}

      {!loading && !error && enrichedSummary.length === 0 && (
        <div className={styles.emptyState}>
          Brak danych dla wybranego zakresu. Spróbuj poszerzyć daty.
        </div>
      )}

      {!loading && !error && enrichedSummary.length > 0 && (
        <>
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <p className={styles.cardTitle}>Najlepszy wariant</p>
              <p className={styles.cardValue}>{bestVariant?.variant ?? '—'}</p>
              <p className={styles.cardDetail}>
                Konwersja {bestVariant ? bestVariant.conversionRate.toFixed(2) : '0.00'}% (
                {bestVariant?.submissions ?? 0} zgłoszeń)
              </p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardTitle}>Średnia konwersja</p>
              <p className={styles.cardValue}>{averageConversion.toFixed(2)}%</p>
              <p className={styles.cardDetail}>Średnia z wszystkich wariantów</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardTitle}>Łączne zgłoszenia</p>
              <p className={styles.cardValue}>{totals.submissions}</p>
              <p className={styles.cardDetail}>Wszystkie warianty A/B/C</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardTitle}>Łączne wyświetlenia</p>
              <p className={styles.cardValue}>{totals.pageViews}</p>
              <p className={styles.cardDetail}>page_view eventy</p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Wariant</th>
                  <th>Wyświetlenia</th>
                  <th>Otw. formularz</th>
                  <th>Zgłoszenia</th>
                  <th>Konwersja</th>
                  <th>CTR formularza</th>
                </tr>
              </thead>
              <tbody>
                {enrichedSummary.map((variant) => (
                  <tr key={variant.variant}>
                    <td>{variant.variant}</td>
                    <td>{variant.pageViews}</td>
                    <td>{variant.modalOpens}</td>
                    <td>{variant.submissions}</td>
                    <td>{variant.conversionRate.toFixed(2)}%</td>
                    <td>{variant.modalRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className={styles.insights}>
            <div className={styles.insightCard}>
              <h3>Wnioski</h3>
              <ul>
                <li>
                  {bestVariant
                    ? `Wariant ${bestVariant.variant} prowadzi w konwersji (${bestVariant.conversionRate.toFixed(
                        2
                      )}%).`
                    : 'Brak danych, aby wskazać lidera.'}
                </li>
                <li>
                  Średnia konwersja dla zestawu testowego wynosi {averageConversion.toFixed(2)}% (
                  {totals.submissions} zgłoszeń / {totals.pageViews} wyświetleń).
                </li>
                <li>
                  Zdarzenia są liczone z endpointu <code>/analytics/event</code>. Jeśli dodasz nowe typy eventów,
                  trzeba je uwzględnić w tabeli.
                </li>
              </ul>
            </div>
            <div className={styles.insightCard}>
              <h3>Konfiguracja testu</h3>
              <ul>
                {EXPERIMENT_NOTES.map((note) => (
                  <li key={note.variant}>
                    <strong>Wariant {note.variant}:</strong> {note.focus}
                  </li>
                ))}
              </ul>
              <p className={styles.cardDetail}>
                Definicje copy znajdziesz w pliku <code>client/src/app/page.tsx</code> w obiekcie{' '}
                <code>variantContent</code>.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}



'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.styroaction.pl/api';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyUnsubscribed, setAlreadyUnsubscribed] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (token && email) {
      // Verify token first
      axios.get(`${API_URL}/price-list-requests/verify-unsubscribe/${token}`, {
        params: { email },
      })
        .then((response) => {
          setValid(true);
          if (response.data.alreadyUnsubscribed) {
            setAlreadyUnsubscribed(true);
            setSuccess(true);
          }
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Nieprawidłowy link wypisania się');
          setValid(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      setValid(false);
      setError('Brak wymaganych parametrów w linku');
    }
  }, [token, email]);

  const handleUnsubscribe = async () => {
    if (!token || !email) {
      setError('Brak wymaganych parametrów');
      return;
    }

    setUnsubscribing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/price-list-requests/unsubscribe`, {
        token,
        email,
      });

      if (response.data.alreadyUnsubscribed) {
        setAlreadyUnsubscribed(true);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Błąd podczas wypisywania się');
    } finally {
      setUnsubscribing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f8fb' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '18px', boxShadow: '0 25px 50px rgba(12,61,91,0.08)', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>⏳</div>
          <p style={{ color: '#5c768d' }}>Sprawdzanie linku...</p>
        </div>
      </div>
    );
  }

  if (!valid || error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f8fb' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '18px', boxShadow: '0 25px 50px rgba(12,61,91,0.08)', maxWidth: '500px', width: '90%' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px', textAlign: 'center' }}>❌</div>
          <h1 style={{ color: '#dc3545', marginBottom: '16px', textAlign: 'center' }}>Błąd</h1>
          <p style={{ color: '#5c768d', lineHeight: '1.7', textAlign: 'center' }}>
            {error || 'Nieprawidłowy link wypisania się. Jeśli problem się powtarza, skontaktuj się z nami.'}
          </p>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a 
              href="mailto:info@soft-synergy.com" 
              style={{ color: '#108fdc', textDecoration: 'underline' }}
            >
              Skontaktuj się z nami
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f8fb' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '18px', boxShadow: '0 25px 50px rgba(12,61,91,0.08)', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
          <h1 style={{ color: '#28a745', marginBottom: '16px', fontSize: '28px' }}>
            {alreadyUnsubscribed ? 'Już wypisany' : 'Wypisano pomyślnie'}
          </h1>
          <p style={{ color: '#5c768d', lineHeight: '1.7' }}>
            {alreadyUnsubscribed 
              ? 'Ten adres email został już wcześniej wypisany z listy. Nie będziesz otrzymywać więcej wiadomości o cennikach.'
              : 'Zostałeś wypisany z listy. Nie będziesz już otrzymywać wiadomości o cennikach od Styroaction.'}
          </p>
          <div style={{ marginTop: '32px', padding: '20px', background: '#f0f5f9', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#2b506b' }}>
              Jeśli zmienisz zdanie, możesz zawsze skontaktować się z nami pod adresem{' '}
              <a href="mailto:info@soft-synergy.com" style={{ color: '#108fdc' }}>
                info@soft-synergy.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f8fb', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '18px', boxShadow: '0 25px 50px rgba(12,61,91,0.08)', maxWidth: '600px', width: '100%' }}>
        <div style={{ background: 'linear-gradient(135deg, #0c3d5b, #108fdc)', padding: '32px', borderRadius: '12px', marginBottom: '32px', textAlign: 'center' }}>
          <img src="/logo.png" alt="Styroaction" style={{ width: '180px', height: 'auto', marginBottom: '16px' }} />
          <h1 style={{ color: '#fff', fontSize: '28px', margin: 0 }}>Wypisz się z listy</h1>
        </div>

        <p style={{ marginBottom: '24px', color: '#5c768d', lineHeight: '1.7' }}>
          Czy na pewno chcesz wypisać się z listy? Jeśli to zrobisz, nie będziesz już otrzymywać wiadomości 
          z prośbą o aktualizację cennika od Styroaction.
        </p>

        {error && (
          <div style={{ 
            padding: '12px', 
            background: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            borderRadius: '8px', 
            color: '#721c24', 
            marginBottom: '24px' 
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
          <button
            onClick={handleUnsubscribe}
            disabled={unsubscribing}
            style={{
              flex: 1,
              padding: '16px',
              background: unsubscribing ? '#95a5a6' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: unsubscribing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {unsubscribing ? 'Wypisywanie...' : 'Tak, wypisz mnie'}
          </button>
          <a
            href="/"
            style={{
              flex: 1,
              padding: '16px',
              background: '#f0f5f9',
              color: '#0c3d5b',
              border: 'none',
              borderRadius: '999px',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            Anuluj
          </a>
        </div>

        <div style={{ marginTop: '32px', padding: '20px', background: '#f0f5f9', borderRadius: '12px', borderLeft: '4px solid #0c3d5b' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#2b506b', lineHeight: '1.7' }}>
            <strong>Uwaga:</strong> Wypisanie się oznacza, że nie będziesz otrzymywać automatycznych przypomnień 
            o aktualizacji cennika. Możesz zawsze skontaktować się z nami bezpośrednio, jeśli chcesz wznowić otrzymywanie wiadomości.
          </p>
        </div>
      </div>
    </div>
  );
}

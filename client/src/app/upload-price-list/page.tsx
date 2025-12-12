'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.styroaction.pl/api';

export default function UploadPriceListPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [producerName, setProducerName] = useState<string>('');

  useEffect(() => {
    if (email) {
      // Try to fetch producer name if available
      axios.get(`${API_URL}/price-list-requests/verify-token/${token}`, {
        params: { email },
      })
        .then((response) => {
          if (response.data.request?.producerName) {
            setProducerName(response.data.request.producerName);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [email, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Proszę wybrać plik');
      return;
    }

    if (!token || !email) {
      setError('Brak wymaganych parametrów');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);
      formData.append('email', email);

      await axios.post(`${API_URL}/price-list-requests/upload?token=${token}&email=${encodeURIComponent(email)}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Błąd podczas przesyłania pliku');
    } finally {
      setUploading(false);
    }
  };

  if (!token || !email) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f8fb' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '18px', boxShadow: '0 25px 50px rgba(12,61,91,0.08)', maxWidth: '500px', width: '90%' }}>
          <h1 style={{ color: '#dc3545', marginBottom: '16px' }}>Błąd</h1>
          <p style={{ color: '#5c768d' }}>Nieprawidłowy link. Skontaktuj się z nami, aby otrzymać nowy link do przesłania cennika.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f8fb' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '18px', boxShadow: '0 25px 50px rgba(12,61,91,0.08)', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
          <h1 style={{ color: '#28a745', marginBottom: '16px', fontSize: '28px' }}>Plik przesłany pomyślnie!</h1>
          <p style={{ color: '#5c768d', lineHeight: '1.7' }}>
            Dziękujemy za przesłanie aktualnego cennika. Zostanie on przetworzony i dodany do naszej bazy danych.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f8fb', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '18px', boxShadow: '0 25px 50px rgba(12,61,91,0.08)', maxWidth: '600px', width: '100%' }}>
        <div style={{ background: 'linear-gradient(135deg, #0c3d5b, #108fdc)', padding: '32px', borderRadius: '12px', marginBottom: '32px', textAlign: 'center' }}>
          <img src="/logo.png" alt="Styroaction" style={{ width: '180px', height: 'auto', marginBottom: '16px' }} />
          <h1 style={{ color: '#fff', fontSize: '28px', margin: 0 }}>Prześlij cennik</h1>
        </div>

        {producerName && (
          <p style={{ marginBottom: '24px', color: '#2b506b', fontSize: '16px' }}>
            Witaj <strong>{producerName}</strong>,
          </p>
        )}

        <p style={{ marginBottom: '24px', color: '#5c768d', lineHeight: '1.7' }}>
          Prosimy o przesłanie aktualnego cennika Twoich produktów styropianowych. 
          Akceptujemy pliki w formatach: PDF, Excel (XLS, XLSX), CSV.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0c3d5b' }}>
              Wybierz plik z cennikiem
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.xls,.xlsx,.csv,.ods"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed #e2ecf3',
                borderRadius: '8px',
                background: '#f7fbff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              required
            />
            {file && (
              <p style={{ marginTop: '8px', color: '#28a745', fontSize: '14px' }}>
                ✓ Wybrano: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

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

          <button
            type="submit"
            disabled={uploading || !file}
            style={{
              width: '100%',
              padding: '16px',
              background: uploading ? '#95a5a6' : '#0c3d5b',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: uploading || !file ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {uploading ? 'Przesyłanie...' : 'Prześlij cennik'}
          </button>
        </form>

        <div style={{ marginTop: '32px', padding: '20px', background: '#f0f5f9', borderRadius: '12px', borderLeft: '4px solid #0c3d5b' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#2b506b', lineHeight: '1.7' }}>
            <strong>Uwaga:</strong> Maksymalny rozmiar pliku to 10 MB. 
            Po przesłaniu plik zostanie automatycznie przetworzony i dodany do naszej bazy danych.
          </p>
        </div>
      </div>
    </div>
  );
}

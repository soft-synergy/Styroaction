'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Manager.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.styroaction.pl/api';

interface PriceListRequest {
  _id: string;
  email: string;
  producerName?: string;
  status: 'pending' | 'sent' | 'responded' | 'expired';
  followUpCount: number;
  lastSentAt?: string;
  nextFollowUpAt?: string;
  respondedAt?: string;
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  createdAt: string;
  updatedAt: string;
}

interface PriceListRequestsManagerProps {
  token: string;
}

export default function PriceListRequestsManager({ token }: PriceListRequestsManagerProps) {
  const [requests, setRequests] = useState<PriceListRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'responded' | 'expired'>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/price-list-requests`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching price list requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      await axios.post(`${API_URL}/price-list-requests/${id}/send`);
      await fetchRequests();
      alert('Email wysłany pomyślnie');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas wysyłania emaila');
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('Czy na pewno chcesz zresetować to zapytanie?')) {
      return;
    }
    try {
      await axios.post(`${API_URL}/price-list-requests/${id}/reset`);
      await fetchRequests();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas resetowania');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const getStatusBadge = (status: string, followUpCount: number) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: 'Oczekuje', className: styles.statusPending },
      sent: { text: `Wysłano (${followUpCount})`, className: styles.statusSent },
      responded: { text: 'Odpowiedziano', className: styles.statusResponded },
      expired: { text: 'Wygasło', className: styles.statusExpired },
    };
    return badges[status] || badges.pending;
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  const stats = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    sent: requests.filter(r => r.status === 'sent').length,
    responded: requests.filter(r => r.status === 'responded').length,
    expired: requests.filter(r => r.status === 'expired').length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Zapytania o cenniki</h2>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ padding: '12px 20px', background: '#f0f5f9', borderRadius: '8px', border: '1px solid #e2ecf3' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c3d5b' }}>{stats.all}</div>
          <div style={{ fontSize: '12px', color: '#5c768d', textTransform: 'uppercase' }}>Wszystkie</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{stats.pending}</div>
          <div style={{ fontSize: '12px', color: '#856404', textTransform: 'uppercase' }}>Oczekuje</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#d1ecf1', borderRadius: '8px', border: '1px solid #0dcaf0' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#055160' }}>{stats.sent}</div>
          <div style={{ fontSize: '12px', color: '#055160', textTransform: 'uppercase' }}>Wysłano</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#d4edda', borderRadius: '8px', border: '1px solid #28a745' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{stats.responded}</div>
          <div style={{ fontSize: '12px', color: '#155724', textTransform: 'uppercase' }}>Odpowiedziano</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#f8d7da', borderRadius: '8px', border: '1px solid #dc3545' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{stats.expired}</div>
          <div style={{ fontSize: '12px', color: '#721c24', textTransform: 'uppercase' }}>Wygasło</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'sent', 'responded', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e2ecf3',
              background: filter === f ? '#0c3d5b' : '#fff',
              color: filter === f ? '#fff' : '#0c3d5b',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {f === 'all' ? 'Wszystkie' : f === 'pending' ? 'Oczekuje' : f === 'sent' ? 'Wysłano' : f === 'responded' ? 'Odpowiedziano' : 'Wygasło'}
          </button>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nazwa producenta</th>
              <th>Status</th>
              <th>Follow-up</th>
              <th>Ostatnio wysłano</th>
              <th>Następny follow-up</th>
              <th>Odpowiedziano</th>
              <th>Plik</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => {
              const badge = getStatusBadge(request.status, request.followUpCount);
              return (
                <tr 
                  key={request._id}
                  style={{
                    backgroundColor: request.status === 'expired' ? '#fff5f5' : 'transparent',
                  }}
                >
                  <td style={{ fontWeight: '600' }}>{request.email}</td>
                  <td>{request.producerName || '-'}</td>
                  <td>
                    <span className={badge.className} style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-block',
                      backgroundColor: request.status === 'expired' ? '#dc3545' : 
                                     request.status === 'responded' ? '#28a745' :
                                     request.status === 'sent' ? '#0dcaf0' : '#ffc107',
                      color: '#fff',
                    }}>
                      {badge.text}
                    </span>
                  </td>
                  <td>{request.followUpCount}/3</td>
                  <td>{formatDate(request.lastSentAt)}</td>
                  <td>{formatDate(request.nextFollowUpAt)}</td>
                  <td>{formatDate(request.respondedAt)}</td>
                  <td>
                    {request.uploadedFileName ? (
                      <a 
                        href={`${API_URL.replace('/api', '')}${request.uploadedFileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#108fdc', textDecoration: 'underline' }}
                      >
                        {request.uploadedFileName}
                      </a>
                    ) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {request.status !== 'responded' && (
                        <button
                          onClick={() => handleSendEmail(request._id)}
                          className={styles.editButton}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Wyślij email
                        </button>
                      )}
                      <button
                        onClick={() => handleReset(request._id)}
                        className={styles.deleteButton}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRequests.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#5c768d' }}>
            Brak zapytań do wyświetlenia
          </div>
        )}
      </div>
    </div>
  );
}

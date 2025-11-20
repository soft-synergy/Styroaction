'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Manager.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.styroaction.pl/api';

interface Request {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  postalCode: string;
  styrofoamType?: {
    _id: string;
    name: string;
  };
  quantity?: number;
  requestMode: 'guided' | 'manual';
  guidedItems?: Array<{
    useCase: string;
    styrofoamType?: { _id: string; name: string };
    styrofoamName?: string;
    thicknessCm?: number;
    areaM2?: number;
    volumeM3?: number;
    notes?: string;
  }>;
  manualDetails?: string;
  needsConsultation?: boolean;
  totalVolumeM3?: number;
  notes?: string;
  status: 'pending' | 'processed' | 'sent';
  emailSentAt?: string;
  createdAt: string;
}

interface RequestsManagerProps {
  token: string;
}

export default function RequestsManager({ token }: RequestsManagerProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/requests`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await axios.post(`${API_URL}/requests/${requestId}/send-email`);
      await fetchRequests();
      alert('Email wysłany pomyślnie!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas wysyłania emaila');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const deleteRequest = async (requestId: string) => {
    const confirmed = window.confirm('Na pewno usunąć to zapytanie? Tej operacji nie można cofnąć.');
    if (!confirmed) return;

    setDeletingId(requestId);
    try {
      await axios.delete(`${API_URL}/requests/${requestId}`);
      setRequests((prev) => prev.filter((request) => request._id !== requestId));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Nie udało się usunąć zapytania');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: { [key: string]: string } = {
      pending: 'Oczekujące',
      processed: 'Przetworzone',
      sent: 'Wysłane',
    };
    const colors: { [key: string]: string } = {
      pending: '#f39c12',
      processed: '#3498db',
      sent: '#27ae60',
    };
    return (
      <span
        style={{
          padding: '5px 10px',
          borderRadius: '4px',
          backgroundColor: colors[status],
          color: 'white',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        {statuses[status]}
      </span>
    );
  };

  const renderRequestDetails = (request: Request) => {
    if (request.requestMode === 'manual') {
      return (
        <div className={styles.detailsBlock}>
          <p className={styles.detailCaption}>Tryb: opis wolny</p>
          <p className={styles.detailText}>{request.manualDetails || '—'}</p>
          {request.needsConsultation && (
            <p className={styles.detailBadge}>Prośba o kontakt telefoniczny</p>
          )}
        </div>
      );
    }

    return (
      <div className={styles.detailsBlock}>
        <p className={styles.detailCaption}>Tryb: formularz prowadzony</p>
        {request.guidedItems && request.guidedItems.length > 0 ? (
          <ul className={styles.detailsList}>
            {request.guidedItems.map((item, index) => (
              <li key={`${request._id}-item-${index}`} className={styles.detailsItem}>
                <strong>{item.useCase}</strong>
                <div className={styles.detailLine}>
                  {item.styrofoamType?.name || item.styrofoamName || 'Typ nieznany'}
                </div>
                <div className={styles.detailLine}>
                  {item.thicknessCm ? `${item.thicknessCm} cm` : 'Grubość —'} |{' '}
                  {item.areaM2 ? `${item.areaM2} m²` : 'Powierzchnia —'} |{' '}
                  {item.volumeM3 ? `${item.volumeM3.toFixed(2)} m³` : 'Objętość —'}
                </div>
                {item.notes && <div className={styles.detailNote}>Uwagi: {item.notes}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.detailText}>Brak pozycji</p>
        )}
        {request.notes && <div className={styles.detailNote}>Uwagi klienta: {request.notes}</div>}
        {request.needsConsultation && (
          <p className={styles.detailBadge}>Prośba o kontakt telefoniczny</p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Zarządzanie zapytaniami</h2>
      <p className={styles.subtitle}>Liczba zapytań: {requests.length}</p>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Imię i nazwisko</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Kod pocztowy</th>
              <th>Zapotrzebowanie</th>
              <th>Metry / m³</th>
              <th>Status</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td>{formatDate(request.createdAt)}</td>
                <td>{request.name}</td>
                <td>{request.email}</td>
                <td>{request.phone || '-'}</td>
                <td>{request.postalCode}</td>
                <td>{renderRequestDetails(request)}</td>
                <td>
                  <div className={styles.metricsCell}>
                    <span>
                      m³:{' '}
                      {request.totalVolumeM3 !== undefined
                        ? request.totalVolumeM3.toFixed(2)
                        : request.guidedItems?.length
                        ? '0.00'
                        : '—'}
                    </span>
                    <span>m²: {request.quantity !== undefined ? request.quantity : '—'}</span>
                  </div>
                </td>
                <td>{getStatusBadge(request.status)}</td>
                <td>
                  {request.status !== 'sent' && (
                    <button
                      onClick={() => sendEmail(request._id)}
                      disabled={processingId === request._id}
                      className={styles.actionButton}
                    >
                      {processingId === request._id ? 'Wysyłanie...' : 'Wyślij email'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteRequest(request._id)}
                    disabled={deletingId === request._id}
                    className={styles.deleteButton}
                    style={{ opacity: deletingId === request._id ? 0.7 : 1, marginTop: 8 }}
                  >
                    {deletingId === request._id ? 'Usuwanie...' : 'Usuń'}
                  </button>
                  {request.emailSentAt && (
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      Wysłano: {formatDate(request.emailSentAt)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


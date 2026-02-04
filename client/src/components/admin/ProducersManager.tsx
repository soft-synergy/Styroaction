'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Manager.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.styroaction.pl/api';

interface Producer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface ProducersManagerProps {
  token: string;
}

export default function ProducersManager({ token }: ProducersManagerProps) {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchProducers();
  }, []);

  const fetchProducers = async () => {
    try {
      const response = await axios.get(`${API_URL}/producers`);
      setProducers(response.data);
    } catch (error) {
      console.error('Error fetching producers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProducer) {
        await axios.put(`${API_URL}/producers/${editingProducer._id}`, formData);
      } else {
        await axios.post(`${API_URL}/producers`, formData);
      }
      await fetchProducers();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleEdit = (producer: Producer) => {
    setEditingProducer(producer);
    setFormData({
      name: producer.name,
      email: producer.email || '',
      phone: producer.phone || '',
      address: producer.address || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego producenta?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/producers/${id}`);
      await fetchProducers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas usuwania');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '' });
    setEditingProducer(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Zarządzanie producentami</h2>
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Dodaj producenta
        </button>
      </div>

      {showForm && (
        <div className={styles.formModal}>
          <div className={styles.formContent}>
            <h3>{editingProducer ? 'Edytuj producenta' : 'Dodaj producenta'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nazwa *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Telefon *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Adres</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Zapisz
                </button>
                <button type="button" onClick={resetForm} className={styles.cancelButton}>
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Adres</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {producers.map((producer) => (
              <tr key={producer._id}>
                <td>{producer.name}</td>
                <td>{producer.email || '-'}</td>
                <td>{producer.phone || '-'}</td>
                <td>{producer.address || '-'}</td>
                <td>
                  <button
                    onClick={() => handleEdit(producer)}
                    className={styles.editButton}
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(producer._id)}
                    className={styles.deleteButton}
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


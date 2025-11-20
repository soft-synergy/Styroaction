'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Manager.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.styroaction.pl/api';

interface Price {
  _id: string;
  producer: {
    _id: string;
    name: string;
  };
  styrofoamType: {
    _id: string;
    name: string;
  };
  price: number;
  unit: string;
  currency: string;
  validFrom: string;
  validTo?: string;
  notes?: string;
}

interface Producer {
  _id: string;
  name: string;
}

interface StyrofoamType {
  _id: string;
  name: string;
}

interface PricesManagerProps {
  token: string;
}

export default function PricesManager({ token }: PricesManagerProps) {
  const [prices, setPrices] = useState<Price[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [types, setTypes] = useState<StyrofoamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Price | null>(null);
  const [formData, setFormData] = useState({
    producer: '',
    styrofoamType: '',
    price: '',
    unit: 'm2',
    currency: 'PLN',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pricesRes, producersRes, typesRes] = await Promise.all([
        axios.get(`${API_URL}/prices`),
        axios.get(`${API_URL}/producers`),
        axios.get(`${API_URL}/styrofoam-types`),
      ]);
      setPrices(pricesRes.data);
      setProducers(producersRes.data);
      setTypes(typesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        validTo: formData.validTo || undefined,
      };
      if (editingPrice) {
        await axios.put(`${API_URL}/prices/${editingPrice._id}`, submitData);
      } else {
        await axios.post(`${API_URL}/prices`, submitData);
      }
      await fetchData();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleEdit = (price: Price) => {
    setEditingPrice(price);
    setFormData({
      producer: price.producer._id,
      styrofoamType: price.styrofoamType._id,
      price: price.price.toString(),
      unit: price.unit,
      currency: price.currency,
      validFrom: new Date(price.validFrom).toISOString().split('T')[0],
      validTo: price.validTo ? new Date(price.validTo).toISOString().split('T')[0] : '',
      notes: price.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę cenę?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/prices/${id}`);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas usuwania');
    }
  };

  const resetForm = () => {
    setFormData({
      producer: '',
      styrofoamType: '',
      price: '',
      unit: 'm2',
      currency: 'PLN',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      notes: '',
    });
    setEditingPrice(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Zarządzanie cenami</h2>
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Dodaj cenę
        </button>
      </div>

      {showForm && (
        <div className={styles.formModal}>
          <div className={styles.formContent}>
            <h3>{editingPrice ? 'Edytuj cenę' : 'Dodaj cenę'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Producent *</label>
                <select
                  value={formData.producer}
                  onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                  required
                >
                  <option value="">Wybierz producenta</option>
                  {producers.map((producer) => (
                    <option key={producer._id} value={producer._id}>
                      {producer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Rodzaj styropianu *</label>
                <select
                  value={formData.styrofoamType}
                  onChange={(e) => setFormData({ ...formData, styrofoamType: e.target.value })}
                  required
                >
                  <option value="">Wybierz rodzaj</option>
                  {types.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Cena *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Jednostka</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="m2">m²</option>
                  <option value="m3">m³</option>
                  <option value="szt">szt</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Waluta</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Obowiązuje od</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Obowiązuje do (opcjonalnie)</label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Uwagi</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
              <th>Producent</th>
              <th>Rodzaj styropianu</th>
              <th>Cena</th>
              <th>Jednostka</th>
              <th>Waluta</th>
              <th>Obowiązuje od</th>
              <th>Obowiązuje do</th>
              <th>Uwagi</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <tr key={price._id}>
                <td>{price.producer.name}</td>
                <td>{price.styrofoamType.name}</td>
                <td>{price.price.toFixed(2)}</td>
                <td>{price.unit}</td>
                <td>{price.currency}</td>
                <td>{new Date(price.validFrom).toLocaleDateString('pl-PL')}</td>
                <td>{price.validTo ? new Date(price.validTo).toLocaleDateString('pl-PL') : '-'}</td>
                <td>{price.notes || '-'}</td>
                <td>
                  <button
                    onClick={() => handleEdit(price)}
                    className={styles.editButton}
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(price._id)}
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


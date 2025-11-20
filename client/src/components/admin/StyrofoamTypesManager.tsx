'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Manager.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.styroaction.pl/api';

interface StyrofoamType {
  _id: string;
  name: string;
  description?: string;
  thickness?: string;
  density?: string;
  useCases?: string[];
}

const USE_CASE_OPTIONS = [
  { value: 'floor-heated', label: 'Podłoga ogrzewana (podłogowy)' },
  { value: 'floor-standard', label: 'Podłoga bez ogrzewania' },
  { value: 'foundation', label: 'Fundament / płyta fundamentowa' },
  { value: 'wall', label: 'Ściana zewnętrzna (fasada)' },
  { value: 'roof', label: 'Dach / strop' },
  { value: 'other', label: 'Inne' },
];

interface StyrofoamTypesManagerProps {
  token: string;
}

export default function StyrofoamTypesManager({ token }: StyrofoamTypesManagerProps) {
  const [types, setTypes] = useState<StyrofoamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<StyrofoamType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thickness: '',
    density: '',
    useCases: [] as string[],
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/styrofoam-types`);
      setTypes(response.data);
    } catch (error) {
      console.error('Error fetching types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await axios.put(`${API_URL}/styrofoam-types/${editingType._id}`, formData);
      } else {
        await axios.post(`${API_URL}/styrofoam-types`, formData);
      }
      await fetchTypes();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleEdit = (type: StyrofoamType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      thickness: type.thickness || '',
      density: type.density || '',
      useCases: type.useCases || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten rodzaj styropianu?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/styrofoam-types/${id}`);
      await fetchTypes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd podczas usuwania');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', thickness: '', density: '', useCases: [] });
    setEditingType(null);
    setShowForm(false);
  };

  const toggleUseCase = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(value)
        ? prev.useCases.filter((uc) => uc !== value)
        : [...prev.useCases, value],
    }));
  };

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Zarządzanie rodzajami styropianu</h2>
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Dodaj rodzaj
        </button>
      </div>

      {showForm && (
        <div className={styles.formModal}>
          <div className={styles.formContent}>
            <h3>{editingType ? 'Edytuj rodzaj styropianu' : 'Dodaj rodzaj styropianu'}</h3>
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
                <label>Opis</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Grubość</label>
                <input
                  type="text"
                  value={formData.thickness}
                  onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                  placeholder="np. 10cm, 15cm"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Gęstość</label>
                <input
                  type="text"
                  value={formData.density}
                  onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                  placeholder="np. 15kg/m³, 20kg/m³"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Zastosowanie (do czego jest potrzebny)</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                    marginTop: '8px',
                  }}
                >
                  {USE_CASE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: formData.useCases.includes(option.value)
                          ? '#e3f2fd'
                          : 'white',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.useCases.includes(option.value)}
                        onChange={() => toggleUseCase(option.value)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px' }}>{option.label}</span>
                    </label>
                  ))}
                </div>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Możesz wybrać kilka opcji. To pomoże w sugerowaniu odpowiedniego typu styropianu.
                </p>
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
              <th>Opis</th>
              <th>Grubość</th>
              <th>Gęstość</th>
              <th>Zastosowanie</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type._id}>
                <td>{type.name}</td>
                <td>{type.description || '-'}</td>
                <td>{type.thickness || '-'}</td>
                <td>{type.density || '-'}</td>
                <td>
                  {type.useCases && type.useCases.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {type.useCases.map((uc) => {
                        const option = USE_CASE_OPTIONS.find((o) => o.value === uc);
                        return (
                          <span
                            key={uc}
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              backgroundColor: '#e3f2fd',
                              borderRadius: '3px',
                              color: '#1976d2',
                            }}
                          >
                            {option?.label || uc}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(type)}
                    className={styles.editButton}
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
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


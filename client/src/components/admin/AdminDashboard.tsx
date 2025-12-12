'use client';

import { useState } from 'react';
import ProducersManager from './ProducersManager';
import StyrofoamTypesManager from './StyrofoamTypesManager';
import PricesManager from './PricesManager';
import RequestsManager from './RequestsManager';
import AnalyticsManager from './AnalyticsManager';
import PriceListRequestsManager from './PriceListRequestsManager';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

type Tab = 'requests' | 'producers' | 'types' | 'prices' | 'analytics' | 'price-list-requests';

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('requests');

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel Administracyjny</h1>
        <button onClick={onLogout} className={styles.logoutButton}>
          Wyloguj
        </button>
      </header>

      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${activeTab === 'requests' ? styles.active : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Zapytania
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'producers' ? styles.active : ''}`}
          onClick={() => setActiveTab('producers')}
        >
          Producenci
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'types' ? styles.active : ''}`}
          onClick={() => setActiveTab('types')}
        >
          Rodzaje styropianu
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'prices' ? styles.active : ''}`}
          onClick={() => setActiveTab('prices')}
        >
          Ceny
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analityka A/B
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'price-list-requests' ? styles.active : ''}`}
          onClick={() => setActiveTab('price-list-requests')}
        >
          Zapytania o cenniki
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'requests' && <RequestsManager token={token} />}
        {activeTab === 'producers' && <ProducersManager token={token} />}
        {activeTab === 'types' && <StyrofoamTypesManager token={token} />}
        {activeTab === 'prices' && <PricesManager token={token} />}
        {activeTab === 'analytics' && <AnalyticsManager token={token} />}
        {activeTab === 'price-list-requests' && <PriceListRequestsManager token={token} />}
      </main>
    </div>
  );
}


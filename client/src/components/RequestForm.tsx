'use client';

import { useMemo, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackGAEvent } from '@/lib/analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const USE_CASES = [
  { value: 'floor-heated', label: 'Podłoga ogrzewana (podłogowy)' },
  { value: 'floor-standard', label: 'Podłoga bez ogrzewania' },
  { value: 'foundation', label: 'Fundament / płyta fundamentowa' },
  { value: 'wall', label: 'Ściana zewnętrzna (fasada)' },
  { value: 'roof', label: 'Dach / strop' },
  { value: 'other', label: 'Inne / opiszę' },
] as const;

const MANUAL_TYPE_VALUE = '__manual__';

interface StyrofoamType {
  _id: string;
  name: string;
  description?: string;
  thickness?: string;
  density?: string;
}

interface RequestFormProps {
  styrofoamTypes: StyrofoamType[];
  variant: string;
  onSubmit: () => void;
  onCancel: () => void;
}

type RequestMode = 'guided' | 'manual';

type GuidedItemForm = {
  id: string;
  useCase: (typeof USE_CASES)[number]['value'] | '';
  customUseCase: string;
  manualType: boolean;
  styrofoamTypeId: string;
  styrofoamName: string;
  thicknessCm: string;
  areaM2: string;
  notes: string;
};

const createEmptyGuidedItem = (): GuidedItemForm => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  useCase: '',
  customUseCase: '',
  manualType: false,
  styrofoamTypeId: '',
  styrofoamName: '',
  thicknessCm: '',
  areaM2: '',
  notes: '',
});

const normalizeNumber = (value: string): number | undefined => {
  if (!value) return undefined;
  const normalized = value.replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const calculateVolume = (area?: number, thickness?: number): number | undefined => {
  if (area === undefined || thickness === undefined) return undefined;
  const volume = (area * thickness) / 100;
  return Number.isFinite(volume) ? volume : undefined;
};

const getUseCaseLabel = (useCase: GuidedItemForm['useCase'], customText: string) => {
  if (useCase === 'other') {
    return customText.trim() || 'Inne';
  }
  const found = USE_CASES.find((option) => option.value === useCase);
  return found?.label ?? '';
};

export default function RequestForm({ styrofoamTypes, variant, onSubmit, onCancel }: RequestFormProps) {
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    postalCode: '',
    quantity: '',
  });
  const [requestMode, setRequestMode] = useState<RequestMode>('guided');
  const [guidedItems, setGuidedItems] = useState<GuidedItemForm[]>([createEmptyGuidedItem()]);
  const [manualDetails, setManualDetails] = useState('');
  const [needsConsultation, setNeedsConsultation] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateGuidedItem = (id: string, updates: Partial<GuidedItemForm>) => {
    setGuidedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...updates,
          ...(updates.useCase && updates.useCase !== 'other'
            ? { customUseCase: '' }
            : {}),
        };
      })
    );
  };

  const addGuidedItem = () => {
    setGuidedItems((prev) => [...prev, createEmptyGuidedItem()]);
  };

  const removeGuidedItem = (id: string) => {
    setGuidedItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const computedItems = useMemo(() => {
    return guidedItems.map((item) => {
      const area = normalizeNumber(item.areaM2);
      const thickness = normalizeNumber(item.thicknessCm);
      const volume = calculateVolume(area, thickness);
      return {
        ...item,
        areaValue: area,
        thicknessValue: thickness,
        volumeValue: volume,
      };
    });
  }, [guidedItems]);

  const totalVolume = useMemo(() => {
    return computedItems.reduce((sum, item) => sum + (item.volumeValue ?? 0), 0);
  }, [computedItems]);

  const trackAnalytics = async (eventType: 'submit_form') => {
    try {
      await axios.post(`${API_URL}/analytics/event`, {
        eventType,
        variant,
      });
    } catch (analyticsError) {
      console.warn('Failed to log analytics event', analyticsError);
    }
  };

  const trackGA = (action: string, category: string = 'conversion', label?: string) => {
    trackGAEvent(action, category, label ? `${label} (variant: ${variant})` : `variant: ${variant}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (requestMode === 'manual' && !manualDetails.trim()) {
        throw new Error('Opisz w kilku zdaniach czego szukasz – konsultant zadzwoni i dokończy za Ciebie.');
      }

      const preparedGuidedItems =
        requestMode === 'guided'
          ? computedItems
              .map((item) => {
                const useCaseLabel = getUseCaseLabel(item.useCase, item.customUseCase);
                const styrofoamTypeId = item.manualType ? undefined : item.styrofoamTypeId || undefined;
                const styrofoamName =
                  item.manualType ? item.styrofoamName || undefined : undefined;
                const hasContent =
                  useCaseLabel ||
                  styrofoamTypeId ||
                  styrofoamName ||
                  item.areaValue !== undefined ||
                  item.thicknessValue !== undefined;

                if (!hasContent) {
                  return null;
                }

                return {
                  useCase: useCaseLabel || 'Bez nazwy',
                  styrofoamType: styrofoamTypeId,
                  styrofoamName,
                  thicknessCm: item.thicknessValue,
                  areaM2: item.areaValue,
                  volumeM3: item.volumeValue !== undefined ? Number(item.volumeValue.toFixed(3)) : undefined,
                  notes: item.notes || undefined,
                };
              })
              .filter((item): item is NonNullable<typeof item> => item !== null)
          : undefined;

      if (requestMode === 'guided' && (!preparedGuidedItems || preparedGuidedItems.length === 0)) {
        throw new Error('Dodaj przynajmniej jedną pozycję ze styropianem.');
      }

      const primaryStyrofoamType =
        preparedGuidedItems?.find((item) => item.styrofoamType)?.styrofoamType || undefined;

      const requestPayload = {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || undefined,
        company: contactData.company || undefined,
        postalCode: contactData.postalCode,
        styrofoamType: primaryStyrofoamType,
        quantity: contactData.quantity ? parseFloat(contactData.quantity) : undefined,
        requestMode,
        guidedItems: preparedGuidedItems,
        manualDetails: requestMode === 'manual' ? manualDetails : manualDetails || undefined,
        needsConsultation,
        totalVolumeM3:
          requestMode === 'guided' && totalVolume > 0 ? Number(totalVolume.toFixed(3)) : undefined,
        notes: notes || undefined,
      };

      await axios.post(`${API_URL}/requests`, requestPayload);
      await trackAnalytics('submit_form');
      
      // Track GA event with form details
      const formDetails = {
        mode: requestMode,
        itemsCount: requestMode === 'guided' ? (preparedGuidedItems?.length || 0) : 0,
        hasVolume: totalVolume > 0,
        totalVolume: totalVolume > 0 ? Math.round(totalVolume) : 0,
      };
      trackGA('submit_form', 'conversion', JSON.stringify(formDetails));
      
      onSubmit();
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Coś poszło nie tak. Spróbuj jeszcze raz.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border-4 border-red-500 rounded-lg p-6 text-red-800 text-lg font-semibold">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">1. Jak chcesz to opisać?</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Button
              type="button"
              variant={requestMode === 'guided' ? 'default' : 'outline'}
              onClick={() => {
                setRequestMode('guided');
                trackGA('form_mode_selected', 'conversion', 'guided_mode');
                trackGA('form_started', 'conversion', 'form_interaction_started');
              }}
              className={`h-auto py-6 text-lg ${
                requestMode === 'guided'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'border-2 border-blue-200 text-blue-900'
              }`}
            >
              Poprowadź mnie krok po kroku
              <span className={`block text-sm font-normal ${
                requestMode === 'guided' ? 'text-blue-100' : 'text-blue-700'
              }`}>
                Wybierz zastosowanie, typ i metry
              </span>
            </Button>
            <Button
              type="button"
              variant={requestMode === 'manual' ? 'default' : 'outline'}
              onClick={() => {
                setRequestMode('manual');
                trackGA('form_mode_selected', 'conversion', 'manual_mode');
                trackGA('form_started', 'conversion', 'form_interaction_started');
              }}
              className={`h-auto py-6 text-lg ${
                requestMode === 'manual'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'border-2 border-blue-200 text-blue-900'
              }`}
            >
              Wolę napisać po swojemu
              <span className={`block text-sm font-normal ${
                requestMode === 'manual' ? 'text-blue-100' : 'text-blue-700'
              }`}>
                Konsultant przeczyta i zadzwoni
              </span>
            </Button>
          </div>
        </div>

        {requestMode === 'guided' ? (
          <div className="bg-white border-2 border-blue-200 rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">2. Twoje zapotrzebowanie</h3>
              <p className="mt-2 text-base text-gray-700">
                Dodaj pomieszczenia lub elementy. Jeśli coś jest niejasne – zaznacz &quot;Inne&quot; i
                wpisz własny opis.
              </p>
            </div>

            <div className="space-y-6">
              {computedItems.map((item, index) => {
                const selectValue = guidedItems[index].manualType
                  ? MANUAL_TYPE_VALUE
                  : guidedItems[index].styrofoamTypeId;
                const showManualInput = guidedItems[index].manualType;
                const volumeLabel =
                  item.volumeValue !== undefined ? `${item.volumeValue.toFixed(2)} m³` : '—';

                return (
                  <div
                    key={item.id}
                    className="border-2 border-blue-100 rounded-xl p-5 bg-blue-50 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-blue-900">
                          Pozycja {index + 1}
                        </p>
                        <p className="text-sm text-blue-700">
                          Wypełnij tyle, ile wiesz. Resztę dobierzemy z Tobą.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeGuidedItem(item.id)}
                        disabled={guidedItems.length === 1}
                        className="text-sm h-10 px-4 border-blue-200 text-blue-900"
                      >
                        Usuń
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-base font-semibold text-blue-900">
                          Do czego potrzebny styropian?
                        </Label>
                        <Select
                          value={item.useCase}
                          onChange={(event) =>
                            updateGuidedItem(item.id, {
                              useCase: event.target.value as GuidedItemForm['useCase'],
                            })
                          }
                          className="text-lg h-14 border-blue-300"
                        >
                          <option value="">Wybierz z listy</option>
                          {USE_CASES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                        {item.useCase === 'other' && (
                          <Input
                            type="text"
                            value={guidedItems[index].customUseCase}
                            onChange={(event) =>
                              updateGuidedItem(item.id, { customUseCase: event.target.value })
                            }
                            placeholder="Np. styropian pod garaż, styropian pod taras"
                            className="mt-3 text-lg h-14 border-blue-300"
                          />
                        )}
                      </div>

                      <div>
                        <Label className="text-base font-semibold text-blue-900">
                          Jaki typ ma być?
              </Label>
              <Select
                          value={selectValue}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value === MANUAL_TYPE_VALUE) {
                              updateGuidedItem(item.id, {
                                manualType: true,
                                styrofoamTypeId: '',
                              });
                            } else {
                              updateGuidedItem(item.id, {
                                manualType: false,
                                styrofoamTypeId: value,
                                styrofoamName: '',
                              });
                            }
                          }}
                          className="text-lg h-14 border-blue-300"
              >
                          <option value="">Wybierz z listy</option>
                {styrofoamTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
                          <option value={MANUAL_TYPE_VALUE}>Nie wiem / wpiszę sam</option>
              </Select>
                        {showManualInput && (
                          <Input
                            type="text"
                            value={guidedItems[index].styrofoamName}
                            onChange={(event) =>
                              updateGuidedItem(item.id, { styrofoamName: event.target.value })
                            }
                            placeholder="Np. EPS 100 5 cm, grafitowy 15 cm"
                            className="mt-3 text-lg h-14 border-blue-300"
                          />
                        )}
                      </div>

                      <div>
                        <Label className="text-base font-semibold text-blue-900">
                          Grubość (cm)
                        </Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={guidedItems[index].thicknessCm}
                          onChange={(event) =>
                            updateGuidedItem(item.id, { thicknessCm: event.target.value })
                          }
                          placeholder="Np. 5"
                          className="text-lg h-14 border-blue-300"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-semibold text-blue-900">
                          Powierzchnia (m²)
                        </Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={guidedItems[index].areaM2}
                          onChange={(event) =>
                            updateGuidedItem(item.id, { areaM2: event.target.value })
                          }
                          placeholder="Np. 120"
                          className="text-lg h-14 border-blue-300"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold text-blue-900">
                        Dodatkowe informacje (opcjonalnie)
                      </Label>
                      <textarea
                        value={guidedItems[index].notes}
                        onChange={(event) =>
                            updateGuidedItem(item.id, { notes: event.target.value })
                        }
                        placeholder="Np. musi być frezowany, docięty, transport na plac budowy"
                        className="mt-2 w-full rounded-lg border-2 border-blue-200 bg-white p-3 text-base text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-base font-semibold text-blue-900">
                        Wyjdzie około: <span className="text-blue-800">{volumeLabel}</span>
                      </p>
                      <p className="text-sm text-blue-700">
                        Liczymy objętość = m² × grubość / 100. Możesz zostawić puste.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Button
                type="button"
                onClick={addGuidedItem}
                className="text-lg h-auto py-4 px-6 bg-blue-600 hover:bg-blue-700"
              >
                + Dodaj kolejną pozycję
              </Button>
              <div className="text-lg font-semibold text-blue-900">
                Łącznie: {totalVolume > 0 ? totalVolume.toFixed(2) : '0.00'} m³
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold text-blue-900">
                Dodatkowe uwagi (opcjonalnie)
              </Label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Np. potrzebuję też kleje i siatkę, transport na koniec miesiąca itp."
                className="mt-2 w-full rounded-lg border-2 border-blue-200 bg-white p-3 text-base text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-blue-200 rounded-lg p-6 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">2. Opisz, czego potrzebujesz</h3>
            <p className="text-base text-gray-700">
              Napisz wszystko, co wiesz. Konsultant przeczyta, oddzwoni i sam uzupełni resztę.
            </p>
            <textarea
              value={manualDetails}
              onChange={(event) => setManualDetails(event.target.value)}
              placeholder="Np. potrzebuję styropian podłogowy 5 cm pod ogrzewanie, około 120 m². Wysyłka do powiatu łęczyńskiego."
              className="w-full rounded-lg border-2 border-blue-200 bg-white p-4 text-base text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
            />
            <div className="flex items-start gap-3 text-base text-gray-700">
              <input
                id="manual-consultation"
                type="checkbox"
                checked={needsConsultation}
                onChange={(event) => setNeedsConsultation(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-2 border-blue-400 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="manual-consultation" className="text-base text-gray-800 font-medium">
                Zadzwońcie do mnie, pomożecie dobrać wszystko krok po kroku
              </Label>
          </div>
        </div>
        )}

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">3. Gdzie mamy sprawdzić dostępność?</h3>
          <div>
            <Label htmlFor="postalCode" className="text-lg font-semibold text-gray-900 mb-2 block">
              Kod pocztowy (np. 00-000) *
            </Label>
            <Input
              type="text"
              id="postalCode"
              name="postalCode"
              value={contactData.postalCode}
              onChange={handleContactChange}
              placeholder="00-000"
              pattern="[0-9]{2}-[0-9]{3}"
              required
              className="text-lg h-14 border-2 border-gray-300"
            />
            <p className="mt-2 text-sm text-gray-600">
              Dzięki temu znajdziemy fabryki i składy najbliżej Ciebie.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">4. Twoje dane kontaktowe</h3>
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-lg font-semibold text-gray-900 mb-2 block">
                Imię i nazwisko *
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={contactData.name}
                onChange={handleContactChange}
                placeholder="Jan Kowalski"
                required
                className="text-lg h-14 border-2 border-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-lg font-semibold text-gray-900 mb-2 block">
                Email (tam wyślemy ceny) *
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={contactData.email}
                onChange={handleContactChange}
                placeholder="jan@example.com"
                required
                className="text-lg h-14 border-2 border-gray-300"
              />
              <div className="mt-3 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  📧 Podaj email, który regularnie sprawdzasz
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Wyślemy tabelę z cenami od wszystkich producentów</li>
                  <li>Dostaniesz maila w ciągu kilku godzin</li>
                  <li>Zero spamu – tylko konkretne oferty cenowe</li>
                  <li>Możesz porównać i wybrać najlepszą cenę</li>
                </ul>
                <p className="text-xs text-blue-700 mt-3 italic">
                  Jeśli podasz nieprawdziwy email, nie dostaniesz cen i stracisz szansę na oszczędności.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-lg font-semibold text-gray-900 mb-2 block">
                Telefon (opcjonalnie)
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={contactData.phone}
                onChange={handleContactChange}
                placeholder="123 456 789"
                className="text-lg h-14 border-2 border-gray-300"
              />
              <p className="mt-2 text-sm text-gray-600">
                Podaj jeśli chcesz, żeby konsultant zadzwonił w razie pytań.
              </p>
            </div>

            <div>
              <Label htmlFor="company" className="text-lg font-semibold text-gray-900 mb-2 block">
                Firma (jeśli kupujesz dla firmy)
              </Label>
              <Input
                type="text"
                id="company"
                name="company"
                value={contactData.company}
                onChange={handleContactChange}
                placeholder="Nazwa firmy (opcjonalnie)"
                className="text-lg h-14 border-2 border-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="quantity" className="text-lg font-semibold text-gray-900 mb-2 block">
                Masz już policzone metry? (opcjonalnie)
              </Label>
              <Input
                type="number"
                id="quantity"
                name="quantity"
                value={contactData.quantity}
                onChange={handleContactChange}
                min="0"
                step="0.01"
                placeholder="Np. 120 (m²)"
                className="text-lg h-14 border-2 border-gray-300"
              />
              <p className="mt-2 text-sm text-gray-600">
                Jeśli masz podsumowanie od architekta – wpisz tutaj. My i tak wszystko przeliczymy.
              </p>
            </div>

            {requestMode === 'guided' && (
              <div className="flex items-start gap-3 text-base text-gray-700">
                <input
                  id="guided-consultation"
                  type="checkbox"
                  checked={needsConsultation}
                  onChange={(event) => setNeedsConsultation(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-2 border-blue-400 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="guided-consultation"
                  className="text-base text-gray-800 font-medium"
                >
                  Zadzwońcie do mnie, jeśli trzeba doprecyzować zamówienie
                </Label>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full text-xl py-8 h-auto bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg"
          >
            {loading ? 'Wysyłanie...' : 'WYŚLIJ ZAPYTANIE'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            disabled={loading}
            className="w-full text-lg py-6 h-auto border-2 border-gray-300"
          >
            Anuluj
          </Button>
        </div>

        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            ⚡ Wysyłamy ceny w kilka godzin • 💰 Porównujemy fabryki i składy • 🤝 Zero zobowiązań
          </p>
        </div>
      </form>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-lg p-8">
          <DialogHeader className="space-y-4 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Anulować formularz?
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700 leading-relaxed">
              Nie ogarniasz co tu się dzieje? Możemy przejść na prostszy formularz tekstowy – napisz
              po swojemu, a konsultant zadzwoni i dokończy za Ciebie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                onCancel();
              }}
              className="w-full sm:w-auto border-2 border-gray-300 hover:bg-gray-50"
            >
              Nie, anuluj całkowicie
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowCancelDialog(false);
                setRequestMode('manual');
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Tak, przejdź na formularz tekstowy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

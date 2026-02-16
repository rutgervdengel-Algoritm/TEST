/**
 * Component Template - WachtlijstHelderheid
 *
 * Gebruik dit als startpunt voor nieuwe componenten.
 * Kopieer, hernoem, en pas aan.
 *
 * Regels:
 * - Max 200 regels per component
 * - Props altijd getypt via interface
 * - Async operaties: loading + error state
 * - Nederlandse UI teksten
 */

import { useState } from 'react';
// import type { WaitlistEntry } from '../types';

// ============================================
// Types
// ============================================

interface TemplateComponentProps {
  /** Titel die bovenaan wordt getoond */
  title: string;
  /** Callback wanneer de actie is voltooid */
  onComplete?: () => void;
}

// ============================================
// Constants
// ============================================

// Gebruik constants voor waarden die op meerdere plekken voorkomen
// const MAX_ITEMS = 10;

// ============================================
// Component
// ============================================

export default function TemplateComponent({ title, onComplete }: TemplateComponentProps) {
  // --- State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Handlers ---
  async function handleAction() {
    setLoading(true);
    setError(null);

    try {
      // await api.doSomething();
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4">
        <p className="text-gray-600">Vervang dit met je component content.</p>

        <button onClick={handleAction} className="btn-primary mt-4">
          Actie uitvoeren
        </button>
      </div>
    </div>
  );
}

// ============================================
// Sub-components (alleen als ze < 50 regels zijn)
// Anders: maak een apart bestand
// ============================================

// function SubComponent({ label }: { label: string }) {
//   return <span className="text-sm text-gray-500">{label}</span>;
// }

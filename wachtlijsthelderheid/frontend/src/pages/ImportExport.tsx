import { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { importExportApi, getAuthToken, seedApi } from '../utils/api';
import type { ImportResult } from '../types';

// Icons
const Icons = {
  download: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  upload: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  file: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  database: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  trash: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

export default function ImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const [loadingDemo, setLoadingDemo] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState('');

  function handleExport() {
    const token = getAuthToken();
    const url = importExportApi.exportWaitlist();

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `wachtlijst-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      })
      .catch(err => {
        console.error('Export error:', err);
        setError('Export mislukt');
      });
  }

  function handleDownloadTemplate() {
    const token = getAuthToken();
    const url = importExportApi.getImportTemplate();

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'wachtlijst-import-template.csv';
        link.click();
      })
      .catch(err => {
        console.error('Template download error:', err);
        setError('Template download mislukt');
      });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Alleen CSV bestanden zijn toegestaan');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
      setImportResult(null);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const result = await importExportApi.importWaitlist(selectedFile);
      setImportResult(result);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import mislukt');
    } finally {
      setImporting(false);
    }
  }

  async function handleLoadDemo() {
    setLoadingDemo(true);
    setError('');
    setDemoSuccess('');

    try {
      const result = await seedApi.loadDemo();
      setDemoSuccess(result.message || `Demo data geladen: ${result.created?.entries || 0} inschrijvingen`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo data laden mislukt');
    } finally {
      setLoadingDemo(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setError('');
    setDemoSuccess('');

    try {
      await seedApi.reset();
      setDemoSuccess('Alle data is gereset');
      setShowResetConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset mislukt');
    } finally {
      setResetting(false);
    }
  }

  return (
    <Layout title="Import / Export">
      <div className="max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-terracotta-50 border border-terracotta-200 text-terracotta-700 rounded-xl flex items-center gap-3">
            <span className="text-terracotta-500">{Icons.warning}</span>
            {error}
          </div>
        )}

        {demoSuccess && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl flex items-center gap-3">
            <span className="text-teal-500">{Icons.check}</span>
            {demoSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export section */}
          <div className="card">
            <div className="card-header bg-cream-50">
              <h2 className="font-serif font-bold text-forest-600 text-lg flex items-center gap-2">
                {Icons.download}
                Exporteren
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-navy-500 mb-4">
                Download de complete wachtlijst als CSV bestand. Dit bestand kan worden
                geopend in Excel of Google Sheets.
              </p>

              <button onClick={handleExport} className="btn-primary w-full flex items-center justify-center gap-2">
                {Icons.download}
                Exporteer wachtlijst
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="card">
            <div className="card-header bg-cream-50">
              <h2 className="font-serif font-bold text-forest-600 text-lg flex items-center gap-2">
                {Icons.upload}
                Importeren
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-navy-500 mb-4">
                Importeer inschrijvingen vanuit een CSV bestand. Download eerst de template
                om te zien welke kolommen nodig zijn.
              </p>

              <button
                onClick={handleDownloadTemplate}
                className="btn-outline w-full flex items-center justify-center gap-2 mb-4"
              >
                {Icons.file}
                Download template
              </button>

              <div className="border-2 border-dashed border-cream-300 rounded-xl p-4 hover:border-forest-300 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <span className="text-navy-300 mb-2">{Icons.upload}</span>
                  <span className="text-sm text-navy-500">
                    {selectedFile ? selectedFile.name : 'Klik om CSV te selecteren'}
                  </span>
                </label>
              </div>

              {selectedFile && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importeren...
                    </>
                  ) : (
                    <>
                      {Icons.upload}
                      Importeer bestand
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Import result */}
        {importResult && (
          <div className="card mt-6">
            <div className="card-header bg-cream-50">
              <h2 className="font-serif font-bold text-forest-600 text-lg">Import resultaat</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-teal-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-teal-700">{importResult.imported}</p>
                  <p className="text-sm text-teal-600">Geimporteerd</p>
                </div>
                <div className="p-4 bg-terracotta-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-terracotta-600">{importResult.skipped}</p>
                  <p className="text-sm text-terracotta-500">Overgeslagen</p>
                </div>
                <div className="p-4 bg-terracotta-100 rounded-xl text-center">
                  <p className="text-2xl font-bold text-terracotta-700">{importResult.errors.length}</p>
                  <p className="text-sm text-terracotta-600">Fouten</p>
                </div>
              </div>

              {importResult.duplicates.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-forest-600 mb-2">Duplicaten gevonden:</h3>
                  <div className="bg-terracotta-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {importResult.duplicates.map((dup, idx) => (
                      <p key={idx} className="text-sm text-terracotta-600">
                        Rij {dup.row}: {dup.reason} (bestaand ID: {dup.existingId})
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-forest-600 mb-2">Fouten:</h3>
                  <div className="bg-terracotta-100 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-terracotta-700">
                        Rij {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Demo data section */}
        <div className="card mt-6">
          <div className="card-header bg-cream-50">
            <h2 className="font-serif font-bold text-forest-600 text-lg flex items-center gap-2">
              {Icons.database}
              Demo & Test Data
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-navy-500 mb-4">
              Laad voorbeelddata om de applicatie te testen, of reset alle data om opnieuw te beginnen.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                className="btn-outline flex items-center justify-center gap-2"
              >
                {loadingDemo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forest-600"></div>
                    Laden...
                  </>
                ) : (
                  <>
                    {Icons.database}
                    Laad demo data
                  </>
                )}
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="btn-danger flex items-center justify-center gap-2"
              >
                {Icons.trash}
                Reset alle data
              </button>
            </div>

            <div className="mt-4 p-3 bg-forest-50 border border-forest-200 rounded-xl">
              <p className="text-sm text-forest-700">
                <strong>Demo data bevat:</strong> 25 realistische Nederlandse inschrijvingen met
                gevarieerde voorkeuren, prioriteiten en bevestigingsstatussen voor het testen van
                alle functionaliteiten.
              </p>
            </div>
          </div>
        </div>

        {/* Reset confirmation modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-forest-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full animate-fade-in">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-terracotta-500">{Icons.warning}</span>
                  <h3 className="text-lg font-serif font-bold text-forest-600">
                    Alle data resetten?
                  </h3>
                </div>
                <p className="text-navy-500 mb-6">
                  Dit verwijdert <strong className="text-forest-600">alle</strong> inschrijvingen, plekken, matches en
                  logboekregels. Deze actie kan niet ongedaan worden gemaakt.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="btn-outline flex-1"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="btn-danger flex-1"
                  >
                    {resetting ? 'Resetten...' : 'Ja, reset alles'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info about CSV format */}
        <div className="card mt-6">
          <div className="card-header bg-cream-50">
            <h2 className="font-serif font-bold text-forest-600 text-lg">CSV formaat informatie</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-navy-500 mb-4">
              Het CSV bestand moet de volgende kolommen bevatten:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-forest-600">Kolom</th>
                    <th className="px-4 py-2 text-left font-semibold text-forest-600">Verplicht</th>
                    <th className="px-4 py-2 text-left font-semibold text-forest-600">Beschrijving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">parent_name</td>
                    <td className="px-4 py-2 text-teal-600">Ja</td>
                    <td className="px-4 py-2 text-navy-500">Naam ouder/verzorger</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">parent_email</td>
                    <td className="px-4 py-2 text-navy-400">Nee</td>
                    <td className="px-4 py-2 text-navy-500">E-mailadres ouder</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">child_name</td>
                    <td className="px-4 py-2 text-teal-600">Ja</td>
                    <td className="px-4 py-2 text-navy-500">Naam kind</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">child_birthdate</td>
                    <td className="px-4 py-2 text-navy-400">Nee</td>
                    <td className="px-4 py-2 text-navy-500">Geboortedatum (YYYY-MM-DD)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">preferred_days</td>
                    <td className="px-4 py-2 text-teal-600">Ja</td>
                    <td className="px-4 py-2 text-navy-500">Gewenste dagen (MA,DI,WO,DO,VR)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">desired_start_date</td>
                    <td className="px-4 py-2 text-teal-600">Ja</td>
                    <td className="px-4 py-2 text-navy-500">Gewenste startdatum (YYYY-MM-DD)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">has_sibling</td>
                    <td className="px-4 py-2 text-navy-400">Nee</td>
                    <td className="px-4 py-2 text-navy-500">Broertje/zusje (true/false)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">single_parent</td>
                    <td className="px-4 py-2 text-navy-400">Nee</td>
                    <td className="px-4 py-2 text-navy-500">Alleenstaand ouder (true/false)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-forest-600">notes</td>
                    <td className="px-4 py-2 text-navy-400">Nee</td>
                    <td className="px-4 py-2 text-navy-500">Opmerkingen</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

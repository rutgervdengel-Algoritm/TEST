import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { parentApi, StandaloneRegistration, ConfirmationEmail, setAuthToken } from '../utils/api';

export default function ParentRegistrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState<StandaloneRegistration | null>(null);
  const [emails, setEmails] = useState<ConfirmationEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Email preview
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<{ to: string; subject: string; body: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Template editor
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [template, setTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Link access code
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('parentToken');
    if (!token) {
      navigate('/ouder/login');
      return;
    }
    setAuthToken(token);

    if (id) {
      loadRegistration(parseInt(id));
    }
  }, [id, navigate]);

  const loadRegistration = async (regId: number) => {
    try {
      setLoading(true);
      const result = await parentApi.getRegistration(regId);
      setRegistration(result.registration);
      setEmails(result.emails);
      setTemplate(result.registration.email_template || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon inschrijving niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreview = async () => {
    if (!id) return;
    try {
      setLoadingPreview(true);
      const result = await parentApi.getEmailPreview(parseInt(id));
      setPreview(result);
      setShowPreview(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Preview laden mislukt');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendConfirmation = async () => {
    if (!id) return;
    try {
      const result = await parentApi.sendConfirmation(parseInt(id));
      alert(result.message);
      loadRegistration(parseInt(id));
      setShowPreview(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Versturen mislukt');
    }
  };

  const handleSaveTemplate = async () => {
    if (!id) return;
    try {
      setSavingTemplate(true);
      await parentApi.updateTemplate(parseInt(id), template);
      setShowTemplateEditor(false);
      loadRegistration(parseInt(id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = async () => {
    if (!id) return;
    try {
      const result = await parentApi.resetTemplate(parseInt(id));
      setTemplate(result.template);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Resetten mislukt');
    }
  };

  const handleLinkAccessCode = async () => {
    if (!id || !accessCode) return;
    try {
      setLinking(true);
      const result = await parentApi.linkAccessCode(parseInt(id), accessCode);
      alert(result.message);
      setShowLinkModal(false);
      loadRegistration(parseInt(id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Koppelen mislukt');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">{error || 'Inschrijving niet gevonden'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/ouder/dashboard" className="text-teal-600 hover:text-teal-800 text-sm">
            Terug naar overzicht
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">
            {registration.organization_name}
          </h1>
          <p className="text-gray-600">Kind: {registration.child_name}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status & Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Status</h2>
              <div className="flex items-center gap-2">
                {registration.isLinked ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Gekoppeld aan organisatie
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {registration.status === 'waiting' ? 'Wachtend' :
                     registration.status === 'offered' ? 'Aangeboden' :
                     registration.status === 'accepted' ? 'Geaccepteerd' : 'Afgewezen'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/ouder/inschrijving/${id}/bewerken`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Bewerken
              </Link>
              {!registration.isLinked && (
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm"
                >
                  Koppel code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Gegevens</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Organisatie email</dt>
              <dd className="text-gray-900">{registration.organization_email || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Organisatie telefoon</dt>
              <dd className="text-gray-900">{registration.organization_phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Adres</dt>
              <dd className="text-gray-900">{registration.organization_address || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Geboortedatum kind</dt>
              <dd className="text-gray-900">{registration.child_birthdate || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Gewenste dagen</dt>
              <dd className="text-gray-900">
                {registration.preferred_days?.length > 0
                  ? registration.preferred_days.join(', ')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Gewenste startdatum</dt>
              <dd className="text-gray-900">{registration.desired_start_date || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Inschrijfdatum</dt>
              <dd className="text-gray-900">{registration.registration_date || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Laatste bevestiging</dt>
              <dd className="text-gray-900">{registration.last_confirmation_sent || 'Nog geen'}</dd>
            </div>
          </dl>
          {registration.notes && (
            <div className="mt-4 pt-4 border-t">
              <dt className="text-gray-500 text-sm">Notities</dt>
              <dd className="text-gray-900 mt-1">{registration.notes}</dd>
            </div>
          )}
        </div>

        {/* Email section - only for non-linked registrations */}
        {!registration.isLinked && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Bevestigingsmail</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTemplateEditor(true)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Template aanpassen
                </button>
                <button
                  onClick={handleLoadPreview}
                  disabled={loadingPreview || !registration.organization_email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {loadingPreview ? 'Laden...' : 'Preview & Verstuur'}
                </button>
              </div>
            </div>

            {!registration.organization_email && (
              <p className="text-sm text-orange-600">
                Voeg eerst een email adres van de organisatie toe om bevestigingsmails te kunnen versturen.
              </p>
            )}

            {/* Email history */}
            {emails.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Verstuurde bevestigingen</h3>
                <div className="space-y-2">
                  {emails.slice(0, 5).map((email) => (
                    <div key={email.id} className="flex justify-between items-center text-sm py-2 border-b">
                      <span className="text-gray-600">{email.sent_at}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        email.status === 'sent' ? 'bg-green-100 text-green-800' :
                        email.status === 'preview' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {email.status === 'preview' ? 'Preview' : email.status === 'sent' ? 'Verstuurd' : 'Mislukt'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Linked info */}
        {registration.isLinked && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="font-semibold text-green-900 mb-2">Gekoppeld aan organisatie</h2>
            <p className="text-green-800 text-sm mb-4">
              Deze inschrijving is gekoppeld aan een organisatie die WachtlijstHelderheid gebruikt.
              Je kunt nu je positie, kansen en meer bekijken in het ouder portaal.
            </p>
            <Link
              to="/portaal"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Ga naar Ouder Portaal
            </Link>
          </div>
        )}
      </main>

      {/* Email Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Aan</label>
                  <div className="text-gray-900">{preview.to}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Onderwerp</label>
                  <div className="text-gray-900">{preview.subject}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Bericht</label>
                  <pre className="mt-1 text-gray-900 whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded">
                    {preview.body}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleSendConfirmation}
                  className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700"
                >
                  Bevestig & Sla op
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                Let op: In deze versie wordt de email nog niet daadwerkelijk verstuurd.
                De bevestiging wordt wel opgeslagen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Template Aanpassen</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Beschikbare variabelen:</p>
                <div className="flex flex-wrap gap-2">
                  {['{kind_naam}', '{ouder_naam}', '{inschrijfdatum}', '{gewenste_dagen}', '{gewenste_startdatum}'].map((v) => (
                    <code key={v} className="px-2 py-1 bg-gray-100 text-sm rounded">{v}</code>
                  ))}
                </div>
              </div>

              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
              />

              <div className="mt-4 flex gap-4">
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:opacity-50"
                >
                  {savingTemplate ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button
                  onClick={handleResetTemplate}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Reset naar standaard
                </button>
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Access Code Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Toegangscode koppelen</h2>

              <p className="text-sm text-gray-600 mb-4">
                Heb je een toegangscode ontvangen van de organisatie? Voer deze hieronder in om
                je inschrijving te koppelen en toegang te krijgen tot je positie en kansen.
              </p>

              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="WL-XXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleLinkAccessCode}
                  disabled={linking || !accessCode}
                  className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:opacity-50"
                >
                  {linking ? 'Koppelen...' : 'Koppelen'}
                </button>
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setAccessCode('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { portalApi } from '../utils/api';
import type { PortalData, Day, Match, SimulationResult, ScoreBreakdown } from '../types';

const DAYS: { value: Day; label: string }[] = [
  { value: 'MA', label: 'Maandag' },
  { value: 'DI', label: 'Dinsdag' },
  { value: 'WO', label: 'Woensdag' },
  { value: 'DO', label: 'Donderdag' },
  { value: 'VR', label: 'Vrijdag' },
];

// Icons
const Icons = {
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  calculator: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  arrowUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  arrowDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

export default function ParentPortal() {
  const { accessCode: urlCode } = useParams();
  const navigate = useNavigate();

  const [accessCode, setAccessCode] = useState(urlCode || '');
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingPreferences, setEditingPreferences] = useState(false);
  const [preferredDays, setPreferredDays] = useState<Day[]>([]);
  const [desiredStartDate, setDesiredStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [respondingMatch, setRespondingMatch] = useState<Match | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [responding, setResponding] = useState(false);

  // Feature 4: Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorDays, setSimulatorDays] = useState<Day[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Feature 9: Interest confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [otherRegistrations, setOtherRegistrations] = useState<string>('');
  const [confirming, setConfirming] = useState(false);

  // Feature 2 & 3: Expanded sections
  const [showWhyPosition, setShowWhyPosition] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<number | null>(null);

  useEffect(() => {
    if (urlCode) {
      loadPortalData(urlCode);
    }
  }, [urlCode]);

  async function loadPortalData(code: string) {
    setLoading(true);
    setError('');

    try {
      const result = await portalApi.get(code);
      setData(result);
      setPreferredDays(result.entry.preferred_days);
      setDesiredStartDate(result.entry.desired_start_date);
      setNotes(result.entry.notes || '');
      setSimulatorDays(result.entry.preferred_days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ongeldige toegangscode');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (accessCode.trim()) {
      navigate(`/portaal/${accessCode.trim().toUpperCase()}`);
    }
  }

  function toggleDay(day: Day) {
    setPreferredDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  }

  function toggleSimulatorDay(day: Day) {
    setSimulatorDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
    setSimulationResult(null);
  }

  async function handleSavePreferences() {
    if (!data) return;

    setSaving(true);
    try {
      const result = await portalApi.updatePreferences(data.entry.access_code, {
        preferred_days: preferredDays,
        desired_start_date: desiredStartDate,
        notes,
      });
      setData(prev => prev ? {
        ...prev,
        entry: result.entry,
        position: result.position,
      } : null);
      setEditingPreferences(false);
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRespondToMatch(accept: boolean) {
    if (!data || !respondingMatch) return;

    setResponding(true);
    try {
      await portalApi.respondToMatch(
        data.entry.access_code,
        respondingMatch.id,
        accept,
        accept ? undefined : rejectionReason
      );
      // Reload data
      await loadPortalData(data.entry.access_code);
      setRespondingMatch(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error responding to match:', err);
    } finally {
      setResponding(false);
    }
  }

  // Feature 4: Run simulation
  async function handleSimulate() {
    if (!data || simulatorDays.length === 0) return;

    setSimulating(true);
    try {
      const result = await portalApi.simulate(data.entry.access_code, simulatorDays);
      setSimulationResult(result);
    } catch (err) {
      console.error('Error simulating:', err);
    } finally {
      setSimulating(false);
    }
  }

  // Feature 9: Confirm interest
  async function handleConfirmInterest() {
    if (!data) return;

    setConfirming(true);
    try {
      const registrations = otherRegistrations
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await portalApi.confirmInterest(data.entry.access_code, registrations.length > 0 ? registrations : undefined);
      await loadPortalData(data.entry.access_code);
      setShowConfirmModal(false);
      setOtherRegistrations('');
    } catch (err) {
      console.error('Error confirming interest:', err);
    } finally {
      setConfirming(false);
    }
  }

  // Access code entry screen
  if (!urlCode || !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500 rounded-xl mb-4">
              <span className="text-white font-bold text-xl">WH</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ouder Portal</h1>
            <p className="text-gray-500 mt-1">Bekijk uw wachtlijstpositie</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Voer uw toegangscode in</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label htmlFor="accessCode" className="label">Toegangscode</label>
                <input
                  type="text"
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="input font-mono text-lg tracking-wider"
                  placeholder="WL-XXXXXX"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deze code heeft u ontvangen bij uw inschrijving
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Laden...' : 'Bekijk mijn positie'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500 mb-3">
                Meerdere inschrijvingen?
              </p>
              <Link
                to="/mijn-inschrijvingen"
                className="block w-full text-center py-2 px-4 border border-primary-200 rounded-lg text-primary-600 hover:bg-primary-50 font-medium text-sm mb-4"
              >
                Bekijk al mijn inschrijvingen
              </Link>
              <div className="text-center">
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                  Beheerder? Log hier in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main portal view
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/mijn-inschrijvingen"
                className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <span className="text-white font-bold">WH</span>
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">{data.organization}</h1>
                <p className="text-sm text-gray-500">
                  {data.organizationType === 'BSO' ? 'Buitenschoolse opvang' : 'Kinderdagverblijf'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/mijn-inschrijvingen"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Alle inschrijvingen
              </Link>
              <button
                onClick={() => navigate('/portaal')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Feature 9: Confirmation banner - using confirmationInfo */}
        {data.confirmationInfo?.confirmationNeeded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 mt-0.5">{Icons.warning}</span>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Bevestig uw interesse</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Uw inschrijving verloopt binnenkort.
                  Bevestig dat u nog steeds geinteresseerd bent om op de wachtlijst te blijven.
                </p>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                >
                  Interesse bevestigen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation status banner - show when active */}
        {data.confirmationInfo && !data.confirmationInfo.confirmationNeeded && data.confirmationInfo.status === 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-green-600">{Icons.check}</span>
                <div>
                  <h3 className="font-medium text-green-800">Inschrijving actief</h3>
                  <p className="text-sm text-green-700">
                    Verloopt over {Math.max(0, 30 - data.confirmationInfo.daysSinceConfirmation)} dagen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(true)}
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                Nu vernieuwen
              </button>
            </div>
          </div>
        )}

        {/* Position card - Feature 1: Enhanced with position range */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className={`p-6 text-white ${
            data.position.matchChance === 'high' ? 'bg-gradient-to-r from-green-500 to-green-600' :
            data.position.matchChance === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Uw positie op de wachtlijst</p>
                <p className="text-5xl font-bold">
                  #{data.position.position}
                  <span className="text-2xl font-normal text-white/70 ml-2">
                    van {data.position.total}
                  </span>
                </p>
                {/* Feature 1: Position range */}
                {data.position.positionRange && (
                  <p className="text-white/80 text-sm mt-2">
                    Range: #{data.position.positionRange.best} - #{data.position.positionRange.worst}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">Match-kans</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold capitalize">
                    {data.position.matchChance === 'high' ? 'Hoog' :
                     data.position.matchChance === 'medium' ? 'Gemiddeld' : 'Laag'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparency info */}
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              <strong>Transparantie:</strong> Er staan {data.position.aheadInfo.total} mensen voor u
              {data.position.aheadInfo.withSibling > 0 && (
                <>, waarvan {data.position.aheadInfo.withSibling} met broertje/zusje prioriteit</>
              )}
              {data.position.aheadInfo.withSingleParent && data.position.aheadInfo.withSingleParent > 0 && (
                <>, {data.position.aheadInfo.withSingleParent} alleenstaande ouder</>
              )}
              .
            </p>
          </div>

          {/* Feature 2: Why this position? */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => setShowWhyPosition(!showWhyPosition)}
              className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <span className="text-primary-500">{Icons.info}</span>
              Waarom deze positie?
              <span className={`transform transition-transform ${showWhyPosition ? 'rotate-180' : ''}`}>
                {Icons.arrowDown}
              </span>
            </button>

            {showWhyPosition && (
              <div className="mt-4 space-y-4">
                {/* Position range explanation */}
                {data.position.positionRange && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-medium text-blue-900 text-sm mb-1">Positie range uitleg</h4>
                    <p className="text-sm text-blue-700">{data.position.positionRange.explanation}</p>
                  </div>
                )}

                {/* Priority score breakdown */}
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Uw prioriteitsscore</h4>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Totaal</span>
                      <span className="font-medium text-gray-900">
                        {data.position.priorityScore.score}/{data.position.priorityScore.maxScore} punten
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(data.position.priorityScore.score / data.position.priorityScore.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Rule breakdown - Feature 2 */}
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Score opbouw per regel</h4>
                  <div className="space-y-2">
                    {data.position.priorityScore.breakdown.map((rule, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{rule.ruleName}</span>
                          <span className="text-sm text-gray-900">{rule.score}/{rule.maxScore}</span>
                        </div>
                        <p className="text-xs text-gray-500">{rule.explanation}</p>
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-primary-400 rounded-full"
                            style={{ width: `${rule.maxScore > 0 ? (rule.score / rule.maxScore) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ahead by rule - Feature 2 */}
                {data.position.aheadByRule && Object.keys(data.position.aheadByRule).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Wie staat er voor u?</h4>
                    <div className="space-y-2">
                      {Object.entries(data.position.aheadByRule).map(([ruleType, info]) => (
                        <div key={ruleType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-700">{info.ruleName}</span>
                            <p className="text-xs text-gray-500">{info.description}</p>
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{info.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feature 4: Impact simulator toggle */}
          <div className="p-4">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <span className="text-primary-500">{Icons.calculator}</span>
              Wat als ik mijn voorkeuren wijzig?
              <span className={`transform transition-transform ${showSimulator ? 'rotate-180' : ''}`}>
                {Icons.arrowDown}
              </span>
            </button>

            {showSimulator && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Selecteer nieuwe dagen om te zien hoe dit uw positie beinvloedt (zonder echt te wijzigen):
                </p>

                <div className="flex gap-2 flex-wrap mb-4">
                  {DAYS.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleSimulatorDay(day.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        simulatorDays.includes(day.value)
                          ? 'bg-primary-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSimulate}
                  disabled={simulating || simulatorDays.length === 0}
                  className="btn-primary"
                >
                  {simulating ? 'Berekenen...' : 'Simuleer impact'}
                </button>

                {/* Simulation result */}
                {simulationResult && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    simulationResult.impact.direction === 'better'
                      ? 'bg-green-50 border-green-200'
                      : simulationResult.impact.direction === 'worse'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {simulationResult.impact.direction === 'better' ? (
                        <span className="text-green-600">{Icons.arrowUp}</span>
                      ) : simulationResult.impact.direction === 'worse' ? (
                        <span className="text-red-600">{Icons.arrowDown}</span>
                      ) : (
                        <span className="text-gray-400">=</span>
                      )}
                      <div>
                        <span className="font-medium text-gray-900">
                          Positie #{simulationResult.currentPosition} → #{simulationResult.simulatedPosition}
                        </span>
                        {simulationResult.positionChange !== 0 && (
                          <span className={`ml-2 text-sm ${
                            simulationResult.impact.direction === 'better' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ({simulationResult.positionChange > 0 ? '+' : ''}{simulationResult.positionChange})
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{simulationResult.impact.explanation}</p>
                    <p className="text-xs text-gray-500 mt-1">{simulationResult.impact.competitionChange}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pending matches - Feature 3: Enhanced with score breakdown */}
        {data.pendingMatches.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border-2 border-green-500 mb-6">
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <h2 className="font-semibold text-green-800">
                U heeft een voorstel!
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.pendingMatches.map(match => (
                <div key={match.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        Plek beschikbaar: {match.days.join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Startdatum: {match.start_date ? new Date(match.start_date).toLocaleDateString('nl-NL') : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{Math.round(match.match_score)}%</p>
                      <p className="text-xs text-gray-500">match score</p>
                    </div>
                  </div>

                  {/* Feature 3: Score breakdown toggle */}
                  <button
                    onClick={() => setShowScoreBreakdown(showScoreBreakdown === match.id ? null : match.id)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-3 flex items-center gap-1"
                  >
                    Hoe is deze score berekend?
                    <span className={`transform transition-transform ${showScoreBreakdown === match.id ? 'rotate-180' : ''}`}>
                      {Icons.arrowDown}
                    </span>
                  </button>

                  {showScoreBreakdown === match.id && match.score_breakdown && (
                    <ScoreBreakdownCard breakdown={match.score_breakdown} />
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setRespondingMatch(match);
                        handleRespondToMatch(true);
                      }}
                      className="btn-success flex-1"
                    >
                      Accepteren
                    </button>
                    <button
                      onClick={() => setRespondingMatch(match)}
                      className="btn-secondary flex-1"
                    >
                      Afwijzen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection modal */}
        {respondingMatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full animate-fade-in">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Voorstel afwijzen
                </h3>
                <p className="text-gray-600 mb-4">
                  Weet u zeker dat u dit voorstel wilt afwijzen? U blijft op de wachtlijst staan.
                </p>
                <div className="mb-4">
                  <label htmlFor="reason" className="label">Reden (optioneel)</label>
                  <textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Bijv. dagen passen niet, startdatum te laat, etc."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setRespondingMatch(null);
                      setRejectionReason('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={() => handleRespondToMatch(false)}
                    disabled={responding}
                    className="btn-danger flex-1"
                  >
                    {responding ? 'Bezig...' : 'Afwijzen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature 9: Confirmation modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full animate-fade-in">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Bevestig uw interesse
                </h3>
                <p className="text-gray-600 mb-4">
                  Door te bevestigen geeft u aan dat u nog steeds interesse heeft in een plek.
                </p>

                <div className="mb-4">
                  <label htmlFor="otherRegs" className="label">
                    Staat u ook bij andere kinderdagverblijven ingeschreven? (optioneel)
                  </label>
                  <textarea
                    id="otherRegs"
                    value={otherRegistrations}
                    onChange={(e) => setOtherRegistrations(e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Bijv. Kinderopvang De Zonnestraal, BSO Het Speelkwartier"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Scheid meerdere namen met een komma. Dit helpt ons om een realistisch beeld van de wachtlijst te krijgen.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setOtherRegistrations('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleConfirmInterest}
                    disabled={confirming}
                    className="btn-primary flex-1"
                  >
                    {confirming ? 'Bezig...' : 'Bevestigen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Child info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Inschrijving</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Kind</p>
                <p className="font-medium text-gray-900">{data.entry.child_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ouder/verzorger</p>
                <p className="font-medium text-gray-900">{data.entry.parent_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Toegangscode</p>
                <p className="font-mono text-gray-900">{data.entry.access_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingeschreven op</p>
                <p className="font-medium text-gray-900">
                  {new Date(data.entry.created_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
              {/* Feature 9: Confirmation status */}
              {data.entry.confirmation_status && (
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${
                    data.entry.confirmation_status === 'active' ? 'text-green-600' :
                    data.entry.confirmation_status === 'pending_confirmation' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {data.entry.confirmation_status === 'active' ? 'Actief' :
                     data.entry.confirmation_status === 'pending_confirmation' ? 'Bevestiging vereist' :
                     data.entry.confirmation_status === 'expired' ? 'Verlopen' : 'Gearchiveerd'}
                  </p>
                </div>
              )}
              {data.entry.last_confirmed_at && (
                <div>
                  <p className="text-sm text-gray-500">Laatst bevestigd</p>
                  <p className="font-medium text-gray-900">
                    {new Date(data.entry.last_confirmed_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Uw voorkeuren</h2>
              {!editingPreferences && (
                <button
                  onClick={() => setEditingPreferences(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Aanpassen
                </button>
              )}
            </div>
            <div className="px-6 py-4">
              {editingPreferences ? (
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                    Let op: het aanpassen van uw voorkeuren kan uw positie op de wachtlijst beinvloeden.
                  </div>

                  <div>
                    <label className="label">Gewenste dagen</label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={preferredDays.includes(day.value) ? 'day-btn-selected' : 'day-btn-unselected'}
                        >
                          {day.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="startDate" className="label">Gewenste startdatum</label>
                    <input
                      type="date"
                      id="startDate"
                      value={desiredStartDate}
                      onChange={(e) => setDesiredStartDate(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="label">Opmerkingen</label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPreferredDays(data.entry.preferred_days);
                        setDesiredStartDate(data.entry.desired_start_date);
                        setNotes(data.entry.notes || '');
                        setEditingPreferences(false);
                      }}
                      className="btn-secondary flex-1"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="btn-primary flex-1"
                    >
                      {saving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Gewenste dagen</p>
                    <div className="flex gap-1 mt-1">
                      {DAYS.map(day => (
                        <span
                          key={day.value}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                            data.entry.preferred_days.includes(day.value)
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gewenste startdatum</p>
                    <p className="font-medium text-gray-900">
                      {new Date(data.entry.desired_start_date).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  {data.entry.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Opmerkingen</p>
                      <p className="text-gray-900">{data.entry.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tijdlijn</h2>
          </div>
          <div className="px-6 py-4">
            {data.timeline.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nog geen gebeurtenissen</p>
            ) : (
              <div className="space-y-4">
                {data.timeline.map(event => (
                  <div key={event.id} className="flex gap-4">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString('nl-NL')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Vragen over uw inschrijving? Neem contact op met {data.organization}.
          </p>
        </div>
      </main>
    </div>
  );
}

// Feature 3: Score breakdown component
function ScoreBreakdownCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4 mb-4">
      <h4 className="font-medium text-gray-900 text-sm">Score breakdown</h4>

      {/* Days score */}
      <div className="p-3 bg-white rounded border border-gray-200">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Dagen overlap</span>
          <span className="text-sm text-gray-900">{breakdown.days.score}/{breakdown.days.maxScore}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{breakdown.days.explanation}</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${(breakdown.days.score / breakdown.days.maxScore) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Overlappende dagen: {breakdown.days.overlappingDays.join(', ') || 'geen'}
        </p>
      </div>

      {/* Priority score */}
      <div className="p-3 bg-white rounded border border-gray-200">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Prioriteit</span>
          <span className="text-sm text-gray-900">{breakdown.priority.score}/{breakdown.priority.maxScore}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{breakdown.priority.explanation}</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${breakdown.priority.maxScore > 0 ? (breakdown.priority.score / breakdown.priority.maxScore) * 100 : 0}%` }}
          />
        </div>
        {breakdown.priority.breakdown.length > 0 && (
          <div className="mt-2 space-y-1">
            {breakdown.priority.breakdown.map((rule, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-500">{rule.ruleName}</span>
                <span className="text-gray-700">{rule.score}/{rule.maxScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start date score */}
      <div className="p-3 bg-white rounded border border-gray-200">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Startdatum match</span>
          <span className="text-sm text-gray-900">{breakdown.startDate.score}/{breakdown.startDate.maxScore}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{breakdown.startDate.explanation}</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 rounded-full"
            style={{ width: `${(breakdown.startDate.score / breakdown.startDate.maxScore) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

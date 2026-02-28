import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { spotsApi, matchesApi } from '../utils/api';
import type { Day, MatchCandidate, AvailableSpot } from '../types';

const DAYS: { value: Day; label: string }[] = [
  { value: 'MA', label: 'Maandag' },
  { value: 'DI', label: 'Dinsdag' },
  { value: 'WO', label: 'Woensdag' },
  { value: 'DO', label: 'Donderdag' },
  { value: 'VR', label: 'Vrijdag' },
];

export default function NewSpot() {
  const [step, setStep] = useState<'input' | 'results'>('input');
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const [startDate, setStartDate] = useState('');
  const [numSpots, setNumSpots] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [spot, setSpot] = useState<AvailableSpot | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [sendingProposal, setSendingProposal] = useState<number | null>(null);
  const [sentProposals, setSentProposals] = useState<Set<number>>(new Set());
  const [emailPreview, setEmailPreview] = useState<{ to: string; subject: string; body: string } | null>(null);

  function toggleDay(day: Day) {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  }

  async function handleFindMatches(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (selectedDays.length === 0) {
      setError('Selecteer minimaal één dag');
      return;
    }

    setLoading(true);

    try {
      const response = await spotsApi.create({
        days: selectedDays,
        start_date: startDate,
        num_spots: numSpots,
      });
      setSpot(response.spot);
      setCandidates(response.candidates);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendProposal(candidate: MatchCandidate) {
    if (!spot) return;

    setSendingProposal(candidate.entry.id);

    try {
      const response = await matchesApi.create(spot.id, candidate.entry.id);
      setSentProposals(prev => new Set([...prev, candidate.entry.id]));
      setEmailPreview(response.emailPreview);

      // Remove from candidates list
      setCandidates(prev => prev.filter(c => c.entry.id !== candidate.entry.id));
    } catch (err) {
      console.error('Error sending proposal:', err);
    } finally {
      setSendingProposal(null);
    }
  }

  function getScoreClass(score: number) {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }

  return (
    <Layout title="Nieuwe plek beschikbaar">
      {step === 'input' ? (
        <div className="max-w-xl">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Plek details</h2>
              <p className="text-sm text-gray-500">Vul de beschikbare plek in om de beste matches te vinden</p>
            </div>
            <div className="card-body">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleFindMatches} className="space-y-6">
                <div>
                  <label className="label">Beschikbare dagen *</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={selectedDays.includes(day.value) ? 'day-btn-selected' : 'day-btn-unselected'}
                      >
                        {day.value}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Geselecteerd: {selectedDays.length > 0 ? selectedDays.join(', ') : 'Geen'}
                  </p>
                </div>

                <div>
                  <label htmlFor="startDate" className="label">Beschikbaar vanaf *</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="numSpots" className="label">Aantal plekken</label>
                  <input
                    type="number"
                    id="numSpots"
                    min="1"
                    max="10"
                    value={numSpots}
                    onChange={(e) => setNumSpots(parseInt(e.target.value))}
                    className="input w-24"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Zoeken...' : 'Vind beste matches'}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Back button */}
          <button
            onClick={() => {
              setStep('input');
              setSpot(null);
              setCandidates([]);
              setSentProposals(new Set());
              setEmailPreview(null);
            }}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nieuwe zoekopdracht
          </button>

          {/* Spot summary */}
          {spot && (
            <div className="card p-4 bg-green-50 border-green-200 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600">P</span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Plek beschikbaar</h3>
                  <p className="text-sm text-green-700">
                    {spot.days.join(', ')} vanaf {new Date(spot.start_date).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email preview modal */}
          {emailPreview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-lg w-full animate-fade-in">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Voorstel verstuurd</h3>
                    <button
                      onClick={() => setEmailPreview(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <p className="text-gray-500 mb-1">Aan: {emailPreview.to}</p>
                    <p className="text-gray-500 mb-3">Onderwerp: {emailPreview.subject}</p>
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">{emailPreview.body}</pre>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    * In de MVP worden emails niet daadwerkelijk verstuurd. Dit is een preview van hoe de email eruit zou zien.
                  </p>

                  <button
                    onClick={() => setEmailPreview(null)}
                    className="btn-primary w-full mt-4"
                  >
                    Begrepen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Candidates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Top {candidates.length} matches
              </h2>
              {sentProposals.size > 0 && (
                <span className="badge-green">
                  {sentProposals.size} voorstel(len) verstuurd
                </span>
              )}
            </div>

            {candidates.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-500">
                  {sentProposals.size > 0
                    ? 'Alle kandidaten hebben een voorstel ontvangen'
                    : 'Geen geschikte kandidaten gevonden'}
                </p>
                <Link to="/waitlist" className="btn-primary mt-4">
                  Bekijk wachtlijst
                </Link>
              </div>
            ) : (
              candidates.map((candidate, index) => (
                <div key={candidate.entry.id} className="card">
                  <div
                    className="card-body cursor-pointer"
                    onClick={() => setExpandedCandidate(
                      expandedCandidate === candidate.entry.id ? null : candidate.entry.id
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank */}
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium shrink-0">
                          {index + 1}
                        </div>

                        {/* Score circle */}
                        <div className={`${getScoreClass(candidate.percentage)} shrink-0`}>
                          {candidate.percentage}%
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{candidate.entry.child_name}</h3>
                          <p className="text-sm text-gray-500">{candidate.entry.parent_name}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{candidate.summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                      {/* Days comparison */}
                      <div className="hidden md:flex gap-1">
                        {DAYS.map(day => {
                          const isSpotDay = spot?.days.includes(day.value);
                          const isWantedDay = candidate.entry.preferred_days.includes(day.value);
                          const isMatch = isSpotDay && isWantedDay;

                          return (
                            <div
                              key={day.value}
                              className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center ${
                                isMatch
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                                  : isSpotDay
                                  ? 'bg-blue-100 text-blue-700'
                                  : isWantedDay
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title={`${day.label}: ${isMatch ? 'Match!' : isSpotDay ? 'Beschikbaar' : isWantedDay ? 'Gewenst' : 'Niet relevant'}`}
                            >
                              {day.value}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendProposal(candidate);
                        }}
                        disabled={sendingProposal === candidate.entry.id}
                        className="btn-primary whitespace-nowrap"
                      >
                        {sendingProposal === candidate.entry.id ? 'Versturen...' : 'Stuur voorstel'}
                      </button>

                      {/* Expand icon */}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${
                          expandedCandidate === candidate.entry.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedCandidate === candidate.entry.id && (
                    <div className="px-6 pb-6 pt-0 border-t border-gray-100 mt-4">
                      <h4 className="font-medium text-gray-900 mb-4 pt-4">Score berekening</h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Days score */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Dagen match</span>
                            <span className="text-sm font-bold text-gray-900">
                              {candidate.breakdown.days.score}/{candidate.breakdown.days.maxScore}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-primary-500 rounded-full"
                              style={{ width: `${(candidate.breakdown.days.score / candidate.breakdown.days.maxScore) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {candidate.breakdown.days.explanation}
                          </p>
                        </div>

                        {/* Priority score */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Prioriteit</span>
                            <span className="text-sm font-bold text-gray-900">
                              {candidate.breakdown.priority.score}/{candidate.breakdown.priority.maxScore}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-primary-500 rounded-full"
                              style={{ width: `${(candidate.breakdown.priority.score / candidate.breakdown.priority.maxScore) * 100}%` }}
                            />
                          </div>
                          <div className="mt-2 space-y-1">
                            {candidate.breakdown.priority.breakdown.map((item, i) => (
                              <p key={i} className="text-xs text-gray-500">
                                {item.ruleName}: {item.score.toFixed(1)}/{item.maxScore.toFixed(1)} pt
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Start date score */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Startdatum</span>
                            <span className="text-sm font-bold text-gray-900">
                              {candidate.breakdown.startDate.score}/{candidate.breakdown.startDate.maxScore}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-primary-500 rounded-full"
                              style={{ width: `${(candidate.breakdown.startDate.score / candidate.breakdown.startDate.maxScore) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {candidate.breakdown.startDate.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Entry details */}
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Gewenste dagen:</span>{' '}
                          <span className="text-gray-900">{candidate.entry.preferred_days.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Gewenste start:</span>{' '}
                          <span className="text-gray-900">
                            {new Date(candidate.entry.desired_start_date).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Ingeschreven:</span>{' '}
                          <span className="text-gray-900">
                            {new Date(candidate.entry.created_at).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Toegangscode:</span>{' '}
                          <span className="text-gray-900 font-mono">{candidate.entry.access_code}</span>
                        </div>
                      </div>

                      {candidate.entry.notes && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                          <span className="text-sm font-medium text-yellow-800">Opmerking: </span>
                          <span className="text-sm text-yellow-700">{candidate.entry.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { rulesApi } from '../utils/api';
import type { PriorityRule, FairnessCheck } from '../types';

const RULE_TYPES = [
  { value: 'registration_date', label: 'Inschrijfdatum', description: 'Wie het eerst komt, het eerst maalt' },
  { value: 'sibling', label: 'Broertje/zusje', description: 'Voorrang voor kinderen met broertje/zusje op locatie' },
  { value: 'single_parent', label: 'Alleenstaand ouder', description: 'Voorrang voor alleenstaande ouders' },
  { value: 'custom', label: 'Aangepast', description: 'Eigen prioriteitsregel' },
];

// Icons
const Icons = {
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function Rules() {
  const [rules, setRules] = useState<PriorityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [fairnessCheck, setFairnessCheck] = useState<FairnessCheck | null>(null);
  const [loadingFairness, setLoadingFairness] = useState(false);
  const [showFairnessDetails, setShowFairnessDetails] = useState(false);

  useEffect(() => {
    loadRules();
    loadFairnessCheck();
  }, []);

  async function loadRules() {
    try {
      const response = await rulesApi.getAll();
      setRules(response.rules);
    } catch (error) {
      console.error('Error loading rules:', error);
      setError('Kon regels niet laden');
    } finally {
      setLoading(false);
    }
  }

  async function loadFairnessCheck() {
    setLoadingFairness(true);
    try {
      const check = await rulesApi.checkFairness();
      setFairnessCheck(check);
    } catch (error) {
      console.error('Error loading fairness check:', error);
    } finally {
      setLoadingFairness(false);
    }
  }

  function updateRule(index: number, updates: Partial<PriorityRule>) {
    setRules(prev => prev.map((rule, i) =>
      i === index ? { ...rule, ...updates } : rule
    ));
    setSuccess('');
  }

  function addRule() {
    setRules(prev => [
      ...prev,
      {
        rule_name: '',
        rule_type: 'custom',
        weight_percentage: 0,
        description: '',
        is_active: true,
      },
    ]);
  }

  function removeRule(index: number) {
    setRules(prev => prev.filter((_, i) => i !== index));
    setSuccess('');
  }

  function toggleRuleActive(index: number) {
    setRules(prev => prev.map((rule, i) =>
      i === index ? { ...rule, is_active: !rule.is_active } : rule
    ));
    setSuccess('');
  }

  const totalWeight = rules.filter(r => r.is_active !== false).reduce((sum, r) => sum + r.weight_percentage, 0);

  async function handleSave() {
    setError('');
    setSuccess('');

    if (totalWeight !== 100) {
      setError(`Totale weging moet 100% zijn (momenteel: ${totalWeight}%)`);
      return;
    }

    for (const rule of rules.filter(r => r.is_active !== false)) {
      if (!rule.rule_name.trim()) {
        setError('Alle actieve regels moeten een naam hebben');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await rulesApi.update(rules);
      setRules(response.rules);
      setSuccess('Regels succesvol opgeslagen');
      loadFairnessCheck();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon regels niet opslaan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout title="Prioriteitsregels">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Prioriteitsregels">
      <div className="max-w-3xl">
        {/* Info card */}
        <div className="card p-4 bg-forest-50 border-forest-200 mb-6">
          <div>
            <h3 className="font-semibold text-forest-700">Hoe werken prioriteitsregels?</h3>
            <p className="text-sm text-forest-600 mt-1">
              Prioriteitsregels bepalen de volgorde op de wachtlijst. Elke regel heeft een percentage
              dat aangeeft hoeveel gewicht deze regel heeft in de totale score. Het totaal moet 100% zijn.
            </p>
          </div>
        </div>

        {/* Fairness warnings */}
        {fairnessCheck && !loadingFairness && (
          <div className={`card mb-6 ${fairnessCheck.isBalanced ? 'bg-teal-50 border-teal-200' : 'bg-terracotta-50 border-terracotta-200'}`}>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <span className={fairnessCheck.isBalanced ? 'text-teal-600' : 'text-terracotta-600'}>
                  {fairnessCheck.isBalanced ? Icons.check : Icons.warning}
                </span>
                <div className="flex-1">
                  <h3 className={`font-semibold ${fairnessCheck.isBalanced ? 'text-teal-700' : 'text-terracotta-700'}`}>
                    {fairnessCheck.isBalanced ? 'Regels zijn gebalanceerd' : 'Aandachtspunten bij huidige regels'}
                  </h3>

                  {fairnessCheck.warnings.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {fairnessCheck.warnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl text-sm ${
                            warning.severity === 'critical'
                              ? 'bg-terracotta-100 text-terracotta-800'
                              : 'bg-terracotta-100/50 text-terracotta-700'
                          }`}
                        >
                          <strong>{warning.ruleName}:</strong> {warning.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {fairnessCheck.suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className={`text-sm font-medium ${fairnessCheck.isBalanced ? 'text-teal-600' : 'text-terracotta-600'}`}>
                        Suggesties:
                      </p>
                      <ul className="mt-1 text-sm text-navy-500 list-disc list-inside">
                        {fairnessCheck.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => setShowFairnessDetails(!showFairnessDetails)}
                    className={`mt-3 text-sm font-semibold ${fairnessCheck.isBalanced ? 'text-teal-600' : 'text-terracotta-600'}`}
                  >
                    {showFairnessDetails ? 'Verberg details' : 'Toon impact analyse'}
                  </button>

                  {showFairnessDetails && fairnessCheck.affectedAnalysis && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-cream-300">
                      <h4 className="text-sm font-medium text-forest-600 mb-2">
                        Impact op wachtlijst ({fairnessCheck.affectedAnalysis.totalEntries} inschrijvingen)
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(fairnessCheck.affectedAnalysis.byRuleType).map(([type, info]) => (
                          <div key={type} className="flex items-center justify-between text-sm">
                            <span className="text-navy-500">
                              {RULE_TYPES.find(r => r.value === type)?.label || type}
                            </span>
                            <span className="font-medium text-forest-600">
                              {info.count} ({info.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-terracotta-50 border border-terracotta-200 text-terracotta-700 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl">
            {success}
          </div>
        )}

        {/* Rules list */}
        <div className="space-y-4 mb-6">
          {rules.map((rule, index) => (
            <div
              key={index}
              className={`card ${rule.is_active === false ? 'opacity-60 bg-cream-50' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 bg-cream-200 rounded-lg flex items-center justify-center text-navy-400 text-sm">
                      {index + 1}
                    </div>
                    <button
                      onClick={() => toggleRuleActive(index)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        rule.is_active !== false
                          ? 'bg-teal-100 text-teal-600'
                          : 'bg-cream-200 text-navy-300'
                      }`}
                      title={rule.is_active !== false ? 'Actief - klik om te deactiveren' : 'Inactief - klik om te activeren'}
                    >
                      {rule.is_active !== false ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Naam regel</label>
                        <input
                          type="text"
                          value={rule.rule_name}
                          onChange={(e) => updateRule(index, { rule_name: e.target.value })}
                          className="input"
                          placeholder="Naam van de regel"
                          disabled={rule.is_active === false}
                        />
                      </div>
                      <div>
                        <label className="label">Type</label>
                        <select
                          value={rule.rule_type}
                          onChange={(e) => {
                            const type = e.target.value as PriorityRule['rule_type'];
                            const typeInfo = RULE_TYPES.find(t => t.value === type);
                            updateRule(index, {
                              rule_type: type,
                              rule_name: rule.rule_name || typeInfo?.label || '',
                              description: typeInfo?.description || '',
                            });
                          }}
                          className="input"
                          disabled={rule.is_active === false}
                        >
                          {RULE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label">Beschrijving</label>
                      <input
                        type="text"
                        value={rule.description || ''}
                        onChange={(e) => updateRule(index, { description: e.target.value })}
                        className="input"
                        placeholder="Korte beschrijving van de regel"
                        disabled={rule.is_active === false}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Weging: {rule.weight_percentage}%</label>
                        {rule.weight_percentage > 60 && rule.is_active !== false && (
                          <span className="text-xs text-terracotta-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                            </svg>
                            Hoge weging
                          </span>
                        )}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rule.weight_percentage}
                        onChange={(e) => updateRule(index, { weight_percentage: parseInt(e.target.value) })}
                        className="w-full h-2 bg-cream-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                        disabled={rule.is_active === false}
                      />
                      <div className="flex justify-between text-xs text-navy-400 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeRule(index)}
                    className="p-2 text-navy-300 hover:text-terracotta-600 rounded-lg hover:bg-cream-100"
                    title="Verwijderen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addRule}
          className="btn-outline w-full mb-6"
        >
          + Regel toevoegen
        </button>

        <div className={`card p-4 mb-6 ${totalWeight === 100 ? 'bg-teal-50 border-teal-200' : 'bg-terracotta-50 border-terracotta-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold ${totalWeight === 100 ? 'text-teal-700' : 'text-terracotta-700'}`}>
                Totale weging (actieve regels)
              </p>
              <p className={`text-sm ${totalWeight === 100 ? 'text-teal-600' : 'text-terracotta-600'}`}>
                {totalWeight === 100 ? 'Correct! Totaal is 100%' : `Totaal moet 100% zijn`}
              </p>
            </div>
            <div className={`text-3xl font-bold ${totalWeight === 100 ? 'text-teal-700' : 'text-terracotta-700'}`}>
              {totalWeight}%
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || totalWeight !== 100}
          className="btn-primary w-full"
        >
          {saving ? 'Opslaan...' : 'Regels opslaan'}
        </button>

        {/* Preview */}
        <div className="card mt-8">
          <div className="card-header bg-cream-50">
            <h2 className="font-serif font-bold text-forest-600 text-lg">Preview: Score berekening</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-navy-500 mb-4">
              Zo wordt de prioriteitsscore (max 40 punten) berekend:
            </p>
            <div className="space-y-2">
              {rules.filter(r => r.is_active !== false).map((rule, index) => {
                const maxPoints = (rule.weight_percentage / 100) * 40;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-forest-600">{rule.rule_name || 'Naamloze regel'}</span>
                        <span className="text-navy-400">{rule.weight_percentage}%</span>
                      </div>
                      <div className="h-2 bg-cream-200 rounded-full mt-1">
                        <div
                          className="h-2 bg-teal-500 rounded-full"
                          style={{ width: `${rule.weight_percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-forest-600 w-20 text-right">
                      max {maxPoints.toFixed(1)} pt
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { rulesApi } from '../utils/api';
import type { PriorityRule } from '../types';

const RULE_TYPES = [
  { value: 'registration_date', label: 'Inschrijfdatum', description: 'Wie het eerst komt, het eerst maalt' },
  { value: 'sibling', label: 'Broertje/zusje', description: 'Voorrang voor kinderen met broertje/zusje op locatie' },
  { value: 'single_parent', label: 'Alleenstaand ouder', description: 'Voorrang voor alleenstaande ouders' },
  { value: 'custom', label: 'Aangepast', description: 'Eigen prioriteitsregel' },
];

export default function Rules() {
  const [rules, setRules] = useState<PriorityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRules();
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
      },
    ]);
  }

  function removeRule(index: number) {
    setRules(prev => prev.filter((_, i) => i !== index));
    setSuccess('');
  }

  const totalWeight = rules.reduce((sum, r) => sum + r.weight_percentage, 0);

  async function handleSave() {
    setError('');
    setSuccess('');

    // Validate
    if (totalWeight !== 100) {
      setError(`Totale weging moet 100% zijn (momenteel: ${totalWeight}%)`);
      return;
    }

    for (const rule of rules) {
      if (!rule.rule_name.trim()) {
        setError('Alle regels moeten een naam hebben');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await rulesApi.update(rules);
      setRules(response.rules);
      setSuccess('Regels succesvol opgeslagen');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Prioriteitsregels">
      <div className="max-w-3xl">
        {/* Info card */}
        <div className="card p-4 bg-blue-50 border-blue-200 mb-6">
          <div className="flex gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-medium text-blue-900">Hoe werken prioriteitsregels?</h3>
              <p className="text-sm text-blue-800 mt-1">
                Prioriteitsregels bepalen de volgorde op de wachtlijst. Elke regel heeft een percentage
                dat aangeeft hoeveel gewicht deze regel heeft in de totale score. Het totaal moet 100% zijn.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Rules list */}
        <div className="space-y-4 mb-6">
          {rules.map((rule, index) => (
            <div key={index} className="card">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  {/* Drag handle placeholder */}
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-400 mt-2">
                    {index + 1}
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
                      />
                    </div>

                    <div>
                      <label className="label">Weging: {rule.weight_percentage}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rule.weight_percentage}
                        onChange={(e) => updateRule(index, { weight_percentage: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeRule(index)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
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

        {/* Add rule button */}
        <button
          onClick={addRule}
          className="btn-secondary w-full mb-6"
        >
          + Regel toevoegen
        </button>

        {/* Total indicator */}
        <div className={`card p-4 mb-6 ${totalWeight === 100 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${totalWeight === 100 ? 'text-green-800' : 'text-yellow-800'}`}>
                Totale weging
              </p>
              <p className={`text-sm ${totalWeight === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                {totalWeight === 100 ? 'Correct! Totaal is 100%' : `Totaal moet 100% zijn`}
              </p>
            </div>
            <div className={`text-3xl font-bold ${totalWeight === 100 ? 'text-green-700' : 'text-yellow-700'}`}>
              {totalWeight}%
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || totalWeight !== 100}
          className="btn-primary w-full"
        >
          {saving ? 'Opslaan...' : 'Regels opslaan'}
        </button>

        {/* Preview */}
        <div className="card mt-8">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Preview: Score berekening</h2>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-600 mb-4">
              Zo wordt de prioriteitsscore (max 40 punten) berekend:
            </p>
            <div className="space-y-2">
              {rules.map((rule, index) => {
                const maxPoints = (rule.weight_percentage / 100) * 40;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{rule.rule_name || 'Naamloze regel'}</span>
                        <span className="text-gray-500">{rule.weight_percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full mt-1">
                        <div
                          className="h-2 bg-primary-500 rounded-full"
                          style={{ width: `${rule.weight_percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 w-20 text-right">
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

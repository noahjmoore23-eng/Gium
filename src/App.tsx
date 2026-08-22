import { useEffect, useState } from 'react';
import { Dispatch } from './ui/Dispatch';
import { Estimator } from './ui/Estimator';
import { Settings } from './ui/Settings';
import type { Job, Mover } from './domain/schedule';
import type { RateCard } from './domain/types';
import { clearState, loadState, saveState, seedState } from './domain/storage';
import './styles/app.css';

type View = 'estimate' | 'dispatch' | 'settings';

const VIEWS: { id: View; label: string }[] = [
  { id: 'estimate', label: 'Estimate' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState<View>('estimate');

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addJob = (job: Omit<Job, 'id'>) => {
    const created: Job = { ...job, id: `job-${Date.now().toString(36)}` };
    setState((current) => ({ ...current, jobs: [...current.jobs, created] }));
    setView('dispatch');
  };

  const updateJob = (id: string, patch: Partial<Job>) => {
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)),
    }));
  };

  const deleteJob = (id: string) => {
    setState((current) => ({ ...current, jobs: current.jobs.filter((job) => job.id !== id) }));
  };

  const setRates = (rates: RateCard) => setState((current) => ({ ...current, rates }));
  const setMovers = (movers: Mover[]) => setState((current) => ({ ...current, movers }));
  const setCompany = (company: string) => setState((current) => ({ ...current, company }));

  const reset = () => {
    clearState();
    setState(seedState());
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          Gium <small>{state.company}</small>
        </div>
        <nav className="tabs">
          {VIEWS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="tab"
              aria-current={view === entry.id ? 'page' : undefined}
              onClick={() => setView(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {view === 'estimate' && <Estimator rates={state.rates} onBook={addJob} />}
        {view === 'dispatch' && (
          <Dispatch
            jobs={state.jobs}
            movers={state.movers}
            onUpdate={updateJob}
            onDelete={deleteJob}
          />
        )}
        {view === 'settings' && (
          <Settings
            company={state.company}
            rates={state.rates}
            movers={state.movers}
            onCompanyChange={setCompany}
            onRatesChange={setRates}
            onMoversChange={setMovers}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { FLEET } from '../domain/estimate';
import {
  conflictsByJob,
  dayMetrics,
  findConflicts,
  isActive,
  weekDates,
} from '../domain/schedule';
import type { Job, JobStatus, Mover } from '../domain/schedule';
import { Stat } from './Stat';
import { currency, dayParts, endTime, integer, percent, todayIso } from './format';

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
  { value: 'inProgress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface DispatchProps {
  jobs: Job[];
  movers: Mover[];
  onUpdate: (id: string, patch: Partial<Job>) => void;
  onDelete: (id: string) => void;
}

export function Dispatch({ jobs, movers, onUpdate, onDelete }: DispatchProps) {
  const [anchor, setAnchor] = useState(todayIso());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dates = useMemo(() => weekDates(anchor), [anchor]);
  const conflicts = useMemo(() => findConflicts(jobs, movers), [jobs, movers]);
  const grouped = useMemo(() => conflictsByJob(conflicts), [conflicts]);

  const metrics = useMemo(
    () => dates.map((date) => dayMetrics(date, jobs, movers)),
    [dates, jobs, movers],
  );

  const weekTotals = useMemo(() => {
    const revenue = metrics.reduce((sum, day) => sum + day.revenue, 0);
    const booked = metrics.reduce((sum, day) => sum + day.bookedHours, 0);
    const capacity = metrics.reduce((sum, day) => sum + day.capacityHours, 0);
    const jobCount = metrics.reduce((sum, day) => sum + day.jobCount, 0);
    return {
      revenue,
      booked,
      capacity,
      jobCount,
      utilization: capacity > 0 ? booked / capacity : 0,
      revenuePerHour: booked > 0 ? revenue / booked : 0,
    };
  }, [metrics]);

  const selected = jobs.find((job) => job.id === selectedId) ?? null;
  const errorCount = conflicts.filter((conflict) => conflict.severity === 'error').length;
  const warningCount = conflicts.length - errorCount;

  const shiftWeek = (weeks: number) => {
    const date = new Date(`${anchor}T00:00:00`);
    date.setDate(date.getDate() + weeks * 7);
    setAnchor(date.toISOString().slice(0, 10));
  };

  return (
    <div className="stack">
      <section className="card">
        <header>
          <div>
            <h2>Week of {dayParts(dates[0]).month} {dayParts(dates[0]).day}</h2>
            <p>
              {errorCount > 0 ? `${errorCount} blocking conflict(s)` : 'No blocking conflicts'}
              {warningCount > 0 ? ` · ${warningCount} warning(s)` : ''}
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn btn-sm" onClick={() => shiftWeek(-1)}>
              ← Previous
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setAnchor(todayIso())}>
              This week
            </button>
            <button type="button" className="btn btn-sm" onClick={() => shiftWeek(1)}>
              Next →
            </button>
          </div>
        </header>
        <div className="card-body stack">
          <dl className="stat-grid">
            <Stat label="Jobs" value={integer(weekTotals.jobCount)} />
            <Stat label="Revenue" value={currency(weekTotals.revenue)} />
            <Stat label="Crew hours" value={integer(weekTotals.booked)} unit={`/ ${integer(weekTotals.capacity)}`} />
            <Stat label="Utilization" value={percent(weekTotals.utilization)} />
            <Stat label="Revenue / crew hr" value={currency(weekTotals.revenuePerHour)} />
          </dl>

          <div className="week">
            {dates.map((date, index) => {
              const day = metrics[index];
              const dayJobs = jobs
                .filter((job) => job.date === date)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const parts = dayParts(date);
              const meterClass =
                day.utilization > 1 ? 'meter hot' : day.utilization > 0.85 ? 'meter warm' : 'meter';

              return (
                <div key={date} className={date === todayIso() ? 'day today' : 'day'}>
                  <header>
                    <div className="day-name">{parts.weekday}</div>
                    <div className="day-date">{parts.day}</div>
                    <div className="day-meta">
                      {day.jobCount === 0
                        ? 'Open'
                        : `${day.jobCount} job${day.jobCount === 1 ? '' : 's'} · ${currency(day.revenue)}`}
                    </div>
                    <div className={meterClass}>
                      <span style={{ width: `${Math.min(100, day.utilization * 100)}%` }} />
                    </div>
                  </header>
                  <div className="day-jobs">
                    {dayJobs.map((job) => {
                      const jobConflicts = grouped.get(job.id) ?? [];
                      const blocking = jobConflicts.filter((c) => c.severity === 'error').length;
                      return (
                        <button
                          key={job.id}
                          type="button"
                          className={`job-chip status-${job.status}`}
                          aria-pressed={selectedId === job.id}
                          onClick={() => setSelectedId(job.id === selectedId ? null : job.id)}
                        >
                          <span className="time">
                            <span>{job.startTime}</span>
                            <span>{endTime(job.startTime, job.estimatedHours)}</span>
                          </span>
                          <span className="who">{job.customer}</span>
                          <span className="crew">
                            {job.moverIds.length}/{job.recommendedCrew} crew ·{' '}
                            {integer(job.volumeCuFt)} cu ft
                          </span>
                          {blocking > 0 && isActive(job) && (
                            <span className="alert">{blocking} conflict{blocking === 1 ? '' : 's'}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {selected ? (
        <JobEditor
          key={selected.id}
          job={selected}
          movers={movers}
          conflicts={grouped.get(selected.id) ?? []}
          onUpdate={(patch) => onUpdate(selected.id, patch)}
          onDelete={() => {
            onDelete(selected.id);
            setSelectedId(null);
          }}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        <p className="empty">Select a job on the board to assign crew and trucks.</p>
      )}
    </div>
  );
}

interface JobEditorProps {
  job: Job;
  movers: Mover[];
  conflicts: { severity: 'error' | 'warning'; message: string }[];
  onUpdate: (patch: Partial<Job>) => void;
  onDelete: () => void;
  onClose: () => void;
}

function JobEditor({ job, movers, conflicts, onUpdate, onDelete, onClose }: JobEditorProps) {
  const toggleMover = (moverId: string) => {
    const next = job.moverIds.includes(moverId)
      ? job.moverIds.filter((id) => id !== moverId)
      : [...job.moverIds, moverId];
    onUpdate({ moverIds: next });
  };

  return (
    <section className="card">
      <header>
        <div>
          <h2>{job.customer}</h2>
          <p>
            {job.originAddress || 'Origin not set'} → {job.destinationAddress || 'Destination not set'}
            {job.phone ? ` · ${job.phone}` : ''}
          </p>
        </div>
        <div className="row">
          <span className="badge">{integer(job.volumeCuFt)} cu ft</span>
          <span className="badge badge-accent">{currency(job.quoteTotal)}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </header>
      <div className="card-body stack">
        {conflicts.map((conflict) => (
          <p
            key={conflict.message}
            className={conflict.severity === 'error' ? 'note note-danger' : 'note note-warn'}
          >
            {conflict.message}
          </p>
        ))}

        <div className="field-grid">
          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={job.date}
              onChange={(event) => onUpdate({ date: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Start</span>
            <input
              type="time"
              value={job.startTime}
              onChange={(event) => onUpdate({ startTime: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Hours</span>
            <input
              type="number"
              min={0}
              step={0.25}
              value={job.estimatedHours}
              onChange={(event) =>
                onUpdate({ estimatedHours: Math.max(0, Number(event.target.value)) })
              }
            />
          </label>
          <label className="field">
            <span>Truck</span>
            <select
              value={job.truckId ?? ''}
              onChange={(event) => onUpdate({ truckId: event.target.value || null })}
            >
              <option value="">Unassigned</option>
              {FLEET.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={job.status}
              onChange={(event) => onUpdate({ status: event.target.value as JobStatus })}
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <span>Crew · {job.moverIds.length} of {job.recommendedCrew} recommended</span>
          <div className="crew-picker">
            {movers.map((mover) => {
              const on = job.moverIds.includes(mover.id);
              return (
                <label key={mover.id} className={on ? 'crew-option on' : 'crew-option'}>
                  <input type="checkbox" checked={on} onChange={() => toggleMover(mover.id)} />
                  {mover.name}
                  <span className="role">{mover.role}</span>
                </label>
              );
            })}
            {movers.length === 0 && <p className="muted">Add movers under Settings.</p>}
          </div>
        </div>

        <label className="field">
          <span>Notes</span>
          <textarea value={job.notes} onChange={(event) => onUpdate({ notes: event.target.value })} />
        </label>

        <div className="row">
          <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
            Delete job
          </button>
        </div>
      </div>
    </section>
  );
}

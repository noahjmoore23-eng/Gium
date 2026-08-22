import { useState } from 'react';
import type { Mover, MoverRole } from '../domain/schedule';
import type { RateCard } from '../domain/types';

interface RateField {
  key: keyof RateCard;
  label: string;
  help: string;
  step?: number;
  suffix?: string;
}

const LOCAL_FIELDS: RateField[] = [
  { key: 'hourlyPerMover', label: 'Hourly per mover', help: 'Billed per mover, per hour', suffix: '$' },
  { key: 'minimumHours', label: 'Minimum hours', help: 'Floor on any local move', step: 0.5 },
  { key: 'truckFee', label: 'Truck fee', help: 'Per truck, per load', suffix: '$' },
  { key: 'travelFeeHours', label: 'Travel time', help: 'Hours added for the round trip', step: 0.25 },
];

const LONG_FIELDS: RateField[] = [
  { key: 'cwtRate', label: 'Line haul per cwt', help: 'Per 100 lbs of shipment', suffix: '$' },
  { key: 'perMileRate', label: 'Per loaded mile', help: 'On top of the line haul', step: 0.05, suffix: '$' },
  { key: 'fuelSurchargePct', label: 'Fuel surcharge', help: 'Fraction of line haul, e.g. 0.12', step: 0.01 },
  {
    key: 'longDistanceThresholdMiles',
    label: 'Long-distance over',
    help: 'Miles past which pricing switches to weight',
    suffix: 'mi',
  },
];

const ACCESSORIAL_FIELDS: RateField[] = [
  { key: 'stairsFeePerFlight', label: 'Stairs per flight', help: 'Charged at each end', suffix: '$' },
  { key: 'longCarryFee', label: 'Long carry', help: 'Over 75 ft from the truck', suffix: '$' },
  { key: 'shuttleFee', label: 'Shuttle', help: 'Per end needing a shuttle', suffix: '$' },
  {
    key: 'packingMaterialsPerCuFt',
    label: 'Packing materials',
    help: 'Per cubic foot when the crew packs',
    step: 0.05,
    suffix: '$',
  },
  {
    key: 'valuationPerThousand',
    label: 'Valuation',
    help: 'Per $1,000 of declared value',
    step: 0.5,
    suffix: '$',
  },
];

interface SettingsProps {
  company: string;
  rates: RateCard;
  movers: Mover[];
  onCompanyChange: (name: string) => void;
  onRatesChange: (rates: RateCard) => void;
  onMoversChange: (movers: Mover[]) => void;
  onReset: () => void;
}

export function Settings({
  company,
  rates,
  movers,
  onCompanyChange,
  onRatesChange,
  onMoversChange,
  onReset,
}: SettingsProps) {
  const [newMover, setNewMover] = useState('');

  const setRate = (key: keyof RateCard, value: number) => {
    onRatesChange({ ...rates, [key]: Number.isFinite(value) ? value : 0 });
  };

  const addMover = () => {
    const name = newMover.trim();
    if (!name) return;
    onMoversChange([
      ...movers,
      { id: `m-${Date.now().toString(36)}`, name, role: 'mover', maxHoursPerDay: 10 },
    ]);
    setNewMover('');
  };

  const updateMover = (id: string, patch: Partial<Mover>) => {
    onMoversChange(movers.map((mover) => (mover.id === id ? { ...mover, ...patch } : mover)));
  };

  return (
    <div className="stack">
      <section className="card">
        <header>
          <div>
            <h2>Company</h2>
            <p>Shown on quotes and the dispatch board.</p>
          </div>
        </header>
        <div className="card-body">
          <label className="field" style={{ maxWidth: 340 }}>
            <span>Company name</span>
            <input
              type="text"
              value={company}
              onChange={(event) => onCompanyChange(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <header>
          <div>
            <h2>Rate card</h2>
            <p>Every quote is priced from these numbers. Change them once, not per job.</p>
          </div>
        </header>
        <div className="card-body stack">
          <RateGroup title="Local, hourly" fields={LOCAL_FIELDS} rates={rates} onChange={setRate} />
          <RateGroup title="Long distance" fields={LONG_FIELDS} rates={rates} onChange={setRate} />
          <RateGroup
            title="Accessorials"
            fields={ACCESSORIAL_FIELDS}
            rates={rates}
            onChange={setRate}
          />
        </div>
      </section>

      <section className="card">
        <header>
          <div>
            <h2>Crew</h2>
            <p>Daily hour caps drive the utilization and overtime warnings.</p>
          </div>
        </header>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th className="num">Max hrs/day</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {movers.map((mover) => (
                <tr key={mover.id}>
                  <td>
                    <input
                      type="text"
                      value={mover.name}
                      onChange={(event) => updateMover(mover.id, { name: event.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={mover.role}
                      onChange={(event) =>
                        updateMover(mover.id, { role: event.target.value as MoverRole })
                      }
                    >
                      <option value="lead">Lead</option>
                      <option value="mover">Mover</option>
                      <option value="driver">Driver</option>
                    </select>
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={mover.maxHoursPerDay}
                      onChange={(event) =>
                        updateMover(mover.id, {
                          maxHoursPerDay: Math.max(1, Number(event.target.value)),
                        })
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        onMoversChange(movers.filter((entry) => entry.id !== mover.id))
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {movers.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    No movers on the roster yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-body row">
          <input
            type="text"
            placeholder="New mover name"
            value={newMover}
            onChange={(event) => setNewMover(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addMover();
            }}
            style={{ maxWidth: 240 }}
          />
          <button type="button" className="btn" onClick={addMover}>
            Add mover
          </button>
        </div>
      </section>

      <section className="card">
        <header>
          <div>
            <h2>Data</h2>
            <p>Everything is stored in this browser only. Nothing is sent anywhere.</p>
          </div>
        </header>
        <div className="card-body">
          <button type="button" className="btn btn-danger" onClick={onReset}>
            Reset to sample data
          </button>
        </div>
      </section>
    </div>
  );
}

interface RateGroupProps {
  title: string;
  fields: RateField[];
  rates: RateCard;
  onChange: (key: keyof RateCard, value: number) => void;
}

function RateGroup({ title, fields, rates, onChange }: RateGroupProps) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <strong style={{ fontSize: 13 }}>{title}</strong>
      <div className="field-grid">
        {fields.map((field) => (
          <label key={String(field.key)} className="field">
            <span>
              {field.label}
              {field.suffix ? ` (${field.suffix})` : ''}
            </span>
            <input
              type="number"
              min={0}
              step={field.step ?? 1}
              value={rates[field.key]}
              onChange={(event) => onChange(field.key, Number(event.target.value))}
            />
            <small className="muted" style={{ fontSize: 11.5 }}>
              {field.help}
            </small>
          </label>
        ))}
      </div>
    </div>
  );
}

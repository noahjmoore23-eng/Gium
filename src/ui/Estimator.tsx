import { useMemo, useState } from 'react';
import { CATALOG, ROOMS, itemsInRoom } from '../domain/catalog';
import { estimate } from '../domain/estimate';
import { quote, defaultDeclaredValue } from '../domain/pricing';
import type { Job } from '../domain/schedule';
import type { AccessType, Inventory, MoveRequest, RateCard, RoomId, SiteAccess } from '../domain/types';
import { Stat } from './Stat';
import { currency, currencyExact, hours, integer, percent, todayIso } from './format';

const EMPTY_SITE: SiteAccess = { type: 'ground', flights: 0, carryFeet: 20, shuttle: false };

interface EstimatorProps {
  rates: RateCard;
  onBook: (job: Omit<Job, 'id'>) => void;
}

export function Estimator({ rates, onBook }: EstimatorProps) {
  const [inventory, setInventory] = useState<Inventory>({});
  const [room, setRoom] = useState<RoomId>('living');
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState<SiteAccess>(EMPTY_SITE);
  const [destination, setDestination] = useState<SiteAccess>(EMPTY_SITE);
  const [distanceMiles, setDistanceMiles] = useState(15);
  const [packingService, setPackingService] = useState(false);
  const [crewOverride, setCrewOverride] = useState<number | ''>('');
  const [declaredValue, setDeclaredValue] = useState<number | ''>('');

  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [date, setDate] = useState(todayIso());
  const [startTime, setStartTime] = useState('08:00');

  const request: MoveRequest = useMemo(
    () => ({
      inventory,
      origin,
      destination,
      distanceMiles,
      packingService,
      crewSize: crewOverride === '' ? undefined : crewOverride,
    }),
    [inventory, origin, destination, distanceMiles, packingService, crewOverride],
  );

  const est = useMemo(() => estimate(request), [request]);
  const priced = useMemo(
    () => quote(request, est, rates, declaredValue === '' ? undefined : declaredValue),
    [request, est, rates, declaredValue],
  );

  const setQty = (id: string, qty: number) => {
    setInventory((current) => {
      const next = { ...current };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term) return CATALOG.filter((item) => item.name.toLowerCase().includes(term));
    return itemsInRoom(room);
  }, [search, room]);

  const countsByRoom = useMemo(() => {
    const counts: Partial<Record<RoomId, number>> = {};
    for (const [id, qty] of Object.entries(inventory)) {
      const item = CATALOG.find((entry) => entry.id === id);
      if (!item || qty <= 0) continue;
      counts[item.room] = (counts[item.room] ?? 0) + qty;
    }
    return counts;
  }, [inventory]);

  const canBook = customer.trim().length > 0 && est.volumeCuFt > 0;

  const book = () => {
    if (!canBook) return;
    onBook({
      customer: customer.trim(),
      phone: phone.trim(),
      originAddress: originAddress.trim(),
      destinationAddress: destinationAddress.trim(),
      date,
      startTime,
      estimatedHours: priced.kind === 'local' ? priced.billableHours : est.hours.total,
      recommendedCrew: est.crewSize,
      volumeCuFt: est.volumeCuFt,
      quoteTotal: priced.total,
      moverIds: [],
      truckId: est.truckPlan.truck.id,
      status: 'quoted',
      notes: est.flags.join(' '),
    });
    setCustomer('');
    setPhone('');
    setOriginAddress('');
    setDestinationAddress('');
    setInventory({});
  };

  return (
    <div className="split">
      <div className="stack">
        <section className="card">
          <header>
            <div>
              <h2>Inventory</h2>
              <p>Walk the home room by room. Volume drives crew, truck, and hours.</p>
            </div>
            <input
              type="text"
              placeholder="Search all items…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ maxWidth: 220 }}
            />
          </header>

          {search.trim() === '' && (
            <div className="room-tabs">
              {ROOMS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="room-tab"
                  aria-pressed={room === entry.id}
                  onClick={() => setRoom(entry.id)}
                >
                  {entry.label}
                  {countsByRoom[entry.id] ? (
                    <span className="count">{countsByRoom[entry.id]}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          <div className="item-list">
            {visibleItems.map((item) => {
              const qty = inventory[item.id] ?? 0;
              return (
                <div key={item.id} className={qty > 0 ? 'item picked' : 'item'}>
                  <span className="item-name">
                    {item.name}
                    <small>
                      {item.cuFt} cu ft{item.bulky ? ' · bulky' : ''}
                    </small>
                  </span>
                  <span className="stepper">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, qty - 1)}
                      disabled={qty === 0}
                      aria-label={`Remove one ${item.name}`}
                    >
                      −
                    </button>
                    <span className="qty">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, qty + 1)}
                      aria-label={`Add one ${item.name}`}
                    >
                      +
                    </button>
                  </span>
                </div>
              );
            })}
            {visibleItems.length === 0 && <p className="empty">No items match “{search}”.</p>}
          </div>
        </section>

        <section className="card">
          <header>
            <div>
              <h2>Access &amp; distance</h2>
              <p>Stairs, long carries, and shuttles are where estimates go wrong.</p>
            </div>
          </header>
          <div className="card-body stack">
            <SiteFields label="Origin" site={origin} onChange={setOrigin} />
            <SiteFields label="Destination" site={destination} onChange={setDestination} />
            <div className="field-grid">
              <label className="field">
                <span>Distance (mi)</span>
                <input
                  type="number"
                  min={0}
                  value={distanceMiles}
                  onChange={(event) => setDistanceMiles(Math.max(0, Number(event.target.value)))}
                />
              </label>
              <label className="field">
                <span>Crew size</span>
                <select
                  value={crewOverride}
                  onChange={(event) =>
                    setCrewOverride(event.target.value === '' ? '' : Number(event.target.value))
                  }
                >
                  <option value="">Recommended ({est.crewSize})</option>
                  {[2, 3, 4, 5, 6, 7, 8].map((size) => (
                    <option key={size} value={size}>
                      {size} movers
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Declared value</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  placeholder={String(defaultDeclaredValue(est.weightLbs))}
                  value={declaredValue}
                  onChange={(event) =>
                    setDeclaredValue(event.target.value === '' ? '' : Number(event.target.value))
                  }
                />
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={packingService}
                onChange={(event) => setPackingService(event.target.checked)}
              />
              Full-service packing by the crew
            </label>
          </div>
        </section>
      </div>

      <div className="stack">
        <section className="card">
          <header>
            <div>
              <h2>Estimate</h2>
              <p>
                {est.crewSizeSource === 'recommended'
                  ? 'Crew recommended from volume'
                  : 'Crew set manually'}
              </p>
            </div>
            <span className={priced.kind === 'local' ? 'badge badge-accent' : 'badge badge-ok'}>
              {priced.kind === 'local' ? 'Local · hourly' : 'Long distance · weight'}
            </span>
          </header>
          <div className="card-body stack">
            <dl className="stat-grid">
              <Stat label="Volume" value={integer(est.volumeCuFt)} unit="cu ft" />
              <Stat label="Weight" value={integer(est.weightLbs)} unit="lbs" />
              <Stat label="Pieces" value={integer(est.itemCount)} />
              <Stat label="Crew" value={String(est.crewSize)} unit="movers" />
            </dl>

            <div className="table-wrap">
              <table>
                <tbody>
                  {est.hours.pack > 0 && (
                    <tr>
                      <td>Packing</td>
                      <td className="num">{hours(est.hours.pack)}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Load</td>
                    <td className="num">{hours(est.hours.load)}</td>
                  </tr>
                  <tr>
                    <td>Drive</td>
                    <td className="num">{hours(est.hours.drive)}</td>
                  </tr>
                  <tr>
                    <td>Unload</td>
                    <td className="num">{hours(est.hours.unload)}</td>
                  </tr>
                  {est.hours.bulky > 0 && (
                    <tr>
                      <td>Bulky handling</td>
                      <td className="num">{hours(est.hours.bulky)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{priced.kind === 'local' ? 'Billed' : 'On-site total'}</td>
                    <td className="num">
                      {hours(priced.kind === 'local' ? priced.billableHours : est.hours.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {est.truckPlan.truck.label} · {percent(est.truckPlan.utilization)} full
              {est.truckPlan.loads > 1 ? ` · ${est.truckPlan.loads} loads` : ''}
            </p>

            {est.flags.map((flag) => (
              <p key={flag} className="note note-warn">
                {flag}
              </p>
            ))}
          </div>
        </section>

        <section className="card">
          <header>
            <div>
              <h2>Quote</h2>
              <p>Priced from your rate card.</p>
            </div>
            <strong style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
              {currency(priced.total)}
            </strong>
          </header>
          <div className="table-wrap">
            <table>
              <tbody>
                {priced.lineItems.map((item) => (
                  <tr key={item.label}>
                    <td>
                      {item.label}
                      <br />
                      <small className="muted">{item.detail}</small>
                    </td>
                    <td className="num">{currencyExact(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="num">{currencyExact(priced.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="card">
          <header>
            <div>
              <h2>Send to dispatch</h2>
              <p>Creates a quoted job you can crew up on the board.</p>
            </div>
          </header>
          <div className="card-body stack">
            <div className="field-grid">
              <label className="field">
                <span>Customer</span>
                <input
                  type="text"
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  placeholder="Name"
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <label className="field">
                <span>Date</span>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="field">
                <span>Start</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </label>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>From</span>
                <input
                  type="text"
                  value={originAddress}
                  onChange={(event) => setOriginAddress(event.target.value)}
                />
              </label>
              <label className="field">
                <span>To</span>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(event) => setDestinationAddress(event.target.value)}
                />
              </label>
            </div>
            <button type="button" className="btn btn-primary" onClick={book} disabled={!canBook}>
              Add job to dispatch
            </button>
            {!canBook && (
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Add a customer name and at least one item to book this job.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

interface SiteFieldsProps {
  label: string;
  site: SiteAccess;
  onChange: (site: SiteAccess) => void;
}

function SiteFields({ label, site, onChange }: SiteFieldsProps) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <strong style={{ fontSize: 13 }}>{label}</strong>
      <div className="field-grid">
        <label className="field">
          <span>Access</span>
          <select
            value={site.type}
            onChange={(event) => onChange({ ...site, type: event.target.value as AccessType })}
          >
            <option value="ground">Ground floor</option>
            <option value="stairs">Stairs</option>
            <option value="elevator">Elevator</option>
          </select>
        </label>
        <label className="field">
          <span>Flights</span>
          <input
            type="number"
            min={0}
            max={20}
            value={site.flights}
            disabled={site.type !== 'stairs'}
            onChange={(event) => onChange({ ...site, flights: Math.max(0, Number(event.target.value)) })}
          />
        </label>
        <label className="field">
          <span>Carry (ft)</span>
          <input
            type="number"
            min={0}
            step={5}
            value={site.carryFeet}
            onChange={(event) => onChange({ ...site, carryFeet: Math.max(0, Number(event.target.value)) })}
          />
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={site.shuttle}
          onChange={(event) => onChange({ ...site, shuttle: event.target.checked })}
        />
        Shuttle needed — a 26 ft truck cannot reach the door
      </label>
    </div>
  );
}

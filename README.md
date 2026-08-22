# Gium

Estimating and dispatch for moving companies.

Moving companies lose money in two places: **quotes that miss** and **crews that idle**.
An estimator who eyeballs a three-bedroom house and guesses low sends two movers on a
job that needed four, the crew runs into overtime, and the hourly minimum never covers
it. Meanwhile the dispatcher works off a whiteboard and double-books a truck.

Gium is a single web app that closes both gaps: a cube-sheet survey that turns an
inventory into crew size, truck, hours, and a priced quote — and a week board that
catches the scheduling conflicts before the trucks roll.

## What it does

**Estimate.** Walk the home room by room and tap items into an 82-item cube sheet with
standard carrier volumes. As you go it computes packed volume, shipment weight, the
recommended crew, the smallest truck that fits, and a phase-by-phase hour breakdown
(pack, load, drive, unload, bulky handling). Access conditions at each end — stairs,
elevators, long carries, shuttle requirements — feed the labor model rather than being
bolted on at the end, because that is where estimates actually go wrong.

**Quote.** Every estimate prices straight off your rate card. Under 100 miles it bills
hourly against a minimum; past that it switches to weight-based line haul plus mileage
and fuel surcharge, the way an interstate move is actually tariffed. Accessorials,
packing materials, and full-value protection come through as their own line items so
the customer can see what drove the number.

**Dispatch.** Quoted jobs land on a Monday-to-Sunday board. Assign movers and trucks,
and the app continuously checks the whole week for problems: a mover on two overlapping
jobs, a truck double-booked, someone scheduled past their daily hour cap, a job that is
understaffed against its own estimate. Blocking conflicts are errors; the ones that only
cost money are warnings. Per-day meters and week totals show utilization and revenue per
crew hour.

**Settings.** One rate card drives every quote. Change the hourly rate once instead of
per job. The crew roster's daily hour caps are what the overtime and utilization
warnings are measured against.

Everything is stored in the browser's `localStorage`. There is no backend and no
account — nothing leaves the machine it runs on.

## Running it

```bash
npm install
npm run dev        # dev server
npm test           # domain test suite
npm run build      # production build to dist/
```

`npm run build` emits a static site; any static host will serve it.

## How the estimate is calculated

The numbers are not arbitrary — each is a documented constant in `src/domain/`:

| Quantity | Basis |
| --- | --- |
| Weight | 7 lbs per cubic foot, the household-goods density carriers use to convert a survey to billable weight |
| Loading | 110 cu ft per mover-hour, including padding and wrapping |
| Unloading | 140 cu ft per mover-hour — faster, since nothing has to be wrapped |
| Packing | 55 cu ft per mover-hour for full-service packing |
| Stairs | +15% to that end's handling time, per flight |
| Elevator | +20% to that end's handling time |
| Long carry | +10% per 50 ft beyond 75 ft from the truck |
| Shuttle | +35% to that end's handling time |
| Bulky items | +0.5 crew-hours each for disassembly or special equipment |
| Crew size | Tiered by volume, sized to keep the job inside one working day |

Local moves bill in quarter-hour increments and never below the rate card's minimum.

## Layout

```
src/
  domain/          Pure TypeScript — no React, fully unit tested
    types.ts       Domain types
    catalog.ts     82-item cube sheet with standard volumes
    estimate.ts    Volume, weight, crew, truck, and labor hours
    pricing.ts     Rate card, local vs. long-distance, accessorials
    schedule.ts    Jobs, crews, conflict detection, utilization
    storage.ts     localStorage persistence with seed data
  ui/              React views
    Estimator.tsx  Inventory survey, access, quote
    Dispatch.tsx   Week board and job editor
    Settings.tsx   Rate card and crew roster
```

The domain layer holds every calculation and knows nothing about React, so the pricing
and scheduling rules are tested directly rather than through the interface.

## Tests

```bash
npm test
```

67 tests across the estimator, pricing engine, and scheduler — tier boundaries, stacked
access penalties, the local/long-distance switch, hourly minimums, overlapping-job
detection, daily hour caps, and utilization math.

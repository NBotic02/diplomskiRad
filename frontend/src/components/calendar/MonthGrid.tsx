import { useMemo } from 'react';
import { Tooltip, Typography } from 'antd';
import type { Agent, AgentSchedule, Shift } from '@/types/api';
import {
  DAY_NAMES_SHORT, addDays, isSameDay, isoDow, paletteFor, startOfWeek,
} from './shiftHelpers';

const { Text } = Typography;

interface MonthGridProps {
  /** Any date inside the month to render. */
  monthAnchor: Date;
  agents:      Agent[];
  shifts:      Shift[];
  /** Per-agent active schedule list, keyed by agentId. */
  schedulesByAgent: Map<string, AgentSchedule[]>;
  /** Click a date cell → e.g. switch to week view containing that date. */
  onDayClick?:  (date: Date) => void;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface DayCell {
  date:        Date;
  inMonth:     boolean;
  coverage:    number;          // total agents on shift that day
  shiftKinds:  Set<string>;     // 'morning' | 'evening' | 'oncall' …
}

/** Month heatmap, 7×6 grid coloured by agent coverage per day. */
export function MonthGrid({ monthAnchor, agents, shifts, schedulesByAgent, onDayClick }: MonthGridProps) {
  const cells = useMemo<DayCell[]>(() => {
    const firstOfMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const gridStart    = startOfWeek(firstOfMonth);
    const out: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = addDays(gridStart, i);
      const dow  = isoDow(date);
      const inMonth = date.getMonth() === monthAnchor.getMonth();

      const kinds = new Set<string>();
      let coverage = 0;
      for (const a of agents) {
        const scheds = schedulesByAgent.get(a.agentId) ?? [];
        for (const s of scheds) {
          if (!s.isActive) continue;
          const shift = shifts.find(x => x.shiftId === s.shiftId);
          if (!shift || !shift.daysOfWeek.includes(dow)) continue;
          coverage += 1;
          kinds.add(paletteFor(shift.name).kind);
        }
      }
      out.push({ date, inMonth, coverage, shiftKinds: kinds });
    }
    return out;
  }, [monthAnchor, agents, shifts, schedulesByAgent]);

  const toneFor = (n: number): string => {
    if (n === 0) return '#fafafa';
    if (n <= 2)  return '#fef3c7';
    if (n <= 4)  return '#fde68a';
    if (n <= 6)  return '#fcd34d';
    if (n <= 9)  return '#fbbf24';
    return '#f59e0b';
  };

  const today = new Date();

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6,
        marginBottom: 6,
      }}>
        {DAY_NAMES_SHORT.map(d => (
          <div key={d} style={{
            fontSize: 11, fontWeight: 600, color: '#71717a',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            textAlign: 'center', padding: '4px 0',
          }}>{d}</div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6,
      }}>
        {cells.map((c, i) => {
          const isToday = isSameDay(c.date, today);
          return (
            <Tooltip key={i} title={
              <span>
                {c.date.toDateString()}<br />
                {c.coverage === 0
                  ? 'No coverage'
                  : `${c.coverage} agent${c.coverage > 1 ? 's' : ''} on shift`}
              </span>
            }>
              <div
                onClick={() => onDayClick?.(c.date)}
                style={{
                  background:   c.inMonth ? toneFor(c.coverage) : '#fff',
                  border:       isToday ? '2px solid #d97706' : '1px solid #e4e4e7',
                  opacity:      c.inMonth ? 1 : 0.4,
                  borderRadius: 8,
                  padding:      '8px 10px',
                  minHeight:    72,
                  cursor:       onDayClick ? 'pointer' : 'default',
                  display:      'flex',
                  flexDirection:'column',
                  justifyContent:'space-between',
                  transition:   'transform 80ms ease',
                }}
                onMouseEnter={e => onDayClick &&
                  (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => onDayClick &&
                  (e.currentTarget.style.transform = 'none')}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#92400e' : c.inMonth ? '#18181b' : '#a1a1aa',
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  }}>{c.date.getDate()}</span>
                  {c.coverage > 0 && (
                    <Text className="mono" style={{
                      fontSize: 11, color: '#52525b',
                    }}>{c.coverage}</Text>
                  )}
                </div>

                {c.shiftKinds.size > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from(c.shiftKinds).map(kind => {
                      const pal = paletteFor(kind);
                      return (
                        <span key={kind} style={{
                          width: 14, height: 14, borderRadius: 3,
                          background: pal.bg,
                          border: `1px solid ${pal.border}`,
                          color: pal.text,
                          fontSize: 9, lineHeight: '12px',
                          textAlign: 'center',
                          fontFamily: 'system-ui, sans-serif',
                        }}>{pal.icon}</span>
                      );
                    })}
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div style={{
        marginTop: 10, fontSize: 11, color: '#71717a', textAlign: 'center',
      }}>
        {MONTH_NAMES[monthAnchor.getMonth()]} {monthAnchor.getFullYear()} · click a day to jump to that week
      </div>
    </div>
  );
}

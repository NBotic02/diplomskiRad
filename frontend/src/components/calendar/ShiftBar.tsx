import { Tooltip } from 'antd';
import type { Shift } from '@/types/api';
import { paletteFor, shiftSlices } from './shiftHelpers';

interface ShiftBarProps {
  shift:    Shift;
  /** Slight stack offset for cells with multiple shifts in one day. */
  trackIdx?: number;
}

const TRACK_HEIGHT = 22;
const TRACK_GAP    = 3;

/** Single shift rendered as absolutely-positioned coloured bars in a day cell. */
export function ShiftBar({ shift, trackIdx = 0 }: ShiftBarProps) {
  const slices  = shiftSlices(shift);
  const palette = paletteFor(shift.name);

  if (slices.length === 0) return null;

  const fmt = (t: string) => {
    const [h, m] = t.split(':');
    const hour = String(parseInt(h, 10));
    return m && m !== '00' ? `${hour}:${m}` : hour;
  };
  const range = `${fmt(shift.startTime)}–${fmt(shift.endTime)}`;
  const top = trackIdx * (TRACK_HEIGHT + TRACK_GAP);

  return (
    <>
      {slices.map((slice, i) => {
        const tier: 'wide' | 'medium' | 'narrow' =
            slice.width >= 24 ? 'wide'
          : slice.width >= 10 ? 'medium'
          : 'narrow';
        return (
          <Tooltip key={i} title={`${shift.name} · ${shift.startTime}–${shift.endTime}`}>
            <div
              style={{
                position: 'absolute',
                left:  `${slice.left}%`,
                width: `${slice.width}%`,
                top,
                height: TRACK_HEIGHT,
                background:   palette.bg,
                border:       `1px solid ${palette.border}`,
                color:        palette.text,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '0 4px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {tier !== 'medium' && (
                <span style={{ fontSize: 12, lineHeight: 1, fontFamily: 'system-ui, sans-serif' }}>
                  {palette.icon}
                </span>
              )}
              {tier !== 'narrow' && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{range}</span>
              )}
            </div>
          </Tooltip>
        );
      })}
    </>
  );
}

export const SHIFT_BAR_HEIGHT = TRACK_HEIGHT;
export const SHIFT_BAR_GAP    = TRACK_GAP;

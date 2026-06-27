import type { ArchetypeLabel, YoutuberSignalQuality } from './types';

const ARCHETYPE_DESCRIPTIONS: Record<ArchetypeLabel, string> = {
  'First Mover': 'Covers stocks before most other tracked channels — likely doing independent research',
  'Momentum Trader': 'Makes calls during price surges and high-volume periods, short time horizon',
  'Value Investor': 'Returns to the same stocks repeatedly over months — patient, conviction-based style',
  'Macro Caller': 'Covers a wide breadth of stocks, macro-driven thesis connecting many names',
};

export function computeArchetype(signals: YoutuberSignalQuality): ArchetypeLabel {
  if (signals.first_mover_pct > 50) return 'First Mover';
  if (signals.total_stocks_covered >= 20 && signals.total_mentions / signals.total_stocks_covered < 2) {
    return 'Macro Caller';
  }
  if (signals.contrarian_pct > 0.4) return 'Momentum Trader';
  return 'Value Investor';
}

export function archetypeDescription(label: ArchetypeLabel): string {
  return ARCHETYPE_DESCRIPTIONS[label];
}

export function archetypeColor(label: ArchetypeLabel): string {
  switch (label) {
    case 'First Mover': return '#8B6FA8';
    case 'Momentum Trader': return '#B05C44';
    case 'Value Investor': return '#3F7D58';
    case 'Macro Caller': return '#5C7A9E';
  }
}

export function archetypeFromSlug(slug: string | null): ArchetypeLabel | null {
  switch (slug) {
    case 'first_mover_scout': return 'First Mover';
    case 'momentum_trader': return 'Momentum Trader';
    case 'value_investor': return 'Value Investor';
    case 'macro_caller': return 'Macro Caller';
    default: return null;
  }
}

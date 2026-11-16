/**
 * Formats a raw token string for clear human display:
 * Replaces leading/trailing spaces with visual space characters (· or ␣)
 * and newlines with \n.
 */
export function formatTokenDisplay(token: string): { display: string; isSpecial: boolean } {
  if (token === '') return { display: '⟨empty⟩', isSpecial: true };
  if (token === '\n') return { display: '↵ [newline]', isSpecial: true };
  if (token === '\t') return { display: '⇥ [tab]', isSpecial: true };
  if (token === ' ') return { display: '␣ [space]', isSpecial: true };

  // If token starts with space, highlight it
  let display = token;
  if (display.startsWith(' ')) {
    display = '·' + display.slice(1);
  }
  display = display.replace(/\n/g, '↵');

  return { display, isSpecial: token.startsWith(' ') || token.includes('\n') };
}

/**
 * Returns color classes based on token probability
 */
export function getProbabilityColor(prob: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
  label: string;
} {
  if (prob >= 0.7) {
    return {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      ring: 'ring-emerald-500/50',
      label: 'Confident',
    };
  } else if (prob >= 0.3) {
    return {
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      ring: 'ring-amber-500/50',
      label: 'Medium',
    };
  } else {
    return {
      bg: 'bg-rose-950/60',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      ring: 'ring-rose-500/50',
      label: 'Uncertain',
    };
  }
}

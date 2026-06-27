const MS_PER_DAY = 86_400_000;

export function daysSince(dateStr: string, relativeTo?: Date): number {
  const ref = relativeTo ?? new Date();
  return Math.round((ref.getTime() - new Date(dateStr).getTime()) / MS_PER_DAY);
}

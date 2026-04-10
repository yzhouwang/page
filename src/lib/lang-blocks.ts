/** Number of filled Mondrian blocks for a proficiency percentage (0-100). */
export function filledBlocks(proficiency: number, total = 5): number {
  return Math.round(proficiency / (100 / total));
}

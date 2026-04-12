import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (_tree: Root, file: { data: { astro: { frontmatter: Record<string, unknown> } } }) {
    const text = toString(_tree);
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    file.data.astro.frontmatter.minutesRead = `${minutes} min read`;
  };
}

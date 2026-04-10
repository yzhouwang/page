import { defineCollection, z } from 'astro:content';

const papers = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    year: z.number(),
    authors: z.string(),
    meta: z.string(),
    priority: z.number(),
    color: z.enum(['blue', 'coral', 'yellow', 'surface']),
  }),
});

const projects = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    icon: z.string(),
    label: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    priority: z.number(),
    color: z.enum(['blue', 'coral', 'yellow', 'surface']),
  }),
});

const languages = defineCollection({
  type: 'data',
  schema: z.object({
    glyph: z.string(),
    name: z.string(),
    level: z.enum(['native', 'fluent', 'intermediate']),
    proficiency: z.number(),
    priority: z.number(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    description: z.string(),
  }),
});

export const collections = { papers, projects, languages, blog };

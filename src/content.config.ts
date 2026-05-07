import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
	logs: defineCollection({
		loader: glob({ base: './src/content/logs', pattern: '**/*.md' }),
		schema: z.object({
			project: z.string(),
			title: z.string(),
			date: z.coerce.date(),
			summary: z.string(),
			tags: z.array(z.string()).optional(),
			img: z.string().optional(),
			img_alt: z.string().optional(),
			lang: z.enum(['en', 'es']).default('en'),
			translation_of: z.string().optional(),
		}),
	}),
	work: defineCollection({
		loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
		schema: z.object({
			title: z.string(),
			description: z.string(),
			publishDate: z.coerce.date(),
			tags: z.array(z.string()),
			img: z.string().optional(),
			img_alt: z.string().optional(),
			status: z.enum(['idea', 'in progress', 'prototyping', 'completed']).optional(),
			url: z.string().optional(),
			hidden: z.boolean().default(false),
		}),
	}),
	publications: defineCollection({
		loader: glob({ base: './src/content/publications', pattern: '**/*.md' }),
		schema: z.object({
			title: z.string(),
			authors: z.string(),
			venue: z.string(),
			year: z.number(),
			abstract: z.string().optional(),
			pdf: z.string().optional(),
			poster: z.string().optional(),
			code: z.string().optional(),
			project: z.string().optional(),
			featured: z.boolean().default(false),
			hidden: z.boolean().default(false),
		}),
	}),
	research: defineCollection({
		loader: glob({ base: './src/content/research', pattern: '**/*.md' }),
		schema: z.object({
			title: z.string(),
			title_es: z.string(),
			description: z.string(),
			description_es: z.string(),
			status: z.enum(['active', 'paused', 'completed']),
			order: z.number().default(0),
		}),
	}),
};

'use server';
/**
 * @fileOverview An AI agent to assist administrators in generating SEO-optimized product descriptions, dynamic metadata, and Open Graph tags.
 *
 * - adminGenerateSeoContent - A function that handles the generation of SEO content for products.
 * - AdminGenerateSeoContentInput - The input type for the adminGenerateSeoContent function.
 * - AdminGenerateSeoContentOutput - The return type for the adminGenerateSeoContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdminGenerateSeoContentInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('The current product description or a brief overview.'),
  category: z.string().describe('The main category of the product.'),
  subCategory: z.string().optional().describe('The subcategory of the product, if applicable.'),
  price: z.number().positive().describe('The price of the product.'),
  features: z.array(z.string()).optional().describe('A list of key features and benefits of the product.'),
  keywords: z.array(z.string()).optional().describe('Existing keywords related to the product.'),
  imageUrls: z.array(z.string()).optional().describe('URLs of product images. The first image will be considered for Open Graph.'),
});
export type AdminGenerateSeoContentInput = z.infer<typeof AdminGenerateSeoContentInputSchema>;

const AdminGenerateSeoContentOutputSchema = z.object({
  seoDescription: z.string().describe('An SEO-optimized, engaging product description, up to 1000 characters.'),
  metaTitle: z.string().max(60).describe('A concise and keyword-rich meta title for search engines, typically 50-60 characters.'),
  metaDescription: z.string().max(160).describe('An informative and compelling meta description for search engines, typically 150-160 characters.'),
  metaKeywords: z.array(z.string()).describe('A list of relevant keywords to improve search engine visibility.'),
  ogTitle: z.string().describe('The Open Graph title for social media sharing.'),
  ogDescription: z.string().describe('The Open Graph description for social media sharing.'),
  ogImageUrl: z.string().url().optional().describe('The URL of the image to be used for Open Graph sharing. Should be the primary product image.'),
});
export type AdminGenerateSeoContentOutput = z.infer<typeof AdminGenerateSeoContentOutputSchema>;

export async function adminGenerateSeoContent(input: AdminGenerateSeoContentInput): Promise<AdminGenerateSeoContentOutput> {
  return adminGenerateSeoContentFlow(input);
}

const adminGenerateSeoContentPrompt = ai.definePrompt({
  name: 'adminGenerateSeoContentPrompt',
  input: { schema: AdminGenerateSeoContentInputSchema },
  output: { schema: AdminGenerateSeoContentOutputSchema },
  prompt: `You are an expert e-commerce SEO specialist and content creator for NexGenShop. Your task is to generate highly optimized product content for search engines and social media.

Based on the following product details, create:
1.  An SEO-optimized product description (max 1000 characters), engaging and keyword-rich.
2.  A concise meta title (50-60 characters) that includes primary keywords.
3.  An informative meta description (150-160 characters) that encourages clicks.
4.  A list of relevant meta keywords.
5.  Open Graph title, description, and an image URL (if available) for social media sharing.

Product Details:
Product Name: {{{productName}}}
Category: {{{category}}}{{#if subCategory}} / {{{subCategory}}}{{/if}}
Price: $ {{{price}}}
Product Description: {{{productDescription}}}
{{#if features}}
Key Features:
{{#each features}}- {{{this}}}
{{/each}}
{{/if}}
{{#if keywords}}
Existing Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if imageUrls}}
Product Image URLs: {{#each imageUrls}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

Consider the tone to be professional, trustworthy, and engaging, aligning with the brand identity of NexGenShop.
Ensure the output is in the requested JSON format, strictly adhering to character limits for meta fields.
For 'ogImageUrl', if multiple image URLs are provided, use the first one from the 'imageUrls' list.
`,
});

const adminGenerateSeoContentFlow = ai.defineFlow(
  {
    name: 'adminGenerateSeoContentFlow',
    inputSchema: AdminGenerateSeoContentInputSchema,
    outputSchema: AdminGenerateSeoContentOutputSchema,
  },
  async (input) => {
    const { output } = await adminGenerateSeoContentPrompt(input);
    if (!output) {
      throw new Error('Failed to generate SEO content.');
    }
    return output;
  }
);

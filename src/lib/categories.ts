/**
 * Category lookup helpers for the static game catalog.
 * These queries expose the category list used by Astro pages and components.
 */
import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';
import type { Database } from './db';

/**
 * Retrieves every category in alphabetical order by name.
 *
 * @param db - Database client used to query the category records.
 * @returns A list of categories with their stable ids and display names.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));
}

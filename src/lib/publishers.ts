/**
 * Publisher lookup helpers for the static game catalog.
 * These queries expose the publisher list used by Astro pages and components.
 */
import { asc } from 'drizzle-orm';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';
import type { Database } from './db';

/**
 * Retrieves every publisher in alphabetical order by name.
 *
 * @param db - Database client used to query the publisher records.
 * @returns A list of publishers with their stable ids and display names.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));
}

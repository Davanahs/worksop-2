import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getFilteredGames,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('filters games by category and publisher together', async () => {
        const [strategy] = await db
            .insert(categories)
            .values([
                { name: 'Strategy', description: 'strategy' },
                { name: 'Puzzle', description: 'puzzle' },
            ])
            .returning({ id: categories.id, name: categories.name });
        const [codeForge] = await db
            .insert(publishers)
            .values([
                { name: 'CodeForge Studios', description: 'code forge' },
                { name: 'DevMasters Inc.', description: 'dev masters' },
            ])
            .returning({ id: publishers.id, name: publishers.name });
        const categoryRows = await db.select().from(categories);
        const publisherRows = await db.select().from(publishers);
        const puzzle = categoryRows.find((row) => row.name === 'Puzzle');
        const devMasters = publisherRows.find((row) => row.name === 'DevMasters Inc.');

        await db.insert(games).values([
            { title: 'Zeta Strategy', description: 'z', starRating: 4, categoryId: strategy.id, publisherId: codeForge.id },
            { title: 'Alpha Strategy', description: 'a', starRating: 4, categoryId: strategy.id, publisherId: codeForge.id },
            { title: 'Puzzle Game', description: 'p', starRating: 4, categoryId: puzzle!.id, publisherId: devMasters!.id },
        ]);

        const filtered = await getFilteredGames(db, {
            categoryId: strategy.id,
            publisherId: codeForge.id,
        });
        expect(filtered.map((game) => game.title)).toEqual(['Alpha Strategy', 'Zeta Strategy']);
    });

    it('filters games by category alone', async () => {
        await seedGames(db, 2);
        const [puzzle] = await db
            .insert(categories)
            .values({ name: 'Puzzle', description: 'puzzle' })
            .returning({ id: categories.id });
        const [publisher] = await db.select().from(publishers);
        await db.insert(games).values({
            title: 'Puzzle Game',
            description: 'p',
            starRating: 4,
            categoryId: puzzle.id,
            publisherId: publisher.id,
        });

        const filtered = await getFilteredGames(db, { categoryId: puzzle.id });
        expect(filtered.map((game) => game.title)).toEqual(['Puzzle Game']);
    });

    it('filters games by publisher alone', async () => {
        await seedGames(db, 2);
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Second Publisher', description: 'second' })
            .returning({ id: publishers.id });
        const [category] = await db.select().from(categories);
        await db.insert(games).values({
            title: 'Second Publisher Game',
            description: 'p',
            starRating: 4,
            categoryId: category.id,
            publisherId: publisher.id,
        });

        const filtered = await getFilteredGames(db, { publisherId: publisher.id });
        expect(filtered.map((game) => game.title)).toEqual(['Second Publisher Game']);
    });

    it('returns an empty list when filters have no matches', async () => {
        await seedGames(db, 2);
        expect(await getFilteredGames(db, { categoryId: 99999 })).toEqual([]);
    });
});

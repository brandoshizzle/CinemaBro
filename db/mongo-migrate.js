// migrate.mjs  —  run with: node migrate.mjs
import { parse } from 'csv-parse/sync';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });  // Load environment variables from .env file

console.log('Starting migration...');
console.log(process.env.MONGODB_URI ? '✓ MongoDB URI loaded from environment' : '✗ MONGODB_URI not set in environment');



const ATLAS_URI = process.env.MONGODB_URI;
const DB_NAME = 'CinemaBro';

function csv (file) {
	return parse(fs.readFileSync(file), { columns: true, skip_empty_lines: true });
}

const client = new MongoClient(ATLAS_URI);
await client.connect();
const db = client.db(DB_NAME);

// ── 1. Movies ─────────────────────────────────────────────────────────────
// Keep a map of old BIGSERIAL id → new ObjectId for foreign key rewiring
const movieIdMap = new Map();

const movies = csv('movies_rows.csv').map(row => {
	const oid = new ObjectId();
	movieIdMap.set(row.id, oid);
	return { _id: oid, name: row.name, year: row.year ? Number(row.year) : null };
});
if (movies.length) await db.collection('movies').insertMany(movies);
console.log(`✓ ${movies.length} movies`);

// ── 2. Guild movies lookup (for embedding) ────────────────────────────────
const guildMoviesMap = new Map();   // guild_id → [ObjectId, ...]
for (const row of csv('guild_movies_rows.csv')) {
	if (!guildMoviesMap.has(row.guild_id)) guildMoviesMap.set(row.guild_id, []);
	const oid = movieIdMap.get(row.movie_id);
	if (oid) guildMoviesMap.get(row.guild_id).push(oid);
}

// ── 3. Guilds ─────────────────────────────────────────────────────────────
const guilds = csv('guilds_rows.csv').map(row => ({
	_id: row.id,
	name: row.name,
	latest_movie: row.latest_movie ? movieIdMap.get(row.latest_movie) ?? null : null,
	blacklist: row.blacklist ? JSON.parse(row.blacklist.replace(/^{|}$/g, '').split(',').map(s => `"${s.trim()}"`).join(',').replace(/^/, '[').replace(/$/, ']')) : [],
	movies: guildMoviesMap.get(row.id) ?? [],
}));
if (guilds.length) await db.collection('guilds').insertMany(guilds);
console.log(`✓ ${guilds.length} guilds`);

// ── 4. Users ──────────────────────────────────────────────────────────────
const users = csv('users_rows.csv').map(row => ({
	_id: row.id,
	latest_movie: row.latest_movie ? movieIdMap.get(row.latest_movie) ?? null : null,
	wishlist: row.wishlist ? row.wishlist.replace(/^{|}$/g, '').split(',').filter(Boolean) : [],
}));
if (users.length) await db.collection('users').insertMany(users);
console.log(`✓ ${users.length} users`);

// ── 5. Ratings ────────────────────────────────────────────────────────────
const ratings = csv('ratings_rows.csv').map(row => ({
	_id: { user_id: row.user_id, movie_id: movieIdMap.get(row.movie_id) },
	rating: Number(row.rating),
}));
if (ratings.length) await db.collection('ratings').insertMany(ratings);
console.log(`✓ ${ratings.length} ratings`);

// ── 6. Indexes ────────────────────────────────────────────────────────────
await db.collection('movies').createIndex({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
await db.collection('ratings').createIndex({ '_id.movie_id': 1 });
await db.collection('ratings').createIndex({ '_id.user_id': 1 });
console.log('✓ indexes created');

await client.close();
console.log('Migration complete.');
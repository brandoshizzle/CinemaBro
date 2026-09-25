require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const { Ratings, Movies } = require('../schema/schema');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
	console.error('❌ MONGODB_URI environment variable is not set!');
	process.exit(1);
}

/**
 * MONGODB DATABASE
 */
// Keep DNS behavior explicit for local Windows development only.
// In production, rely on the platform resolver for Atlas SRV lookups.
if (process.platform === 'win32') {
	dns.setDefaultResultOrder('ipv4first');
	dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);
}

// Connect to MongoDB
mongoose.connect(mongoUri);

const db = mongoose.connection;

db.on('error', (error) => {
	console.error('MongoDB connection error:', error);
	process.exit(1);
});

db.once('open', async () => {
	console.log('✓ Connected to MongoDB');
	try {
		await migrateRatings();
		console.log('✓ Migration completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('❌ Migration failed:', error.message);
		process.exit(1);
	}
});

async function migrateRatings () {
	console.log('📖 Reading CSV files...');

	// Read movies_rows.csv to create a mapping of old movie_id -> movie name
	const movieMap = await readMoviesCSV();
	console.log(`✓ Loaded ${Object.keys(movieMap).length} movies from CSV`);
	const movieNames = [...new Set(Object.values(movieMap))];
	const movies = await Movies.find({ name: { $in: movieNames } }).select({ name: 1 }).lean();
	const movieIdsByName = new Map(movies.map((movie) => [movie.name, movie._id]));

	// Read ratings_rows.csv and process each rating
	const ratings = [];
	let processedCount = 0;
	let skippedCount = 0;

	for await (const row of fs.createReadStream(path.join(__dirname, 'ratings_rows.csv')).pipe(csv())) {
		const oldMovieId = parseInt(row.movie_id, 10);
		const userId = row.user_id;
		const ratingValue = parseInt(row.rating, 10);

		const movieName = movieMap[oldMovieId];
		if (!movieName) {
			console.warn(`⚠ Movie ID ${oldMovieId} not found in movies_rows.csv, skipping`);
			skippedCount++;
			continue;
		}

		const movieId = movieIdsByName.get(movieName);
		if (!movieId) {
			console.warn(`⚠ Movie "${movieName}" not found in MongoDB, skipping`);
			skippedCount++;
			continue;
		}

		ratings.push({
			_id: {
				user_id: userId,
				movie_id: movieId,
			},
			rating: ratingValue,
		});

		processedCount++;
		if (processedCount % 100 === 0) {
			console.log(`  Processed ${processedCount} ratings...`);
		}
	}

	console.log(`✓ Read ${processedCount} ratings from CSV (${skippedCount} skipped)`);

	// Insert ratings into MongoDB
	if (ratings.length > 0) {
		console.log(`📝 Inserting ${ratings.length} ratings into MongoDB...`);
		try {
			const result = await Ratings.bulkWrite(ratings.map((rating) => ({
				updateOne: {
					filter: { _id: rating._id },
					update: { $set: { rating: rating.rating } },
					upsert: true,
				},
			})), { ordered: true });
			console.log(`✓ Successfully migrated ${ratings.length} ratings (${result.upsertedCount} inserted, ${result.modifiedCount} updated)`);
		} catch (error) {
			console.error('❌ Error inserting ratings:', error.message);
			throw error;
		}
	} else {
		console.log('⚠ No ratings to insert');
	}
}

async function readMoviesCSV () {
	const movieMap = {};

	return new Promise((resolve, reject) => {
		fs.createReadStream(path.join(__dirname, 'movies_rows.csv'))
			.pipe(csv())
			.on('data', (row) => {
				const movieId = parseInt(row.id);
				const movieName = row.name;
				movieMap[movieId] = movieName;
			})
			.on('end', () => resolve(movieMap))
			.on('error', reject);
	});
}

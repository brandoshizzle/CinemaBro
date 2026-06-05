const { Pool } = require('pg');

async function seedDevData () {
	if (process.env.NODE_ENV !== 'development' || process.env.DEV_SEED !== 'true') {
		console.log('Skipping dev seed. Set NODE_ENV=development and DEV_SEED=true to enable.');
		return;
	}

	if (!process.env.DATABASE_URL) {
		console.log('Skipping dev seed. DATABASE_URL is not set.');
		return;
	}

	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const guildId = process.env.DISCORD_GUILD_ID || 'dev-guild';

	const users = [
		{ id: 'dev-user-1', latest_movie: null, wishlist: ['The Matrix'] },
		{ id: 'dev-user-2', latest_movie: null, wishlist: ['Arrival'] },
		{ id: 'dev-user-3', latest_movie: null, wishlist: ['Interstellar'] }
	];

	const movies = [
		{ name: 'The Matrix', year: 1999 },
		{ name: 'Arrival', year: 2016 },
		{ name: 'Interstellar', year: 2014 }
	];

	const ratings = [
		{ userId: 'dev-user-1', movieName: 'The Matrix', rating: 92 },
		{ userId: 'dev-user-1', movieName: 'Arrival', rating: 88 },
		{ userId: 'dev-user-2', movieName: 'Arrival', rating: 90 },
		{ userId: 'dev-user-2', movieName: 'Interstellar', rating: 86 },
		{ userId: 'dev-user-3', movieName: 'The Matrix', rating: 94 },
		{ userId: 'dev-user-3', movieName: 'Interstellar', rating: 93 }
	];

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		for (const movie of movies) {
			await client.query(
				`INSERT INTO movies (name, year)
				 VALUES ($1, $2)
				 ON CONFLICT (name)
				 DO UPDATE SET year = EXCLUDED.year`,
				[movie.name, movie.year]
			);
		}

		const movieLookupResult = await client.query('SELECT id, name FROM movies WHERE name = ANY($1::text[])', [movies.map(movie => movie.name)]);
		const movieIdByName = movieLookupResult.rows.reduce((acc, row) => {
			acc[row.name] = row.id;
			return acc;
		}, {});

		const latestMovieId = movieIdByName.Interstellar || null;
		for (const user of users) {
			await client.query(
				`INSERT INTO users (id, latest_movie, wishlist)
				 VALUES ($1, $2, $3::text[])
				 ON CONFLICT (id)
				 DO UPDATE SET latest_movie = EXCLUDED.latest_movie, wishlist = EXCLUDED.wishlist`,
				[user.id, latestMovieId, user.wishlist]
			);
		}

		await client.query(
			`INSERT INTO guilds (id, name, latest_movie, blacklist)
			 VALUES ($1, $2, $3, '{}'::text[])
			 ON CONFLICT (id)
			 DO UPDATE SET name = EXCLUDED.name, latest_movie = EXCLUDED.latest_movie`,
			[guildId, 'Dev Cinema Guild', latestMovieId]
		);

		for (const movieId of Object.values(movieIdByName)) {
			await client.query(
				`INSERT INTO guild_movies (guild_id, movie_id)
				 VALUES ($1, $2)
				 ON CONFLICT (guild_id, movie_id)
				 DO NOTHING`,
				[guildId, movieId]
			);
		}

		for (const row of ratings) {
			const movieId = movieIdByName[row.movieName];
			if (!movieId) {
				throw new Error(`Movie not found during seed: ${row.movieName}`);
			}
			await client.query(
				`INSERT INTO ratings (user_id, movie_id, rating)
				 VALUES ($1, $2, $3)
				 ON CONFLICT (user_id, movie_id)
				 DO UPDATE SET rating = EXCLUDED.rating`,
				[row.userId, movieId, row.rating]
			);
		}

		await client.query('COMMIT');
		console.log('Dev seed complete: 3 users, 3 movies, and ratings inserted/updated.');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

seedDevData().catch(error => {
	console.error('Dev seed failed:', error);
	process.exit(1);
});

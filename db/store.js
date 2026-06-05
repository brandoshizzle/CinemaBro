const { databaseUrl } = require('../config');
const supabase = require('../db');
const postgres = require('./postgres');

function isPostgresEnabled () {
	return Boolean(databaseUrl);
}

async function getAllMovies () {
	if (isPostgresEnabled()) {
		const result = await postgres.query('SELECT id::text AS id, name FROM movies');
		return { movies: result.rows, error: null };
	}

	const { data, error } = await supabase
		.from('movies')
		.select('id, name');

	if (data && data.length > 0) {
		return {
			movies: data.map(movie => ({ ...movie, id: String(movie.id) })),
			error
		};
	}

	return { movies: null, error };
}

async function getUserWishlist (userId) {
	if (isPostgresEnabled()) {
		const result = await postgres.query(
			'SELECT id, wishlist FROM users WHERE id = $1',
			[userId]
		);
		if (result.rows.length === 0) {
			return { user: null, error: null };
		}
		return { user: result.rows[0], error: null };
	}

	const { data, error } = await supabase
		.from('users')
		.select('id, wishlist')
		.eq('id', userId);

	if (error) {
		return { user: null, error };
	}

	if (!data || data.length === 0) {
		return { user: null, error: null };
	}

	return { user: data[0], error: null };
}

async function appendUserWishlistItem (userId, movieTitle) {
	if (isPostgresEnabled()) {
		const result = await postgres.query(
			`INSERT INTO users (id, wishlist)
			 VALUES ($1, ARRAY[$2]::text[])
			 ON CONFLICT (id)
			 DO UPDATE SET wishlist = COALESCE(users.wishlist, '{}'::text[]) || EXCLUDED.wishlist
			 RETURNING id, wishlist`,
			[userId, movieTitle]
		);
		return { user: result.rows[0], error: null };
	}

	const { user, error: readError } = await getUserWishlist(userId);
	if (readError) {
		return { user: null, error: readError };
	}

	const wishlist = Array.isArray(user?.wishlist) ? user.wishlist : [];
	wishlist.push(movieTitle);

	const { data, error } = await supabase
		.from('users')
		.upsert({ id: userId, wishlist })
		.select('id, wishlist');

	if (error) {
		return { user: null, error };
	}

	return { user: data?.[0] || null, error: null };
}

module.exports = {
	getAllMovies,
	getUserWishlist,
	appendUserWishlistItem,
	isPostgresEnabled
};

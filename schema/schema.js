const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Movies ──────────────────────────────────────────────
const movieSchema = new Schema({
	name: { type: String, required: true, unique: true },
	year: { type: Number },
}, { collection: 'movies' });

// ── Users ────────────────────────────────────────────────
const userSchema = new Schema({
	_id: { type: String },   // Discord user ID
	latest_movie: { type: Schema.Types.ObjectId, ref: 'Movies' },
	wishlist: { type: [String], default: [] },
}, { collection: 'users' });

// ── Guilds ───────────────────────────────────────────────
const guildSchema = new Schema({
	_id: { type: String },   // Discord guild ID
	name: { type: String, required: true },
	latest_movie: { type: Schema.Types.ObjectId, ref: 'Movies' },
	blacklist: { type: [String], default: [] },
	movies: { type: [Schema.Types.ObjectId], ref: 'Movies', default: [] },
}, { collection: 'guilds' });

// ── Ratings ──────────────────────────────────────────────
const ratingSchema = new Schema({
	_id: {
		user_id: { type: String, required: true },
		movie_id: { type: Schema.Types.ObjectId, required: true, ref: 'Movies' },
	},
	rating: { type: Number, required: true, min: 0, max: 100 },
}, { collection: 'ratings' });

ratingSchema.index({ '_id.movie_id': 1 });  // replaces idx_ratings_movie_id
ratingSchema.index({ '_id.user_id': 1 });  // replaces idx_ratings_user_id

module.exports = {
	Movies: mongoose.model('Movies', movieSchema),
	Users: mongoose.model('Users', userSchema),
	Guilds: mongoose.model('Guilds', guildSchema),
	Ratings: mongoose.model('Ratings', ratingSchema)
}
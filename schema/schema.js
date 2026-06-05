const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Movies ──────────────────────────────────────────────
const movieSchema = new Schema({
	name: { type: String, required: true, unique: true },
	year: { type: Number },
});
movieSchema.index({ name: 1 });  // replaces idx_movies_name_lower (use collation instead)

// ── Users ────────────────────────────────────────────────
const userSchema = new Schema({
	_id: { type: String },   // Discord user ID
	latest_movie: { type: Schema.Types.ObjectId, ref: 'Movie' },
	wishlist: { type: [String], default: [] },
}, { _id: false });

// ── Guilds ───────────────────────────────────────────────
const guildSchema = new Schema({
	_id: { type: String },   // Discord guild ID
	name: { type: String, required: true },
	latest_movie: { type: Schema.Types.ObjectId, ref: 'Movie' },
	blacklist: { type: [String], default: [] },
	movies: { type: [Schema.Types.ObjectId], ref: 'Movie', default: [] },
}, { _id: false });

// ── Ratings ──────────────────────────────────────────────
const ratingSchema = new Schema({
	_id: {
		user_id: { type: String, required: true },
		movie_id: { type: Schema.Types.ObjectId, required: true, ref: 'Movie' },
	},
	rating: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

ratingSchema.index({ '_id.movie_id': 1 });  // replaces idx_ratings_movie_id
ratingSchema.index({ '_id.user_id': 1 });  // replaces idx_ratings_user_id

module.exports = {
	Movies: mongoose.model('Movie', movieSchema),
	Users: mongoose.model('User', userSchema),
	Guilds: mongoose.model('Guild', guildSchema),
	Ratings: mongoose.model('Rating', ratingSchema)
}
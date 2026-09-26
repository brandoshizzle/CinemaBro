const { SlashCommandBuilder } = require('discord.js');
const { Ratings } = require('../../schema/schema');
const logError = require('../../util/logError');
const getGuildMovies = require('../../util/getGuildMovies');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mystats')
		.setDescription('Get stats about your own movie ratings.'),
	async execute (interaction) {
		await interaction.deferReply();

		let ratings;
		try {
			ratings = await Ratings.find({ '_id.user_id': interaction.user.id })
				.populate({ path: '_id.movie_id', model: 'Movies', select: 'name year' })
				.sort({ rating: -1 })
				.lean();
		} catch (error) {
			console.error('Error fetching user ratings from MongoDB:', error);
			return logError(interaction, `Failed to fetch ratings: ${error.message}`, { edit: true });
		}

		if (ratings.length === 0) {
			return interaction.editReply('You have not rated any movies yet.');
		}

		const mean = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
		const median = ratings[Math.floor(ratings.length / 2)];
		const formatMovie = rating => `${rating.rating.toFixed(1)} ${rating._id.movie_id.name}${rating._id.movie_id.year ? ` (${rating._id.movie_id.year})` : ''}`;
		let movieTwin = 'Unavailable in DMs';
		let guiltyPleasure = 'Unavailable in DMs';

		if (interaction.guild) {
			try {
				const { movies, error } = await getGuildMovies(interaction.guild, 'rating');
				if (error) throw new Error(error);

				const comparisons = new Map();
				let bestGuiltyPleasure = null;

				for (const movie of movies) {
					const ownRating = movie.ratings.find(rating => rating._id.user_id === interaction.user.id);
					if (!ownRating) continue;

					const guildAverage = movie.ratings.reduce((sum, rating) => sum + rating.rating, 0) / movie.ratings.length;
					const difference = ownRating.rating - guildAverage;
					if (!bestGuiltyPleasure || difference > bestGuiltyPleasure.difference) {
						bestGuiltyPleasure = { movie, difference };
					}

					for (const rating of movie.ratings) {
						const memberId = rating._id.user_id;
						if (memberId === interaction.user.id) continue;

						const comparison = comparisons.get(memberId) || { name: rating.name, difference: 0, sharedMovies: 0 };
						comparison.difference += Math.abs(ownRating.rating - rating.rating);
						comparison.sharedMovies++;
						comparisons.set(memberId, comparison);
					}
				}

				const closestMatch = [...comparisons.values()].sort((a, b) =>
					(a.difference / a.sharedMovies) - (b.difference / b.sharedMovies) || b.sharedMovies - a.sharedMovies
				).filter(c => c.sharedMovies > 5);
				movieTwin = closestMatch.length > 0
					? `**${closestMatch[0].name}** (${(100 - closestMatch[0].difference / closestMatch[0].sharedMovies).toFixed(1)}% across ${closestMatch[0].sharedMovies} shared ${closestMatch[0].sharedMovies === 1 ? 'movie' : 'movies'})`
					: 'No shared movie ratings yet';

				if (bestGuiltyPleasure && bestGuiltyPleasure.difference > 0) {
					const movieName = `${bestGuiltyPleasure.movie.name}${bestGuiltyPleasure.movie.year ? ` (${bestGuiltyPleasure.movie.year})` : ''}`;
					guiltyPleasure = `**${movieName}** (+${bestGuiltyPleasure.difference.toFixed(1)} points vs. guild average)`;
				} else {
					guiltyPleasure = 'None of your ratings are above the guild average';
				}
			} catch (error) {
				console.error('Error calculating guild stats for user:', error);
				movieTwin = 'Unavailable (could not load guild ratings)';
				guiltyPleasure = 'Unavailable (could not load guild ratings)';
			}
		}
		const statsMessage = [
			`__${interaction.user.username}'s Movie Stats__`,
			`Movies rated: **${ratings.length}**`,
			`Average movie rating: **${mean.toFixed(1)}**`,
			`Highest rated movie: **${formatMovie(ratings[0])}**`,
			`Lowest rated movie: **${formatMovie(ratings[ratings.length - 1])}**`,
			`Median movie: **${formatMovie(median)}**`,
			`My movie twin: ${movieTwin}`,
			`Guilty pleasure: ${guiltyPleasure}`,
		].join('\n');

		return interaction.editReply(statsMessage);
	},
};
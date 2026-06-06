const { SlashCommandBuilder } = require('discord.js');
const { Movies, Guilds, Ratings } = require('../../schema/schema')
const logError = require('../../util/logError');
const affirmation = require('../../data/affirmations');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a movie to the database')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to add')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('rating')
				.setDescription('Your rating for the movie')),
	async execute (interaction) {
		const movie = interaction.options.getString('movie');
		const rating = interaction.options.getString('rating');
		const guildOrUser = {
			id: interaction?.guild?.id ?? interaction.user.id,
			name: interaction?.guild?.name ?? interaction.user.username
		}

		// Add movie to Movies table
		let newMovie, movieError
		try {
			newMovie = await Movies.findOneAndUpdate(
				{ name: movie },
				{ name: movie },
				{ upsert: true, returnDocument: 'after' }
			)
			console.log('Movie added/updated in MongoDB:', newMovie)
		} catch (err) {
			console.error('Error adding movie to MongoDB:', err)
			movieError = 'Failed to add movie: ' + err.message
		}

		if (movieError) {
			return logError(interaction, movieError)
		}

		// Update Guild table with latest movie
		let guildError
		try {
			await Guilds.findOneAndUpdate(
				{ _id: guildOrUser.id },
				{
					_id: guildOrUser.id, name: guildOrUser.name, latest_movie: newMovie._id,
					$addToSet: { movies: newMovie._id }
				},
				{ upsert: true }
			)
		} catch (err) {
			console.error('Error updating guild in MongoDB:', err)
			guildError = 'Failed to update guild: ' + err.message
		}

		if (guildError) {
			return logError(interaction, guildError)
		}

		// Add rating if applicable
		if (rating) {
			let ratingError
			try {
				await Ratings.findOneAndUpdate(
					{ user_id: interaction.user.id, movie_id: newMovie._id },
					{ user_id: interaction.user.id, movie_id: newMovie._id, rating: rating },
					{ upsert: true }
				)
			} catch (err) {
				console.error('Error adding rating to MongoDB:', err)
				ratingError = 'Failed to add rating: ' + err.message
			}

			if (ratingError) {
				return logError(interaction, ratingError)
			}
		}

		return interaction.reply(`${affirmation()} I added ${newMovie.name} to ${guildOrUser.name}.\n You can now rate it using /rate!`);
	}
};
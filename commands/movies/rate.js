const { SlashCommandBuilder } = require('discord.js');
const { Movies, Guilds, Ratings } = require('../../schema/schema')
const logError = require('../../util/logError');
const movieAutoComplete = require('../../util/movieAutoComplete');
const affirmation = require('../../data/affirmations');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rate')
		.setDescription('Rate a movie in the database')
		.addStringOption(option =>
			option
				.setName('rating')
				.setDescription('Rating from 0 to 100')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to rate')
				.setRequired(false)
				.setAutocomplete(true)
		),
	async autocomplete (interaction) {
		await movieAutoComplete(interaction)
	},
	async execute (interaction) {
		const passedMovieId = interaction.options.getString('movie');
		const rating = interaction.options.getString('rating');
		let movie

		if (!passedMovieId) {
			// No movie proivded, get latest from guild
			let data, error
			try {
				data = await Guilds.findOne({ _id: interaction.guild.id }).populate({
					path: 'latest_movie',
					select: 'id name'
				})
			} catch (err) {
				console.error('Error fetching guild from MongoDB:', err)
				error = 'Failed to fetch guild: ' + err.message
			}

			if (error) {
				return logError(interaction, error)
			}

			if (!data) {
				return interaction.reply("Your guild isn't registered - !");
			}

			movie = data.latest_movie

		} else {
			// Movie proivded, check if ID matches up
			if (passedMovieId === null) {
				return interaction.reply(`${passedMovieId} wasn't not found in the database - use /add to add it!`)
			}

			// Fetch movie by ID
			let movie, error
			try {
				movie = await Movies.findOne({ _id: passedMovieId }, 'id name').lean()
			} catch (err) {
				console.error('Error fetching movie from MongoDB:', err)
				error = 'Failed to fetch movie: ' + err.message
			}

			if (!movie || error) {
				return interaction.reply(`${passedMovieId} wasn't found in the database - use /add to add it!`)
			}

		}

		// Update or add rating
		let ratingError
		try {
			const res = await Ratings.findOneAndUpdate(
				{ '_id.user_id': interaction.user.id, '_id.movie_id': movie._id },
				{ '_id.user_id': interaction.user.id, '_id.movie_id': movie._id, rating: rating },
				{ upsert: true, returnDocument: 'after' }
			)

			console.log(res)
		} catch (err) {
			console.error('Error adding/updating rating in MongoDB:', err)
			ratingError = 'Failed to add/update rating: ' + err.message
		}

		if (ratingError) {
			return logError(interaction, ratingError)
		}

		return interaction.reply(`${affirmation()} <@${interaction.user.id}> just gave ${movie.name} a **${rating}**.`)

	},
};
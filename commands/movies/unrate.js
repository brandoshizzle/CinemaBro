const { SlashCommandBuilder } = require('discord.js');
const { Movies, Ratings } = require('../../schema/schema')
const movieAutoComplete = require('../../util/movieAutoComplete');
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unrate')
		.setDescription('Remove your rating for a movie')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want unrated')
				.setAutocomplete(true)
				.setRequired(true)),
	async autocomplete (interaction) {
		await movieAutoComplete(interaction)
	},
	async execute (interaction) {
		const movieID = interaction.options.getString('movie');

		// Get movie
		let movieData, movieError
		try {
			movieData = await Movies.findOne({ id: movieID }, 'id name').lean()
		} catch (err) {
			console.error('Error fetching movie from MongoDB:', err)
			movieError = 'Failed to fetch movie: ' + err.message
		}

		if (movieError || !movieData) {
			return logError(interaction, movieError)
		}

		// If in a guild, update Guild Movies table
		let guildMoviesError
		try {
			await Ratings.deleteOne(
				{ movie_id: movieID, user_id: interaction.user.id })
		} catch (err) {
			console.error('Error deleting rating from MongoDB:', err)
			guildMoviesError = 'Failed to delete rating: ' + err.message
		}

		if (guildMoviesError) {
			return logError(interaction, guildMoviesError)
		}
		return interaction.reply(`No prob bro, I deleted your rating for ${movieData.name}.`);
	}
};
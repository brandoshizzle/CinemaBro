const { SlashCommandBuilder } = require('discord.js');
const { Movies, Guilds } = require('../../schema/schema')
const movieAutoComplete = require('../../util/movieAutoComplete');
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a movie from your server')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to remove')
				.setRequired(true)
				.setAutocomplete(true))
		.setDMPermission(false),
	async autocomplete (interaction) {
		await movieAutoComplete(interaction)
	},
	async execute (interaction) {
		const movieID = interaction.options.getString('movie');

		let movie, movieError
		try {
			movie = await Movies.findOne({ id: movieID }).lean()
		} catch (err) {
			console.error('Error fetching movie from MongoDB:', err)
			movieError = 'Failed to fetch movie: ' + err.message
		}

		if (movieError || !movie) {
			return logError(interaction, movieError)
		}

		// If in a guild, update Guild Movies table
		let guildMoviesError
		try {
			await Guilds.updateOne(
				{ id: interaction.guild.id },
				{ $pull: { movies: movie.id } }
			)
		} catch (err) {
			console.error('Error deleting guild movie from MongoDB:', err)
			guildMoviesError = 'Failed to delete guild movie: ' + err.message
		}

		if (guildMoviesError) {
			return logError(interaction, guildMoviesError)
		}

		return interaction.reply(`No prob bro, I removed ${movie.name} from ${interaction.guild.name}.`);
	},
};
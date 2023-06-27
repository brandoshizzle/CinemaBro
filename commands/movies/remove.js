const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
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

		// Get movie
		const { data: movie, error: movieError } = await supabase
			.from('movies')
			.select()
			.eq('id', movieID)
			.single()

		if (movieError) {
			return logError(interaction, movieError)
		}

		// If in a guild, update Guild Movies table
		const { error: guildMoviesError } = await supabase
			.from('guild_movies')
			.delete()
			.eq('movie_id', movie.id)
			.eq('guild_id', interaction.guild.id)

		if (guildMoviesError) {
			return logError(interaction, guildMoviesError)
		}

		return interaction.reply(`No prob bro, I removed ${movie.name} from ${interaction.guild.name}.`);
	},
};
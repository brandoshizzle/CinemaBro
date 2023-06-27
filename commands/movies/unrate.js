const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
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
		const { data: movieData, error: movieError } = await supabase
			.from('movies')
			.select()
			.eq('id', movieID)
			.single()

		if (movieError) {
			return logError(interaction, movieError)
		}

		// If in a guild, update Guild Movies table
		const { error: guildMoviesError } = await supabase
			.from('ratings')
			.delete()
			.eq('movie_id', movieID)
			.eq('user_id', interaction.user.id)

		if (guildMoviesError) {
			return logError(interaction, guildMoviesError)
		}
		return interaction.reply(`No prob bro, I deleted your rating for ${movieData.name}.`);
	}
};
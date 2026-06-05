const { SlashCommandBuilder } = require('discord.js');
const store = require('../../db/store');
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wish')
		.setDescription('Add a movie to your wishlist')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to add')
				.setRequired(true)
		),
	async execute (interaction) {

		const passedMovieTitle = interaction.options.getString('movie');

		const { error } = await store.appendUserWishlistItem(interaction.user.id, passedMovieTitle);
		if (error) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		return interaction.reply({ content: `Tubular, I added ${passedMovieTitle} to your wishlist.`, ephemeral: true })
	},
};
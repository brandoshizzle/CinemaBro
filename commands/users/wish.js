const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
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


		// Get user wishlist
		const { data, error } = await supabase
			.from('users')
			.select('id, wishlist')
			.eq('id', interaction.user.id)

		if (error) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		let user = {}
		if (data && data.length === 1) {
			user = data[0]
		} else {
			user = { id: interaction.user.id, wishlist: [] }
		}

		user.wishlist.push(passedMovieTitle)

		// Write back to db
		const { error: writeError } = await supabase
			.from('users')
			.upsert(user)

		if (writeError) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}

		return interaction.reply({ content: `Tubular, I added ${passedMovieTitle} to your wishlist.`, ephemeral: true })
	},
};
const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');
const splitSend = require('../../util/splitSend')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mylist')
		.setDescription('Retrieve your movie list'),
	async execute (interaction) {
		await interaction.reply({ content: 'No prob, grabbing your movie list for ya.', ephemeral: true })
		// Get movies
		const { data, error } = await supabase
			.from('ratings')
			.select(`
					movies(
						id,
						name,
						year
					),
					rating
				`)
			.eq('user_id', interaction.user.id)
			.order('rating', { ascending: false })

		if (error) {
			return logError(interaction, error, { ephemeral: true, edit: true })
		}
		let replyArray = ['Coming in hot with your full movie list:']
		data.forEach(rating => replyArray.push(`**${rating.rating}** ${rating.movies.name} ${rating?.movies?.year ? `(${rating?.movies?.year})` : ''}`))
		await splitSend(interaction, replyArray, { dm: true })
		return interaction.editReply({ content: 'Check your DMs - I just sent you your list.', ephemeral: true })
	},
};
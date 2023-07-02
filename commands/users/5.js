const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('5')
		.setDescription('The top and bottom 5 movies for a user.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user you want the list for.')
		),
	async execute (interaction) {

		let user = interaction.options.getUser('user');

		if (!user) {
			user = interaction.user
		}

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
			.eq('user_id', user.id)
			.order('rating', { ascending: false })

		if (error) {
			return logError(interaction, error)
		}

		const top5 = data.slice(0, 5)
		const bottom5 = data.slice(data.length - 5)

		let replyString = `${user.username}'s Hot & Not List\n`
		replyString += '**Top 5:**\n'
		replyString += top5.map(rating => `**${rating.rating}** - ${rating.movies.name}`).join('\n')
		replyString += '\n**Bottom 5:**\n'
		replyString += bottom5.map(rating => `**${rating.rating}** - ${rating.movies.name}`).join('\n')
		return interaction.reply(replyString)
	},
};
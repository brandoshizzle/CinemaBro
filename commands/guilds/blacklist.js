const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db');
const logError = require('../../util/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription("Remove a user from the server's ratings.")
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user you want to blacklist')
				.setRequired(true))
		.setDMPermission(false),
	async execute (interaction) {
		const user = interaction.options.getUser('user');

		// Get current blacklist
		const { data: oldBlacklist, error: getBlacklistError } = await supabase
			.from('guilds')
			.select('blacklist')
			.eq('id', interaction.guild.id)

		const newBlacklist = oldBlacklist.push(user.id)

		if (getBlacklistError) {
			return logError(interaction, updateBlacklistError, { ephemeral: true })
		}

		const { error: updateBlacklistError } = await supabase
			.from('guilds')
			.update({ blacklist: newBlacklist })
			.eq('id', interaction.guild.id)

		if (updateBlacklistError) {
			return logError(interaction, updateBlacklistError, { ephemeral: true })
		}

		return interaction.reply(`No prob bro, I added ${user.username} to ${interaction.guild.name}'s blacklist.`);
	},
};
const { SlashCommandBuilder } = require('discord.js');
const { Guilds } = require('../../schema/schema')
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
		let oldBlacklist, getBlacklistError
		try {
			oldBlacklist = await Guilds.findOne({ id: interaction.guild.id }, { blacklist: 1 }).lean()
				.then(guild => guild ? guild.blacklist : [])
		} catch (err) {
			console.error('Error fetching guild from MongoDB:', err)
			getBlacklistError = 'Failed to fetch guild: ' + err.message
		}

		const newBlacklist = oldBlacklist.push(user.id)

		if (getBlacklistError) {
			return logError(interaction, updateBlacklistError, { ephemeral: true })
		}

		let updateBlacklistError
		try {
			await Guilds.updateOne({ id: interaction.guild.id }, { blacklist: newBlacklist }, { upsert: true })
		} catch (err) {
			console.error('Error updating guild in MongoDB:', err)
			updateBlacklistError = 'Failed to update guild: ' + err.message
		}

		if (updateBlacklistError) {
			return logError(interaction, updateBlacklistError, { ephemeral: true })
		}

		return interaction.reply(`No prob bro, I added ${user.username} to ${interaction.guild.name}'s blacklist.`);
	},
};
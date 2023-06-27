const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sup')
		.setDescription("What's up bro?"),
	async execute (interaction) {
		const replies = [
			"nm bro how about you?"
		]
		return interaction.reply(replies[Math.floor(Math.random() * replies.length)]);
	},
};
const { SlashCommandBuilder } = require('discord.js');
const getGuildMovies = require('../../util/getGuildMovies');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Retrieve the movie list'),
	async execute (interaction) {
		try {
			// Get movies
			const { movies, error } = await getGuildMovies(interaction.guild.id)

			if (error) {
				console.log(error)
				return interaction.reply('Big error boss')
			}

			console.log(movies)
			const replyString = movies.map(movie => movie.name).join('\n')
			return interaction.reply(replyString);
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return interaction.reply('That movie already exists.');
			}

			return interaction.reply('Something went wrong with adding a tag.');
		}
	},
};
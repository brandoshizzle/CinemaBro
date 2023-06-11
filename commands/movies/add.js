const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../db')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a movie to the database')
		.addStringOption(option =>
			option
				.setName('movie')
				.setDescription('The movie you want to add')
				.setRequired(true)),
	async execute (interaction) {
		const movie = interaction.options.getString('movie');
		try {
			// Add movie
			const { data: newMovies, error: movieError } = await supabase
				.from('movies')
				.upsert({ name: movie })
				.select()

			if (movieError) {
				console.log(movieError)
				return interaction.reply("Issue adding movie.")
			}

			const newMovie = newMovies[0]

			// Update Guild object
			const { error: guildError } = await supabase
				.from('guilds')
				.upsert({ id: interaction.guild.id, name: interaction.guild.name, latest_movie: Number(newMovie.id) })
				.select()

			if (guildError) {
				console.log(guildError)
				return interaction.reply("Issue updating guild.")
			}

			// Update Guild object
			const { error: guildMoviesError } = await supabase
				.from('guild_movies')
				.upsert({ movie_id: newMovie.id, guild_id: interaction.guild.id })
				.select()

			if (guildMoviesError) {
				console.log(guildMoviesError)
				return interaction.reply("Issue adding movie relation.")
			}

			return interaction.reply(`Movie ${newMovie.name} added.`);
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return interaction.reply('That movie already exists.');
			}
			console.log(error)
			return interaction.reply('Something went wrong with adding a tag.');
		}
	},
};
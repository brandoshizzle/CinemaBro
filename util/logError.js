
function logError (interaction, error, edit = false, ephemeral = false) {
	if (error) {
		console.log(error)
	}
	if (edit) {
		return interaction.editReply({ content: `Aw snap bro, I ran into an error: ${error.message} :(`, ephemeral: ephemeral })
	}
	return interaction.reply({ content: `Aw snap bro, I ran into an error: ${error.message} :(`, ephemeral: ephemeral })

}

module.exports = logError
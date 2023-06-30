
function logError (interaction, error, options = { edit: false, ephemeral: false }) {
	if (error) {
		console.log(error)
	}
	if (options?.edit) {
		return interaction.editReply({ content: `Aw snap bro, I ran into an error: ${error.message} :(`, ephemeral: options?.ephemeral || false })
	}
	return interaction.reply({ content: `Aw snap bro, I ran into an error: ${error.message} :(`, ephemeral: options?.ephemeral || false })

}

module.exports = logError

async function splitSend (interaction, textArray, options = { dm: false, edit: false }) {
	// Add from text array until 2000 char limit is reached
	let replyString = ""
	let previousSend = false;

	for (let i = 0; i < textArray.length; i++) {
		const prevString = replyString
		replyString += textArray[i] + "\n"

		if (replyString.length < 2000) {
			continue;
		}

		// Send previous string
		if (options?.dm) {
			await interaction.user.send(prevString)
		} else {
			if (options?.edit && !previousSend) {
				await interaction.editReply(prevString)
				previousSend = true
			} else {
				await interaction.channel.send(prevString)
			}
		}
		// new replyString for next message
		replyString = textArray[i] + "\n"
	}
	// Send final string
	if (options?.dm) {
		await interaction.user.send(replyString)
	} else {
		if (options?.edit && !previousSend) {
			await interaction.editReply(replyString)
			previousSend = true
		} else {
			await interaction.channel.send(replyString)
		}
	}

	return
}

module.exports = splitSend
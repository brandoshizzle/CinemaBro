const client = require('../client')

async function getUsername (guildID, userID) {
	const guildData = client.guilds.cache.get(guildID)
	const members = await guildData.members.fetch()
	const users = members.map(m => ({ id: m.user.id, name: m.displayName }))
	const userIndex = users.findIndex(u => u.id === userID)
	if (userIndex > -1) {
		return users[userIndex].name
	}
	return "Mystery User"
}

module.exports = getUsername
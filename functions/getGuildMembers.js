const client = require("../client")


async function getGuildMembers (guildID) {

	const guildData = client.guilds.cache.get(guildID)
	const members = await guildData.members.fetch()
	const users = members.map(m => ({ id: m.user.id, name: m.displayName }))
	return users
}

module.exports = getGuildMembers
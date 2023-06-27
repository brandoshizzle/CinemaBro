const { Client, GatewayIntentBits } = require('discord.js');

// Create a new client instance
module.exports = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,] });
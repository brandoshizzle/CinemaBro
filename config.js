require('dotenv').config();

function requiredEnv (name) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

module.exports = {
	token: requiredEnv('DISCORD_TOKEN'),
	clientId: requiredEnv('DISCORD_CLIENT_ID'),
	guildId: process.env.DISCORD_GUILD_ID,
	supabaseUrl: process.env.SUPABASE_URL || 'https://ontflizqvczcpbbpwvgg.supabase.co',
	supabaseKey: process.env.SUPABASE_KEY,
	omdbKey: process.env.OMDB_KEY,
	databaseUrl: process.env.DATABASE_URL
};
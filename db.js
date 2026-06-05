const sb = require('@supabase/supabase-js')
const { supabaseKey, supabaseUrl, databaseUrl } = require('./config');

if (!supabaseKey && !databaseUrl) {
	throw new Error('Missing required environment variable: SUPABASE_KEY')
}

// Create a single supabase client for interacting with your database
const supabase = sb.createClient(supabaseUrl, supabaseKey || 'dev-placeholder-key')

module.exports = supabase
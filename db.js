const sb = require('@supabase/supabase-js')
const { supabaseKey } = require('./config.json');

// Create a single supabase client for interacting with your database
const supabase = sb.createClient('https://ontflizqvczcpbbpwvgg.supabase.co', supabaseKey)

module.exports = supabase
CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  year INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  latest_movie BIGINT,
  wishlist TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latest_movie BIGINT,
  blacklist TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS guild_movies (
  guild_id TEXT NOT NULL,
  movie_id BIGINT NOT NULL,
  PRIMARY KEY (guild_id, movie_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  user_id TEXT NOT NULL,
  movie_id BIGINT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 100),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_movies_name_lower ON movies (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings (movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings (user_id);
CREATE INDEX IF NOT EXISTS idx_guild_movies_guild_id ON guild_movies (guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_movies_movie_id ON guild_movies (movie_id);

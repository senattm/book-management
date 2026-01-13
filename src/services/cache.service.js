const { redis } = require("../config/redis");
const crypto = require("crypto");

const CACHE_TTL = 3600;
const SINGLE_ITEM_TTL = 86400;
const LOCK_TTL = 10;

const generateHash = (query) => {
  const sortedQuery = Object.keys(query || {})
    .sort()
    .reduce((sortedQuery, key) => {
      sortedQuery[key] = query[key];
      return sortedQuery;
    }, {});
  return crypto
    .createHash("md5")
    .update(JSON.stringify(sortedQuery))
    .digest("hex");
};

const CacheKeys = {
  book(id) {
    return `book:${id}`;
  },
  booksList(query) {
    return `books:list:${generateHash(query)}`;
  },
  bookReviews(id) {
    return `book:${id}:reviews`;
  },
  bookPattern(id) {
    return `book:${id}*`;
  },
  booksListPattern() {
    return `books:list:*`;
  },
  author(id) {
    return `author:${id}`;
  },
  authorsList(query) {
    return `authors:list:${generateHash(query)}`;
  },
  authorBooks(id, query) {
    return `author:${id}:books:${generateHash(query)}`;
  },
  authorPattern(id) {
    return `author:${id}*`;
  },
  authorBooksPattern(id) {
    return `author:${id}:books:*`;
  },
  authorsListPattern() {
    return `authors:list:*`;
  },
};

function isRedisAvailable() {
  try {
    return redis?.isOpen === true;
  } catch {
    return false;
  }
}

async function getCached(key, fallback, ttl = CACHE_TTL) {
  if (!isRedisAvailable()) {
    return await fallback();
  }

  const lockKey = `lock:${key}`;
  const hitKey = "stats:cache:hit";
  const missKey = "stats:cache:miss";

  try {
    const cached = await redis.get(key);
    if (cached) {
      try {
        await redis.incr(hitKey);
        return JSON.parse(cached);
      } catch (parseErr) {
        await redis.del(key);
      }
    }

    await redis.incr(missKey);
    let hasLock = await redis.set(lockKey, "true", { EX: LOCK_TTL, NX: true });

    if (!hasLock) {
      await new Promise((r) => setTimeout(r, 500));
      const retry = await redis.get(key);
      if (retry) {
        try {
          await redis.incr(hitKey);
          return JSON.parse(retry);
        } catch (parseErr) {
          await redis.del(key);
        }
      }
      hasLock = await redis.set(lockKey, "true", { EX: LOCK_TTL, NX: true });
    }

    const data = await fallback();

    try {
      await redis.set(key, JSON.stringify(data), { EX: ttl });
      await redis.del(lockKey);
    } catch (err) {
      await redis.del(lockKey);
    }
    return data;

  } catch (err) {
    await redis.del(lockKey);
    return await fallback();
  }
}

async function invalidatePattern(pattern) {
  if (!isRedisAvailable()) return;

  try {
    let currentPosition = "0";
    const keysToDelete = [];

    do {
      const [nextPosition, keys] = await redis.scan(currentPosition, {
        MATCH: pattern,
        COUNT: 100,
      });
      
      currentPosition = nextPosition;

      if (keys?.length) {
        keysToDelete.push(...keys);
      }
      
    } while (currentPosition !== "0");

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
  } catch (err) {
  }
}

async function invalidateBookCache(id) {
  await Promise.all([
    invalidatePattern(CacheKeys.bookPattern(id)),
    invalidatePattern(CacheKeys.booksListPattern()),
  ]);
}

async function invalidateAuthorCache(id) {
  await Promise.all([
    invalidatePattern(CacheKeys.authorPattern(id)),
    invalidatePattern(CacheKeys.authorBooksPattern(id)),
    invalidatePattern(CacheKeys.authorsListPattern()),
    invalidatePattern(CacheKeys.booksListPattern()),
  ]);
}

async function invalidateAllBooksCache() {
  await Promise.all([
    invalidatePattern(CacheKeys.booksListPattern()),
    invalidatePattern(`author:*:books:*`),
  ]);
}

async function invalidateAllAuthorsCache() {
  await invalidatePattern(CacheKeys.authorsListPattern());
}

async function getCacheStats() {
  if (!isRedisAvailable()) return null;
  const [hits, misses] = await Promise.all([
    redis.get("stats:cache:hit"),
    redis.get("stats:cache:miss")
  ]);
  return {
    hits: parseInt(hits || 0, 10),
    misses: parseInt(misses || 0, 10)
  };
}

module.exports = {
  CacheKeys,
  getCached,
  invalidatePattern,
  invalidateBookCache,
  invalidateAuthorCache,
  invalidateAllBooksCache,
  invalidateAllAuthorsCache,
  getCacheStats,
  CACHE_TTL,
  SINGLE_ITEM_TTL,
};
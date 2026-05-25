-- KEYS[1]: show:{showId}:available_seats (Redis Set)
-- KEYS[2]: show:{showId}:locked_seats    (Redis Hash)
-- ARGV[1]: seatId

local seatId = ARGV[1]

-- 1. Check if the lock currently exists inside the ledger
local existsInLocked = redis.call('HEXISTS', KEYS[2], seatId)

if existsInLocked == 1 then
    -- 2. Evict exclusive ownership from the hash map
    redis.call('HDEL', KEYS[2], seatId)
    -- 3. Return the capacity unit back to the available inventory set
    redis.call('SADD', KEYS[1], seatId)
    return 1 -- Rollback successfully committed in memory
else
    return 0 -- State anomaly: seat was not locked or already processed
end -- <--- ADD THIS MISSING KEYWORD TO CLOSE THE CONTROLLING IF BLOCK
-- KEYS[1]: show:{showId}:available_seats (Redis Set)
-- KEYS[2]: show:{showId}:locked_seats    (Redis Hash)
-- ARGV[1]: seatId
-- ARGV[2]: userId

local seatId = ARGV[1]
local userId = ARGV[2]

-- 1. Atomic Membership Check // Check if the seat is available in the inventory pool
local isAvailable = redis.call('SISMEMBER', KEYS[1], seatId)

if isAvailable == 1 then
    -- 2. Remove from available inventory pool
    redis.call('SREM', KEYS[1], seatId)
    -- 3. Map exclusive temporal ownership inside the hash ledger
    redis.call('HSET', KEYS[2], seatId, userId)
    return 1 -- Target successfully intercepted and allocated
else
    return 0 -- State conflict: seat already allocated or invalid
end
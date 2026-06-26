-- KEYS[1]: show:{showId}:available_seats (Redis Set)
-- KEYS[2]: show:{showId}:locked_seats    (Redis Hash)
-- ARGV[1]: seatId
-- ARGV[2]: userId

local seatId = ARGV[1]
local userId = ARGV[2]

local isAvailable = redis.call('SISMEMBER', KEYS[1], seatId)

if isAvailable == 1 then
    redis.call('SREM', KEYS[1], seatId)
    redis.call('HSET', KEYS[2], seatId, userId)
    return 1
else
    return 0
end

-- KEYS[1]: show:{showId}:available_seats (Redis Set)
-- KEYS[2]: show:{showId}:locked_seats    (Redis Hash)
-- ARGV[1]: seatId

local seatId = ARGV[1]

local existsInLocked = redis.call('HEXISTS', KEYS[2], seatId)

if existsInLocked == 1 then
    redis.call('HDEL', KEYS[2], seatId)
    redis.call('SADD', KEYS[1], seatId)
    return 1
else
    return 0
end

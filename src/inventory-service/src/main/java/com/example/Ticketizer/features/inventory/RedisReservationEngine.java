package com.example.Ticketizer.features.inventory;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RedisReservationEngine {

    private final StringRedisTemplate redisTemplate;
    private final SeatRepository seatRepository;
    private DefaultRedisScript<Long> reservationScript;
    private DefaultRedisScript<Long> releaseScript;

    @PostConstruct
    public void init() {
        reservationScript = new DefaultRedisScript<>();
        reservationScript.setLocation(new ClassPathResource("scripts/reserve_seats.lua"));
        reservationScript.setResultType(Long.class);

        releaseScript = new DefaultRedisScript<>();
        releaseScript.setLocation(new ClassPathResource("scripts/release_seats.lua"));
        releaseScript.setResultType(Long.class);
    }

    public List<SeatStateResponse> getRealTimeSeatStatuses(Long showId) {
        String availableSetKey = "show:" + showId + ":available_seats";
        String lockedHashKey =  "show:" + showId + ":locked_seats";

        Set<String> availableSeats = redisTemplate.opsForSet().members(availableSetKey);
        Set<Object> lockedSeats = redisTemplate.opsForHash().keys(lockedHashKey);

        Set<Long> availableIds = availableSeats != null ? availableSeats.stream().map(Long::valueOf).collect(Collectors.toSet()) : Set.of();
        Set<Long> lockedIds = lockedSeats != null ? lockedSeats.stream().map(k -> Long.valueOf((String) k)).collect(Collectors.toSet()) : Set.of();

        List<Seat> databaseSeats = seatRepository.findByShowId(showId);
        List<SeatStateResponse> matrix = new ArrayList<>(databaseSeats.size());

        for (Seat seat : databaseSeats) {
            long seatId = seat.getId();
            String status;

            if (availableIds.contains(seatId)) {
                status = "AVAILABLE";
            } else if (lockedIds.contains(seatId)) {
                status = "LOCKED";
            } else {
                status = "BOOKED";
            }

            matrix.add(new SeatStateResponse(seatId, seat.getSeatNumber(), status));
        }

        return matrix;
    }
}

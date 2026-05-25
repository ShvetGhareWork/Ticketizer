package com.example.Ticketizer.domain.repository;

import com.example.Ticketizer.domain.entity.Show;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShowRepository extends JpaRepository<Show, Long> {

    // Spring Data derives the SQL from the method name.
    // findByEventId(Long) → SELECT * FROM shows WHERE event_id = ?
    // This is called 'derived query methods' — no @Query annotation needed
    // for simple lookups. The naming convention is:
    //   find + By + {fieldName} + {optionalCondition}
    List<Show> findByEventId(Long eventId);
}

package com.example.Ticketizer.domain.repository;

import com.example.Ticketizer.domain.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// JpaRepository<Event, Long> gives you:
//   save(), findById(), findAll(), deleteById(), count(), existsById()
//   ... and more, all without writing SQL.
//
// Under the hood, Spring Data generates a proxy implementation at startup.
// The @Repository annotation is optional here (JpaRepository is enough),
// but it makes the intent explicit and enables Spring's exception translation
// (converts JDBC exceptions to Spring's DataAccessException hierarchy).
@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    // Phase 1 needs nothing custom here — basic CRUD is sufficient.
    // In Phase 2+, we might add:
    //   List<Event> findByNameContainingIgnoreCase(String keyword);
}

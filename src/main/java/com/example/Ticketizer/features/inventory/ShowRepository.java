package com.example.Ticketizer.features.inventory;

import com.example.Ticketizer.features.inventory.Show;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShowRepository extends JpaRepository<Show, Long> {

    List<Show> findByEventId(Long eventId);
}
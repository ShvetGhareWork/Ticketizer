package com.example.Ticketizer.features.inventory;

import com.example.Ticketizer.features.inventory.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

}
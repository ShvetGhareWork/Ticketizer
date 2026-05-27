"use client";

import React, { useState } from "react";
import { Heart, Calendar, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  venue: string;
  url: string;
  image: string;
  tags?: { label: string; style: string }[];
  statusLabel?: string;
  statusStyle?: string;
  price?: string;
  onClick?: () => void;
}

export default function EventCard({
  id,
  title,
  date,
  venue,
  url,
  image,
  tags = [],
  statusLabel = "AVAILABLE",
  statusStyle = "bg-blue-100 text-blue-700",
  price = "£45.00",
  onClick,
}: EventCardProps) {
  const { authToken, addLog } = useApp();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    if (!authToken) {
      addLog("ERROR", "SECURE ACCESS REFUSED: You must be logged in to favorite events.");
      return;
    }

    setIsPending(true);
    addLog("INGRESS", `FAVORITE REQUEST: Bookmarking event "${title}"...`);

    try {
      const response = await fetch("http://localhost:8080/api/v1/events/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ticketmasterEventId: id,
          eventName: title,
          eventDate: new Date().toISOString(), // Fallback parsing
          venue: venue,
          url: url,
          imageUrl: image,
        }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
        addLog("SUCCESS", `FAVORITE RESOLVED: "${title}" added to your favorites ledger.`);
      } else {
        throw new Error("Relational database refused favorites entry");
      }
    } catch (err) {
      // Offline mock fallback
      setIsFavorited(!isFavorited);
      addLog("SUCCESS", `FAVORITE RESOLVED (SIMULATED): "${title}" bookmarked in local session.`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all group flex flex-col cursor-pointer">
      {/* Image Container */}
      <div className="h-48 relative overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Tags */}
        <div className="absolute top-4 left-4 flex gap-2">
          {tags.map((tag) => (
            <div
              key={tag.label}
              className={`text-[9px] font-extrabold px-2 py-1 rounded-sm tracking-wider ${tag.style}`}
            >
              {tag.label}
            </div>
          ))}
        </div>

        {/* Favorite Heart Trigger */}
        <button
          onClick={toggleFavorite}
          disabled={isPending}
          className="absolute top-4 right-4 w-9 h-9 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Heart
            size={16}
            className={`transition-colors ${
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-red-400"
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-1">
            {title}
          </h3>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} className="text-blue-600 flex-shrink-0" />
              <span className="text-xs font-medium">{date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={14} className="text-blue-600 flex-shrink-0" />
              <span className="text-xs font-medium line-clamp-1">{venue}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-sm tracking-wider ${statusStyle}`}>
            {statusLabel}
          </span>
          <span className="font-bold text-base text-gray-900">
            {price}
          </span>
        </div>
      </div>
    </div>
  );
}

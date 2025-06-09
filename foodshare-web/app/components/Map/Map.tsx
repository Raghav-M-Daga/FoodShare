'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './Map.module.css';
import { Issue } from '../types';
import { useAuth } from '../Auth/AuthProvider';

interface Props {
  issues: Issue[];
  onMapClick: (location: { lng: number; lat: number; x: number; y: number }) => void;
  pendingLocation: { lng: number; lat: number } | null;
  onPinClick?: (eventId: string) => void;
  selectedPinId?: string | null;
  isEditing?: boolean;
  editingEventId?: string | null;
  onPinDragEnd?: (eventId: string, lngLat: { lng: number; lat: number }) => void;
  onMapBackgroundClick?: () => void;
}

export default function Map({
  issues,
  onMapClick,
  pendingLocation,
  onPinClick,
  selectedPinId,
  isEditing = false,
  editingEventId = null,
  onPinDragEnd,
  onMapBackgroundClick
}: Props) {
  const { user, isInitialized } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const reportPopupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Map click handler
  const handleMapClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      if (!mapContainer.current || !user || !isInitialized) return;
      const target = e.originalEvent.target as HTMLElement;
      if (!target.classList.contains('mapboxgl-canvas')) return;
      const { left, top } = mapContainer.current.getBoundingClientRect();
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat, x: e.originalEvent.clientX - left, y: e.originalEvent.clientY - top });
      if (onMapBackgroundClick) onMapBackgroundClick();
    },
    [onMapClick, user, isInitialized, onMapBackgroundClick]
  );
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) {
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-78.93957298090419, 36.00160553451508],
      zoom: 15
    });

    mapRef.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Render existing issues (pins)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    issues.forEach(issue => {
      if (!issue.location) return;
      const el = document.createElement('div');
      el.className = styles.marker;
      const isSelected = selectedPinId === issue.id;
      const isDraggable = isEditing && editingEventId === issue.id;
      const isEditingPin = isEditing && editingEventId === issue.id;
      // Color logic
      let pinColor = '#6949FF'; // default purple
      let shadowColor = 'rgba(20,184,166,0.4)';
      if (isEditingPin) {
        pinColor = '#14b8a6'; // teal for editing/creating
        shadowColor = 'rgba(20,184,166,0.5)';
      }
      el.innerHTML = `
        <svg width="${isSelected ? '48' : '36'}" height="${isSelected ? '56' : '42'}" viewBox="0 0 36 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-10" y="-10" width="64" height="64">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${shadowColor}"/>
            </filter>
          </defs>
          <path d="M18 54C18 54 32 36.5 32 22C32 11.5066 25.4934 4 18 4C10.5066 4 4 11.5066 4 22C4 36.5 18 54 18 54Z" fill="${pinColor}" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
          <circle cx="18" cy="22" r="${isSelected ? '9' : '7'}" fill="#fff" stroke="#fff" stroke-width="1" />
        </svg>
      `;
      const marker = new mapboxgl.Marker({ 
        element: el, 
        offset: [0, isSelected ? -38 : -28],
        anchor: 'bottom',
        draggable: isDraggable
      })
        .setLngLat([issue.location.lng, issue.location.lat]);
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onPinClick) onPinClick(issue.id);
      });
      if (isDraggable && onPinDragEnd) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onPinDragEnd(issue.id, { lng: lngLat.lng, lat: lngLat.lat });
          // Center the map on the new location
          mapRef.current?.flyTo({ center: [lngLat.lng, lngLat.lat], essential: true });
        });
      }
    });
    // Render pending (creating) pin in teal, larger size
    if (pendingLocation) {
      const el = document.createElement('div');
      el.className = styles.marker;
      el.innerHTML = `
        <svg width="56" height="70" viewBox="0 0 36 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-10" y="-10" width="64" height="64">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(20,184,166,0.5)"/>
            </filter>
          </defs>
          <path d="M18 54C18 54 32 36.5 32 22C32 11.5066 25.4934 4 18 4C10.5066 4 4 11.5066 4 22C4 36.5 18 54 18 54Z" fill="#14b8a6" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
          <circle cx="18" cy="22" r="12" fill="#fff" stroke="#fff" stroke-width="1" />
        </svg>
      `;
      const marker = new mapboxgl.Marker({ element: el, offset: [0, -48] })
        .setLngLat([pendingLocation.lng, pendingLocation.lat])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    }
  }, [issues, onPinClick, mapLoaded, selectedPinId, isEditing, editingEventId, onPinDragEnd, pendingLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.on('click', handleMapClick);
    return () => {
      mapRef.current?.off('click', handleMapClick);
    };
  }, [handleMapClick]);

  return <div ref={mapContainer} className={styles.mapContainer} />;
}

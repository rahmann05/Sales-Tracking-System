/**
 * Google Places API Integration & Fallback Service
 * Single Responsibility: Retrieve official Google Place details, ratings, photos & status using system latitude & longitude coordinates.
 * 1 File = 1 Pure Service
 */

export const googlePlacesService = {
  /**
   * Generates a direct Google Maps search / navigation URL from system coordinates
   */
  getGoogleMapsUrl: (lat, lng, query = '') => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (lat!=null&&lng!=null&&Number.isFinite(latNum)&&Number.isFinite(lngNum)&&Math.abs(latNum)<=90&&Math.abs(lngNum)<=180) {
      return `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
    }
    if (query && query.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
    }
    return 'https://www.google.com/maps';
  },

  /**
   * Opens Google Maps in a new tab querying the exact real coordinates from the database.
   * If coordinates are not directly present on the item (e.g. stop object), resolves from master outlets.
   */
  openInGoogleMaps: (outletOrStop, fallbackOutlets = []) => {
    if (!outletOrStop) return;

    // 1. Check coordinates directly on item or nested outlet relation
    let lat = outletOrStop.latitude ?? outletOrStop.lat ?? outletOrStop.outlet?.latitude;
    let lng = outletOrStop.longitude ?? outletOrStop.lng ?? outletOrStop.outlet?.longitude;

    // 2. Cross-reference with database master outlets list if needed
    if (
      (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) &&
      Array.isArray(fallbackOutlets) &&
      fallbackOutlets.length > 0
    ) {
      const code = outletOrStop.outletCode || outletOrStop.customerId;
      const targetId = outletOrStop.outletId || outletOrStop.id;
      const name = (outletOrStop.outletName || outletOrStop.customerName || outletOrStop.name || '').trim().toLowerCase();

      const matched = fallbackOutlets.find((o) => {
        if (targetId && (o.id === targetId || o.outletId === targetId)) return true;
        if (code && (o.outletCode === code || o.customerId === code)) return true;
        if (name && o.name && o.name.trim().toLowerCase() === name) return true;
        return false;
      });

      if (matched && matched.latitude != null && matched.longitude != null) {
        lat = matched.latitude;
        lng = matched.longitude;
      }
    }

    const searchQuery =
      outletOrStop.outletName ||
      outletOrStop.customerName ||
      outletOrStop.name ||
      outletOrStop.address ||
      '';

    const url = googlePlacesService.getGoogleMapsUrl(lat, lng, searchQuery);

    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  /**
   * Fetches Google Place details using official coordinates from database
   */
  getPlaceDetails: async (outlet) => {
    if (!outlet || outlet.latitude == null || outlet.longitude == null) {
      return {
        placeName: outlet?.name || outlet?.outletName || 'Outlet',
        category: outlet?.type === 'MODERN_TRADE' ? 'Modern Trade' : 'General Trade',
        googleMapsUrl: googlePlacesService.getGoogleMapsUrl(null, null, outlet?.name || outlet?.outletName),
        photoUrl: outlet?.photoUrl || null,
      };
    }

    if (outlet.googlePlaceDetails) {
      return outlet.googlePlaceDetails;
    }

    // Google Maps JS SDK PlacesService if available
    if (typeof window !== 'undefined' && window.google?.maps?.places?.PlacesService) {
      try {
        const dummyNode = document.createElement('div');
        const service = new window.google.maps.places.PlacesService(dummyNode);
        const result = await new Promise((resolve) => {
          service.nearbySearch(
            {
              location: { lat: Number(outlet.latitude), lng: Number(outlet.longitude) },
              radius: 150,
            },
            (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
                resolve(results[0]);
              } else {
                resolve(null);
              }
            }
          );
        });

        if (result) {
          let photoUrl = null;
          if (result.photos && result.photos.length > 0) {
            try {
              photoUrl = result.photos[0].getUrl({ maxWidth: 800 });
            } catch {}
          }

          return {
            placeName: result.name || outlet.name || outlet.outletName,
            rating: result.rating || null,
            userRatingsTotal: result.user_ratings_total || null,
            category: result.types ? result.types[0].replace(/_/g, ' ') : (outlet.type || 'Toko'),
            businessStatus: result.opening_hours?.open_now ? 'Buka' : 'Tutup / Operasional',
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${Number(outlet.latitude)},${Number(outlet.longitude)}`,
            photoUrl,
          };
        }
      } catch (err) {
        console.warn('[googlePlacesService] SDK nearbySearch fallback:', err.message);
      }
    }

    return {
      placeName: outlet.name || outlet.outletName || outlet.customerName,
      rating: null,
      userRatingsTotal: null,
      category: outlet.type || 'Toko',
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${Number(outlet.latitude)},${Number(outlet.longitude)}`,
      photoUrl: outlet.photoUrl || null,
    };
  },
};

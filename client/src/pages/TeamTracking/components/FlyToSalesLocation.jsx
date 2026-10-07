import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
export const FlyToSalesLocation = ({
  selectedSales
}) => {
  const map = useMap();
  useEffect(() => {
    if (selectedSales && selectedSales.latitude && selectedSales.longitude) {
      map.flyTo([selectedSales.latitude, selectedSales.longitude], 15, {
        duration: 1.2
      });
    }
  }, [selectedSales, map]);
  return null;
};



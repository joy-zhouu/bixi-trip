import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

function App() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('2025');
  const [mapLoaded, setMapLoaded] = useState(false);

  const layers = [
    { id: '2025', url: 'mapbox://joyzhou.1gdeht5m', sourceLayer: '2025-argrz3', color: 'rgb(230, 97, 80)' },
    { id: '2024', url: 'mapbox://joyzhou.1k9lpdpr', sourceLayer: '2024-2toy6l', color: 'rgb(70, 180, 120)' },
    { id: '2023', url: 'mapbox://joyzhou.9s9fgc8v', sourceLayer: '2023-4518gh', color: 'rgb(220, 150, 200)' },
    { id: '2022', url: 'mapbox://joyzhou.ao85t547', sourceLayer: '2022-9hxm8b', color: 'rgb(179, 115, 55)' },
    { id: '2021', url: 'mapbox://joyzhou.0ql7ia6g', sourceLayer: '2021-2lhdsi', color: 'rgba(55,148,179,1)' },
  ];

  const activeIndex = layers.findIndex(layer => layer.id === activeLayer);
  const layerToggleWidth = 60; // Fixed width for each toggle in pixels

  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = 'pk.eyJ1Ijoiam95emhvdSIsImEiOiJja3k0cjBmbDQwOXpsMm9vYWxiZzU3bnRpIn0.UgZTLd8-0YEpX0Fnq28rMA';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-73.58781, 45.50884],
      zoom: 12,
      style: 'mapbox://styles/mapbox/light-v11'
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      layers.forEach(layer => {
        if (!map.getSource(layer.id)) {
          map.addSource(layer.id, {
            type: 'vector',
            url: layer.url,
          });
        }
        map.addLayer({
          id: layer.id,
          type: 'circle',
          source: layer.id,
          layout: {
            visibility: layer.id === activeLayer ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': 8,
            'circle-color': layer.color,
          },
          'source-layer': layer.sourceLayer,
        });
      });
    });
    
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    layers.forEach(layer => {
      if (mapRef.current.getLayer(layer.id)) {
        const visibility = layer.id === activeLayer ? 'visible' : 'none';
        mapRef.current.setLayoutProperty(layer.id, 'visibility', visibility);
      }
    });
  }, [activeLayer, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;

    const clickHandler = (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: layers.map(l => l.id) });
      if (!features.length) return;

      const feature = features[0];

      const popup = new mapboxgl.Popup({ offset: 25, className: 'station-popup' })
        .setLngLat(feature.geometry.coordinates)
        .setHTML(`<h3>${feature.properties.Station}</h3><p>Trips Started: ${feature.properties['Trips Started']}</p>
          <p>Trips Ended: ${feature.properties['Trips Ended']}</p>
          <p>Total Trips: ${feature.properties['Total Trips']}</p>`)
        .addTo(map);
    };

    map.on('click', clickHandler);

    // Change cursor to pointer when hovering over a station
    const mouseEnterHandler = () => { map.getCanvas().style.cursor = 'pointer'; };
    const mouseLeaveHandler = () => { map.getCanvas().style.cursor = ''; };

    layers.forEach(layer => {
        map.on('mouseenter', layer.id, mouseEnterHandler);
        map.on('mouseleave', layer.id, mouseLeaveHandler);
    });

    return () => {
      map.off('click', clickHandler);
      layers.forEach(layer => {
        map.off('mouseenter', layer.id, mouseEnterHandler);
        map.off('mouseleave', layer.id, mouseLeaveHandler);
    });
    };
  }, [mapLoaded, layers]);

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
  };

  return (
    <div className="app-container">
      <h1 className="main-title">Montreal BIXI Stations</h1>
      <div id="menu" className="menu">
        {layers.map(layer => (
          <div className="layer-toggle" key={layer.id}>
            <input
              id={layer.id}
              type="radio"
              name="layer"
              checked={activeLayer === layer.id}
              onChange={() => handleLayerChange(layer.id)}
            />
            <label htmlFor={layer.id}>{layer.id}</label>
          </div>
        ))}
        <div className="glider" style={{ transform: `translateX(${activeIndex * layerToggleWidth}px)` }}></div>
      </div>
      <div id="map" ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default App;

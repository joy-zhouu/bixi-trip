import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import markerUrl from './assets/marker.svg?url';

function App() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('2025');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('points');

  const layers = [
    { id: '2025', url: 'mapbox://joyzhou.1gdeht5m', sourceLayer: '2025-argrz3'},
    { id: '2024', url: 'mapbox://joyzhou.1k9lpdpr', sourceLayer: '2024-2toy6l'},
    { id: '2023', url: 'mapbox://joyzhou.9s9fgc8v', sourceLayer: '2023-4518gh'},
    { id: '2022', url: 'mapbox://joyzhou.ao85t547', sourceLayer: '2022-9hxm8b'},
    { id: '2021', url: 'mapbox://joyzhou.9r3lscsn', sourceLayer: '2021-ara0bn'},
  ];

  const activeIndex = layers.findIndex(layer => layer.id === activeLayer);
  const layerToggleWidth = 50; // Fixed width for each toggle in pixels

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
      
      const image = new Image(30, 30);
      image.onload = () => {
        if (!map.hasImage('custom-marker')) {
          map.addImage('custom-marker', image, { sdf: true });
        }

        layers.forEach(layer => {
          if (!map.getSource(layer.id)) {
            map.addSource(layer.id, {
              type: 'vector',
              url: layer.url,
            });
          }
      
          // POINT SYMBOL LAYER (SVG marker)
          map.addLayer({
            id: layer.id,
            type: 'symbol',
            source: layer.id,
            'source-layer': layer.sourceLayer,
            layout: {
              'icon-image': 'custom-marker',
              'icon-size': 1,
              'icon-allow-overlap': true,
              visibility: 'none',
            },
            paint: {
              'icon-color': '#FF0000'
            }
          });
      
          // HEATMAP LAYER
          map.addLayer({
            id: `${layer.id}-heatmap`,
            type: 'heatmap',
            source: layer.id,
            'source-layer': layer.sourceLayer,
            layout: {
              visibility: 'none',
            },
            paint: {
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.4, 'rgb(209,229,240)',
                0.6, 'rgb(253,219,199)',
                0.8, 'rgb(239,138,98)',
                1, 'rgb(178,24,43)'
              ],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
              'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0.5],
            }
          });
        });
      };
      image.onerror = (e) => {
        console.error("Error loading SVG for map marker:", e);
      };
      image.src = markerUrl;
    });

    // Add navigation controls (zoom in/out)
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    layers.forEach(layer => {
      // Point layer
      if (map.getLayer(layer.id)) {
        map.setLayoutProperty(
          layer.id,
          'visibility',
          layer.id === activeLayer && viewMode === 'points' ? 'visible' : 'none'
        );
      }
      // Heatmap layer
      if (map.getLayer(`${layer.id}-heatmap`)) {
        map.setLayoutProperty(
          `${layer.id}-heatmap`,
          'visibility',
          layer.id === activeLayer && viewMode === 'heatmap' ? 'visible' : 'none'
        );
      }
    });
  }, [activeLayer, viewMode, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;

    const clickHandler = (e) => {
      if (viewMode !== 'points') return;
      const features = map.queryRenderedFeatures(e.point, { layers: layers.map(l => l.id) });
      if (!features.length) return;

      const feature = features[0];

      new mapboxgl.Popup({ offset: 25, className: 'station-popup' })
        .setLngLat(feature.geometry.coordinates)
        .setHTML(`<h3>${feature.properties['Station']}</h3><p>Trips Started: ${feature.properties['Trips Started']}</p>
          <p>Trips Ended: ${feature.properties['Trips Ended']}</p>
          <p>Total Trips: ${feature.properties['Total Trips']}</p>`)
        .addTo(map);
    };

    map.on('click', clickHandler);

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
  }, [mapLoaded, layers, viewMode]);

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
  };

  return (
    <div className="app-container">
      <h2 className="main-title">BIXI Through the Years</h2>
      <p className="map-description">Visualization of BIXI station data from 2021-2025 using Mapbox. Click on a station to see more information about it, explore the menu to switch between years, or choose to view the data in different formats.</p>
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
      
      <div className="mode-toggle">
        <label>
          <input
            type="radio"
            name="viewMode"
            value="points"
            checked={viewMode === 'points'}
            onChange={() => setViewMode('points')}
          />
          Stations
        </label>
        <label>
          <input
            type="radio"
            name="viewMode"
            value="heatmap"
            checked={viewMode === 'heatmap'}
            onChange={() => setViewMode('heatmap')}
          />
          Heatmap
        </label>
      </div>

      <div id="map" ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default App;

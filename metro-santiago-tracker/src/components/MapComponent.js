
import 'leaflet/dist/leaflet.css';
import trainIconUrl from '../Images/train.png'
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';
import StationsTable from './StationsTable'
import TrainsTable from './TrainsTable'
import './index.css'
import ChatComponent from './ChatComponent';
// Configura el ícono por defecto de Leaflet para todos los marcadores
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerIconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const trainIcon = new L.Icon({
    iconUrl: trainIconUrl,
    iconSize: [35, 35], // Tamaño del ícono, puedes ajustarlo según tus necesidades
    iconAnchor: [17, 35], // Punto del ícono que corresponderá a la posición del marcador
    popupAnchor: [0, -35] // Donde aparecerá el popup, relativo al ícono
  });

const MapComponent = () => {
  const [stations, setStations] = useState([]);
  const [lines, setLines] = useState([]);
  const [trains, setTrains] = useState({});
  const [ws, setWs] = useState(null);

    const connectWebsocket = () => {
      const fetchTrainDetails = async () => {
        try {
          const response = await fetch('https://tarea-2.2024-1.tallerdeintegracion.cl/api/metro/trains');
          if (!response.ok) {
            throw new Error('Failed to fetch train details');
          }
          const trainDetails = await response.json();
          setTrains(prevTrains => {
            const updatedTrains = {...prevTrains}; // Crear una copia del estado actual
      
            // Iterar sobre los datos nuevos y actualizar el estado
            trainDetails.forEach(train => {
              const existingTrain = updatedTrains[train.train_id] || {};
              
              // Actualizar los datos conservando los valores temporales como current_station_id
              updatedTrains[train.train_id] = {
                ...existingTrain,
                ...train,
                lat: existingTrain.lat || null,
                long: existingTrain.long || null,
                current_station_id: existingTrain.current_station_id || "Desconocida"
              };
            });
      
            return updatedTrains;
          });
        } catch (error) {
          console.error('Error fetching train details:', error);
        }
      };

        const ws = new WebSocket('wss://tarea-2.2024-1.tallerdeintegracion.cl/connect');
        setWs(ws);
    ws.onopen = () => {
        console.log('WebSocket Connected');
        // Envía el evento JOIN
        ws.send(JSON.stringify({
            type: "JOIN",
            payload: {
                id: "20639597",  // Sustituye esto por tu número de alumno real
                username: "VicenteSaldana"  // Opcional, sustituye por tu nombre de usuario
            }
        }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'position') {
            const { train_id, position } = message.data;
            setTrains(prevTrains => {
              const existingTrain = prevTrains[train_id];
              if (existingTrain) {
                // Actualiza sólo la posición si el tren ya existe
                return {
                  ...prevTrains,
                  [train_id]: {
                    ...existingTrain,
                    ...position
                  }
                };
              } else {
                // El tren es nuevo, inicializa con datos desconocidos y llama a fetchTrainDetails si es necesario
                const newTrainData = {
                  ...position,
                  train_id,
                  driver_name: "Desconocido", // Valores por defecto hasta que se actualicen
                  line_id: "Desconocido",
                  origin_station_id: "Desconocida",
                  destination_station_id: "Desconocida",
                  current_station_id: "Desconocida"
                };
                if (newTrainData.driver_name === "Desconocido") {
                  fetchTrainDetails();
                }
                return {
                  ...prevTrains,
                  [train_id]: newTrainData
                };
              }
            });
          }
        else if(message.type === 'arrival'){
            console.log('Arribo un tren');
            const { train_id: arrivalTrainId, station_id } = message.data;
            setTrains(prevTrains => ({
                ...prevTrains,
                [arrivalTrainId]: { ...prevTrains[arrivalTrainId], current_station_id: station_id }
            }));
                }

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

    ws.onclose = () => {
        console.log("WebSocket Closed. Attempting to reconnect...");
        setTimeout(() => {
            ws.close();
            connectWebsocket();  // Asegúrate de cerrar la conexión anterior antes de reconectar
        }, 1000);
    };    
    
    }
}

  useEffect(() => {
    

    const fetchData = async () => {
        // Carga inicial de datos de las estaciones y líneas
        const stationsResponse = await fetch('https://tarea-2.2024-1.tallerdeintegracion.cl/api/metro/stations');
        const stationsData = await stationsResponse.json();
        setStations(stationsData);
    
        const linesResponse = await fetch('https://tarea-2.2024-1.tallerdeintegracion.cl/api/metro/lines');
        const linesData = await linesResponse.json();
        setLines(linesData);
    
        // Carga inicial de datos de los trenes
        const trainsResponse = await fetch('https://tarea-2.2024-1.tallerdeintegracion.cl/api/metro/trains');
        const trainsData = await trainsResponse.json();
        const trainsMap = {};
        trainsData.forEach(train => {
          trainsMap[train.train_id] = { ...train, lat: null, long: null }; // inicializa lat y long como nulas
        });
        setTrains(trainsMap);
      };
      fetchData();
      connectWebsocket()

  }, []);


  // Función para convertir station_ids a coordenadas
  const lineCoordinates = (line) => {
    return line.station_ids.map(stationId => {
      const station = stations.find(s => s.station_id === stationId);
      return station ? [station.position.lat, station.position.long] : null;
    }).filter(coord => coord !== null);
  };

  return (
    <div >
    <MapContainer center={[-33.45, -70.6667]} zoom={12} style={{ height: '100vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {Object.entries(trains).map(([trainId, { lat, long, driver_name, line_id, origin_station_id, destination_station_id }]) =>
        lat && long && (
          <Marker key={trainId} position={[lat, long]} icon={trainIcon}>
            <Popup>
                <table>
            <tbody>
            <tr>{`Train ID: ${trainId}`}</tr>
            <tr>Línea {line_id} </tr>
            <tr>Chofer: {driver_name} </tr>
            <tr>Origen: {origin_station_id} </tr>
            <tr>Destino: {destination_station_id} </tr>
            </tbody>
            </table>
            </Popup>
          </Marker>
          )
        )}
      {stations.map(station => (
        <Marker key={`${station.station_id}-${station.line_id}`} position={[station.position.lat, station.position.long]}>
          <Popup><table>
            <tbody>
            <tr>{station.station_id}</tr>
            <tr>{station.name}</tr>
            <tr>Línea {station.line_id}</tr>
            </tbody>
            </table></Popup>
        </Marker>
      ))}
      {lines.map(line => (
        <Polyline key={line.line_id} positions={lineCoordinates(line)} color={line.color} />
      ))}
    </MapContainer>
    <div className="tables-container">
        <StationsTable stations={stations} />
        <TrainsTable trains={trains} stations={stations} />
      {ws ? <ChatComponent ws={ws} /> : <p>Connecting to chat...</p>}

      </div>
    </div>
  );
};

export default MapComponent;
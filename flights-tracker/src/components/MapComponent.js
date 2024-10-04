import 'leaflet/dist/leaflet.css'; 
import planeIconUrl from '../Images/plane.png';
import blueAirportIconUrl from '../Images/red-airportpng.png';
import redAirportIconUrl from '../Images/blue-airport.png';
import takeOffIconUrl from '../Images/takeoff.png';
import landingIconUrl from '../Images/landing.png';
import crashedIconUrl from '../Images/crashed.png';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';
import './index.css';
import FlightsTable from './FlightsTable';

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

const planeIcon = new L.Icon({
  iconUrl: planeIconUrl,
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  zIndexOffset: 500
});

const blueAirportIcon = new L.Icon({
  iconUrl: blueAirportIconUrl,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
  zIndexOffset: 100
});

const redAirportIcon = new L.Icon({
  iconUrl: redAirportIconUrl,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
  zIndexOffset: 100
});

const takeOffIcon = new L.Icon({
  iconUrl: takeOffIconUrl,
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  zIndexOffset: 800
});

const landingIcon = new L.Icon({
  iconUrl: landingIconUrl,
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  zIndexOffset: 900
});

const crashedIcon = new L.Icon({
  iconUrl: crashedIconUrl,
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  zIndexOffset: 1000
});

// Función para calcular la distancia entre dos puntos (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
}

function getPlaneIconAndZIndex(plane) {
  if (plane.eventType === 'crashed') {
    return { icon: crashedIcon, zIndex: 1000 };
  }
  if (plane.eventType === 'landing') {
    return { icon: landingIcon, zIndex: 900 };
  }
  if (plane.eventType === 'take-off') {
    return { icon: takeOffIcon, zIndex: 800 };
  }
  return { icon: planeIcon, zIndex: 700 };
}

// Función para normalizar la longitud a -180 a 180
function normalizeLongitude(lon) {
  if (lon > 180) {
    return lon - 360;
  } else if (lon < -180) {
    return lon + 360;
  }
  return lon;
}

// Función para dividir las posiciones al cruzar el meridiano
function splitPositionsAtMeridian(positions) {
  const segments = [];
  let currentSegment = [];

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (currentSegment.length === 0) {
      currentSegment.push([pos.lat, pos.long]);
      continue;
    }

    const lastPos = currentSegment[currentSegment.length - 1];
    const deltaLon = Math.abs(pos.long - lastPos[1]);

    if (deltaLon > 180) {
      // Cruce del meridiano, iniciar un nuevo segmento
      segments.push(currentSegment);
      currentSegment = [[pos.lat, pos.long]];
    } else {
      currentSegment.push([pos.lat, pos.long]);
    }
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

const MapComponent = () => {
  const [flights, setFlights] = useState({});
  const [planes, setPlanes] = useState({});
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('wss://tarea-2.2024-2.tallerdeintegracion.cl/connect');

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      ws.current.send(JSON.stringify({
        type: "join",
        id: "20639597",
        username: "VicenteSaldana"
      }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'flights') {
        const { flights } = message;
        setFlights(flights);
        const flightIds = Object.keys(flights);

        // Actualizar el estado de los aviones para eliminar aquellos que ya no están en 'flights'
        setPlanes(prevPlanes => {
          const newPlanes = {};
          flightIds.forEach(id => {
            if (prevPlanes[id]) {
              newPlanes[id] = prevPlanes[id];
            }
          });
          return newPlanes;
        });
      } else if (message.type === 'plane') {
        const { plane } = message;
        setPlanes(prevPlanes => {
          const previousPlane = prevPlanes[plane.flight_id];
          let newPositions = [];

          if (previousPlane) {
            const lastPosition = previousPlane.positions[previousPlane.positions.length - 1];
            let newLon = plane.position.long;
            const deltaLon = Math.abs(newLon - lastPosition.long);
            if (deltaLon > 180) {
              newLon = normalizeLongitude(newLon);
            }
            newPositions = [...previousPlane.positions, { lat: plane.position.lat, long: newLon }];
          } else {
            newPositions = [{ lat: plane.position.lat, long: normalizeLongitude(plane.position.long) }];
          }

          return {
            ...prevPlanes,
            [plane.flight_id]: {
              ...prevPlanes[plane.flight_id],
              flight_id: plane.flight_id,
              status: plane.status,
              airline: plane.airline.name,
              captain: plane.captain,
              eta: plane.ETA,
              arrival: plane.arrival,
              distance: plane.distance,
              positions: newPositions,
              eventType: prevPlanes[plane.flight_id]?.eventType || null,
            }
          };
        });
      } else if (['take-off', 'landing', 'crashed'].includes(message.type)) {
        const eventType = message.type;
        const flightId = message.flight_id;

        setPlanes(prevPlanes => {
          const plane = prevPlanes[flightId];
          if (plane) {
            return {
              ...prevPlanes,
              [flightId]: {
                ...plane,
                eventType: eventType
              }
            };
          }
          return prevPlanes;
        });

        const duration = eventType === 'crashed' ? 60000 : 10000; // 1 minuto para crashed, 10 segundos para los demás

        setTimeout(() => {
          setPlanes(prevPlanes => {
            const plane = prevPlanes[flightId];
            if (plane) {
              const updatedPlane = { ...plane };
              delete updatedPlane.eventType;

              // Si es crashed, eliminamos el avión del mapa
              if (eventType === 'crashed') {
                const newPlanes = { ...prevPlanes };
                delete newPlanes[flightId];
                return newPlanes;
              }

              return {
                ...prevPlanes,
                [flightId]: updatedPlane
              };
            }
            return prevPlanes;
          });
        }, duration);
      } else if (message.type === 'message') {
        const { flight_id, level, name, date, content } = message.message;
        setMessages(prevMessages => [
          ...prevMessages, 
          { flight_id, level, name, date: new Date(date), content }
        ]);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket Closed. Intentando reconectar...");
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    if (e.key === 'Enter' && newMessage.trim() !== '') {
      const messageData = {
        type: 'chat',
        content: newMessage,
      };
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(messageData));
        setNewMessage('');
      } else {
        console.error('WebSocket no está conectado.');
      }
    }
  };

  function getPlaneIcon(plane) {
    console.log(plane.eventType);
    if (plane.eventType === 'take-off') return takeOffIcon;
    if (plane.eventType === 'landing') return landingIcon;
    if (plane.eventType === 'crashed') return crashedIcon;
    return planeIcon; // Ícono por defecto
  }

  return (
    <div>
      <MapContainer 
        center={[-33.45, -70.6667]} 
        zoom={12} 
        style={{ height: '60vh', width: '100%' }}
        worldCopyJump={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          noWrap={true}
        />

        {Object.values(flights).map(flight => (
          <React.Fragment key={flight.id}>
            {/* Ruta de vuelo */}
            <Polyline
              positions={[
                [flight.departure.location.lat, flight.departure.location.long],
                [flight.destination.location.lat, flight.destination.location.long]
              ]}
              color="blue"
            />

            {/* Marcador del aeropuerto de salida */}
            <Marker 
              position={[flight.departure.location.lat, flight.departure.location.long]} 
              icon={blueAirportIcon}
            >
              <Popup>
                <div>
                  <strong>Aeropuerto de salida:</strong> {flight.departure.name}<br />
                  <strong>Ciudad:</strong> {flight.departure.city.name}<br />
                  <strong>País:</strong> {flight.departure.city.country.name}
                </div>
              </Popup>
            </Marker>

            {/* Marcador del aeropuerto de destino */}
            <Marker 
              position={[flight.destination.location.lat, flight.destination.location.long]} 
              icon={redAirportIcon}
            >
              <Popup>
                <div>
                  <strong>Aeropuerto de destino:</strong> {flight.destination.name}<br />
                  <strong>Ciudad:</strong> {flight.destination.city.name}<br />
                  <strong>País:</strong> {flight.destination.city.country.name}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Aviones en tiempo real */}
        {Object.entries(planes).map(([flightId, plane]) => {
          const { positions, airline, captain, status, eta, arrival, distance } = plane;

          if (!positions || positions.length === 0) return null;

          // Obtener la posición actual y la inicial
          const initialPosition = positions[0];
          const currentPosition = positions[positions.length - 1];
          const lat = currentPosition.lat;
          const long = currentPosition.long;

          // Calcular desplazamiento
          let displacement = 0;
          if (initialPosition && currentPosition) {
            displacement = calculateDistance(initialPosition.lat, initialPosition.long, currentPosition.lat, currentPosition.long).toFixed(2); // en km
          }

          const { icon, zIndex } = getPlaneIconAndZIndex(plane);

          // Dividir las posiciones en segmentos que no crucen el meridiano
          const segments = splitPositionsAtMeridian(positions);

          return (
            <React.Fragment key={flightId}>
              {/* Líneas de desplazamiento */}
              {segments.map((segment, idx) => (
                <Polyline
                  key={`${flightId}-segment-${idx}`}
                  positions={segment}
                  color="green"
                  weight={3}
                />
              ))}

              {/* Marcador del avión */}
              <Marker 
                position={[lat, long]} 
                icon={icon}
                zIndexOffset={zIndex}
              >
                <Popup>
                  <table>
                    <tbody>
                      <tr><td><strong>Vuelo ID:</strong></td><td>{flightId}</td></tr>
                      <tr><td><strong>Aerolínea:</strong></td><td>{airline}</td></tr>
                      <tr><td><strong>Capitán:</strong></td><td>{captain}</td></tr>
                      <tr><td><strong>Estado:</strong></td><td>{status}</td></tr>
                      <tr><td><strong>ETA:</strong></td><td>{eta}</td></tr>
                      <tr><td><strong>Fecha de llegada:</strong></td><td>{arrival}</td></tr>
                      <tr><td><strong>Distancia al destino:</strong></td><td>{distance}</td></tr>
                      <tr><td><strong>Desplazamiento desde conexión:</strong></td><td>{displacement} km</td></tr>
                    </tbody>
                  </table>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

      </MapContainer>

      {/* Tabla Informativa de Vuelos */}
      <FlightsTable flights={flights} planes={planes}/>

      {/* Chat */}
      <div className="chat-container" style={styles.chatContainer}>
        <ul style={styles.chatMessages}>
          {messages.map((msg, idx) => (
            <li key={idx} style={{ 
              ...styles.chatMessage, 
              ...(msg.level === 'warn' ? styles.warnMessage : styles.infoMessage) 
            }}>
              <div style={styles.messageHeader}>
                <strong>{msg.name}</strong> 
                <span style={styles.messageDate}>
                  {msg.date.toLocaleString()}
                </span>
              </div>
              <div>{msg.content}</div>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleSendMessage}
          placeholder="Escribe un mensaje y presiona Enter"
          style={styles.chatInput}
        />
      </div>
    </div>
  );
};

const styles = {
  chatContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '300px',
    maxHeight: '400px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '10px',
    overflowY: 'auto',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    zIndex: '1000'
  },
  chatMessages: {
    listStyleType: 'none',
    padding: '0',
    margin: '0 0 10px 0',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  chatMessage: {
    marginBottom: '10px',
    padding: '5px',
    borderRadius: '4px',
    backgroundColor: '#f1f1f1'
  },
  warnMessage: {
    backgroundColor: '#ffe6e6',
    border: '1px solid #ff4d4d'
  },
  infoMessage: {
    backgroundColor: '#e6f7ff',
    border: '1px solid #91d5ff'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '3px'
  },
  messageDate: {
    fontSize: '12px',
    color: '#555'
  },
  chatInput: {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box',
    borderRadius: '3px',
    border: '1px solid #ccc'
  }
};

export default MapComponent;

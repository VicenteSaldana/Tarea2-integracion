import React from 'react';
import './FlightsTable.css'; 

const FlightsTable = ({ flights }) => {
  const flightsArray = Object.values(flights);

  flightsArray.sort((a, b) => {
    const depA = a.departure.name.toLowerCase();
    const depB = b.departure.name.toLowerCase();
    if (depA < depB) return -1;
    if (depA > depB) return 1;

    const destA = a.destination.name.toLowerCase();
    const destB = b.destination.name.toLowerCase();
    if (destA < destB) return -1;
    if (destA > destB) return 1;

    return 0;
  });

  return (
    <div className="flights-table-container">
      <h2>Tabla Informativa de Vuelos</h2>
      <table className="flights-table">
        <thead>
          <tr>
            <th>ID de Vuelo</th>
            <th>Aeropuerto de Origen</th>
            <th>Aeropuerto de Destino</th>
          </tr>
        </thead>
        <tbody>
          {flightsArray.map(flight => (
            <tr key={flight.id}>
              <td>{flight.id}</td>
              <td>
                {flight.departure.name} ({flight.departure.city.name}, {flight.departure.city.country.name})
              </td>
              <td>
                {flight.destination.name} ({flight.destination.city.name}, {flight.destination.city.country.name})
              </td>
            </tr>
          ))}
          {flightsArray.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No hay vuelos disponibles actualmente.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FlightsTable;
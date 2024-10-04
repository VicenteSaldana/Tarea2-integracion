import React from 'react';
import './FlightsTable.css'; 

const FlightsTable = ({ flights, planes }) => {
  const flightsArray = Object.values(flights);
  console.log(planes);

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
    <h2>Información de Vuelos</h2>
    <table className="flights-table">
      <thead>
        <tr>
          <th>Vuelo ID</th>
          <th>Aeropuerto de Origen</th>
          <th>Ciudad de Origen</th>
          <th>País de Origen</th>
          <th>Aeropuerto de Destino</th>
          <th>Ciudad de Destino</th>
          <th>País de Destino</th>
          <th>Estado</th>
          <th>ETA (horas)</th>
          <th>Capitán</th>
        </tr>
      </thead>
      <tbody>
        {flightsArray.map(flight => {
          const flightId = flight.id;
          const plane = planes[flightId];

          return (
            <tr key={flightId}>
              <td>{flightId}</td>
              <td>{flight.departure.name}</td>
              <td>{flight.departure.city.name}</td>
              <td>{flight.departure.city.country.name}</td>
              <td>{flight.destination.name}</td>
              <td>{flight.destination.city.name}</td>
              <td>{flight.destination.city.country.name}</td>
              <td>{plane ? plane.status : 'Desconocido'}</td>
              <td>{plane ? plane.eta.toFixed(2) : 'N/A'}</td>
              <td>{plane ? plane.captain : 'N/A'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
};

export default FlightsTable;
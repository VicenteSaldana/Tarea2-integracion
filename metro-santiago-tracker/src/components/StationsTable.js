const StationsTable = ({ stations }) => {
    return (
        <div>
            <h3> Estaciones </h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Línea</th>
          </tr>
        </thead>
        <tbody>
          {stations.map(station => (
            <tr key={`${station.station_id}-${station.line_id}`}>
              <td>{station.station_id}</td>
              <td>{station.name}</td>
              <td>{station.line_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    );
  };

  export default StationsTable
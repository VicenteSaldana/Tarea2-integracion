const TrainsTable = ({ trains, stations }) => {
    return (
        <div>
            <h3> Trenes </h3>
      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre del Conductor</th>
            <th>Estación de Origen</th>
            <th>Estación de Destino</th>
            <th>Estación Actual</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(trains).map(train => (
            <tr key={train.train_id}>
              <td>{train.train_id}</td>
              <td>{train.driver_name}</td>
              <td>{stations.find(s => s.station_id === train.origin_station_id)?.name}</td>
              <td>{stations.find(s => s.station_id === train.destination_station_id)?.name}</td>
              <td>{stations.find(s => s.station_id === train.current_station_id)?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    );
  };

export default TrainsTable
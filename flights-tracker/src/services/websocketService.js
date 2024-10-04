const ws = new WebSocket('wss://tarea-2.2024-.tallerdeintegracion.cl/connect');

ws.onopen = () => {
  console.log('Connected to the WebSocket');
  // Enviar evento JOIN aquí
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

export default ws;
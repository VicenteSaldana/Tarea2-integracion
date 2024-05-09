import React, { useState, useEffect, useRef} from 'react';

const ChatComponent = ({ ws }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const lastMessageRef = useRef(null);

  // Escucha mensajes entrantes del WebSocket
  useEffect(() => {
    if (!ws) return;

    const receiveMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'message') {
        // Agrega el mensaje recibido al array de mensajes
        setMessages(prev => [...prev, {
          content: message.data.content,
          sender: message.data.name,
          timestamp: message.timestamp,
          level: message.data.level,
          train_id: message.data.train_id
        }]);
      }
    };

    ws.addEventListener('message', receiveMessage);

    return () => {
      ws.removeEventListener('message', receiveMessage);
    };
  }, [ws]);

  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Enviar el mensaje a través del WebSocket
      ws.send(JSON.stringify({
        type: "MESSAGE",
        payload: { content: newMessage }
      }));
      setNewMessage('');
    }
  };

  return (
    <div>
            <h3> Chat </h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid black', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            <p><strong>{msg.sender || 'System'}</strong> <small>{new Date(msg.timestamp).toLocaleTimeString()}</small></p>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
        style={{ width: '80%', marginRight: '10px' }}
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default ChatComponent;
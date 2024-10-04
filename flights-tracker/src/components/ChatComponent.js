import React, { useState } from 'react';
import ws from '../services/websocketService';

const ChatComponent = () => {
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    const chatMessage = { type: "MESSAGE", payload: { content: message } };
    ws.send(JSON.stringify(chatMessage));
    setMessage('');
  };

  return (
    <div>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatComponent;
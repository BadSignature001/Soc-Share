import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import 'tailwindcss/tailwind.css';
import Navbar from './components/Navbar';

const socket = io('https://soc-share-backend.onrender.com');

function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [peer, setPeer] = useState(null);
  const [fileToSend, setFileToSend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
      setLoading(clients.length === 0); 
    }, 1000); 

    socket.on('clients', (initialClients) => {
      setClients(initialClients);
      if (initialLoad) {
        setLoading(false); 
      } else {
        setLoading(initialClients.length === 0); 
      }
    });

    socket.on('new-client', (newClient) => {
      setClients((prevClients) => [...prevClients, newClient]);
    });

    socket.on('client-disconnected', (clientId) => {
      setClients((prevClients) => prevClients.filter(client => client.id !== clientId));
    });

    socket.on('webrtc-signal', (data) => {
      if (peer) {
        peer.signal(data);
      }
    });

    return () => {
      socket.off('clients');
      socket.off('new-client');
      socket.off('client-disconnected');
      socket.off('webrtc-signal');
      clearTimeout(timer); 
    };
  }, [clients, initialLoad, peer]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && selectedClient) {
      setFileToSend(file);
      if (peer) {
        sendFile(file);
      } else {
        console.error('No peer connection found');
      }
    }
  };

  const handleClientClick = (clientId) => {
    setSelectedClient(clientId);
    initiatePeerConnection(clientId);
    document.getElementById('fileInput').click();
  };

  const sendFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result;
      if (peer) {
        peer.send(fileData);
      } else {
        console.error('No peer connection found');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const initiatePeerConnection = (clientId) => {
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
    });

    newPeer.on('signal', (data) => {
      console.log('Sending signaling data:', data);
      socket.emit('webrtc-signal', data);
    });

    newPeer.on('data', (data) => {
      console.log('Receiving data:', data);
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'received_file';
      link.click();
      URL.revokeObjectURL(url);
    });

    newPeer.on('error', (err) => {
      console.error('WebRTC error:', err);
    });

    setPeer(newPeer);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-8">Available Clients</h1>
        
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <ul className="bg-white shadow-md rounded-lg w-full max-w-lg p-6">
            {clients.length === 0 ? (
              <li className="text-center text-gray-500">No clients available</li>
            ) : (
              clients.map(client => (
                <li 
                  key={client.id} 
                  className="cursor-pointer p-4 mb-2 bg-gray-100 rounded hover:bg-gray-200 transition"
                  onClick={() => handleClientClick(client.id)}
                >
                  {client.name}
                </li>
              ))
            )}
          </ul>
        )}
        <input
          type="file"
          id="fileInput"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </>
  );
}

export default App;

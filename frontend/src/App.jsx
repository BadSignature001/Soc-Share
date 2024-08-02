import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import 'tailwindcss/tailwind.css';
import Navbar from './components/Navbar';

const socket = io('http://localhost:5000');

function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
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

    socket.on('receive-file', (data) => {
      console.log(`Receiving file: ${data.fileName} from ${data.fileUrl}`);
      const link = document.createElement('a');
      link.href = data.fileUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    return () => {
      socket.off('clients');
      socket.off('new-client');
      socket.off('client-disconnected');
      socket.off('receive-file');
      clearTimeout(timer); 
    };
  }, [clients, initialLoad]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && selectedClient) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target.result.split(',')[1];
        console.log(`Sending file: ${file.name} to ${selectedClient}`);
        socket.emit('send-file', {
          fileName: file.name,
          fileData: fileData,
          recipientId: selectedClient
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClientClick = (clientId) => {
    setSelectedClient(clientId);
    document.getElementById('fileInput').click();
  };

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Avaliable Clients</h1>
      
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

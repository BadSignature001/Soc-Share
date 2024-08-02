const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

// Function to get local IP addresses
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const localIPs = new Set();
  
  for (const key of Object.keys(interfaces)) {
    for (const iface of interfaces[key]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIPs.add(iface.address);
      }
    }
  }
  
  return localIPs;
};

const localIPs = getLocalIPs();

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Get the client's IP address (this is a simplistic approach; real-world implementations may differ)
  const clientIP = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
  console.log(`Client IP: ${clientIP}`);

  // Assign a random name to the new client
  const randomName = `User-${Math.floor(Math.random() * 1000)}`;
  const newClient = { id: socket.id, name: randomName, ip: clientIP };
  
  // Add the client only if they're on the same network
  if (localIPs.has(clientIP)) {
    clients.push(newClient);
    socket.emit('clients', clients.filter(client => client.id !== socket.id));
    socket.broadcast.emit('new-client', newClient);
  } else {
    console.log(`Client ${socket.id} is not on the same network.`);
    socket.disconnect();
  }

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    clients = clients.filter(client => client.id !== socket.id);
    io.emit('client-disconnected', socket.id);
  });

  socket.on('send-file', (data) => {
    const { fileName, fileData, recipientId } = data;
    console.log(`Received file: ${fileName} from ${socket.id} to ${recipientId}`);
    const buffer = Buffer.from(fileData, 'base64');
    const filePath = path.join(__dirname, 'uploads', fileName);

    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('Error saving file:', err);
        return;
      }

      console.log(`File saved: ${filePath}`);
      io.to(recipientId).emit('receive-file', {
        fileName: fileName,
        fileUrl: `http://localhost:${PORT}/uploads/${fileName}`
      });
    });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

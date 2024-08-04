// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

let clients = [];

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Assign a random name to the new client
  const randomName = `User-${Math.floor(Math.random() * 1000)}`;
  clients.push({ id: socket.id, name: randomName });

  // Notify the new client about the existing clients
  socket.emit('clients', clients.filter(client => client.id !== socket.id));

  // Notify existing clients about the new client
  socket.broadcast.emit('new-client', { id: socket.id, name: randomName });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    clients = clients.filter(client => client.id !== socket.id);

    // Notify all clients about the disconnected client
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
        fileUrl: `https://soc-share-backend.onrender.com/uploads/${fileName}`
      });
    });
  });
});



server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

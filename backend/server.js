const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); 

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Limit file size to 100 MB
}).single('file');

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  const randomName = `User-${Math.floor(Math.random() * 1000)}`;
  clients.push({ id: socket.id, name: randomName });

  socket.emit('clients', clients.filter(client => client.id !== socket.id));
  socket.broadcast.emit('new-client', { id: socket.id, name: randomName });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    clients = clients.filter(client => client.id !== socket.id);
    io.emit('client-disconnected', socket.id);
  });

  socket.on('send-file', (data) => {
    upload(data.file, (err) => {
      if (err) {
        console.error('Error saving file:', err);
        return;
      }

      const fileName = data.file.filename;
      const recipientId = data.recipientId;

      console.log(`File saved: ${fileName}`);
      io.to(recipientId).emit('receive-file', {
        fileName: fileName,
        fileUrl: `https://soc-share-backend.onrender.com/uploads/${fileName}`
      });
    });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

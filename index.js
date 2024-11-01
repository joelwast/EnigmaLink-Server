const MessagingServer = require('./server');

// Crear una instancia del servidor
const server = new MessagingServer();

// Manejar eventos del servidor
server.on('serverStarted', (ip, port) => {
    console.log(`Servidor escuchando en ${ip}:${port}`);
});

server.on('serverStopped', () => {
    console.log('Servidor detenido.');
});

server.on('clientConnected', (clientSocket) => {
    console.log(`Cliente conectado: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
});

server.on('clientDisconnected', (clientSocket) => {
    console.log(`Cliente desconectado: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
});

server.on('messageReceived', (clientSocket, message) => {
    console.log(`Mensaje recibido de ${clientSocket.remoteAddress}:${clientSocket.remotePort}: ${message}`);
});

server.on('error', (err, clientSocket) => {
    if (clientSocket) {
        console.log(`Error de comunicación con ${clientSocket.remoteAddress}:${clientSocket.remotePort}: ${err.message}`);
    } else {
        console.error(`Error del servidor: ${err.message}`);
    }
});

// Iniciar el servidor
const port = 5050; // Puedes cambiar este puerto según tus necesidades
server.start(port);

// Para detener el servidor, puedes usar server.stop() en el futuro

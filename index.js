const net = require('net');
const readline = require('readline');
const os = require('os');

const clients = new Map();

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0'; // Fallback to all interfaces if no specific IP is found
}

function handleClient(socket, port) {
    console.log(`Nuevo cliente conectado en puerto ${port}: ${socket.remoteAddress}:${socket.remotePort}`);
    clients.set(socket, port);

    socket.on('data', (data) => {
        const [encryptedMessage, key] = data.toString().split('|');
        console.log(`Mensaje recibido de ${socket.remoteAddress}:${socket.remotePort} en puerto ${port}`);

        // Reenvía el mensaje cifrado y la clave a todos los clientes en este puerto
        for (const [clientSocket, clientPort] of clients.entries()) {
            if (clientSocket !== socket && clientPort === port) {
                clientSocket.write(`${encryptedMessage}|${key}`);
            }
        }
    });

    socket.on('end', () => {
        console.log(`Cliente desconectado en puerto ${port}: ${socket.remoteAddress}:${socket.remotePort}`);
        clients.delete(socket);
    });

    socket.on('error', (err) => {
        console.error(`Error en la conexión con ${socket.remoteAddress}:${socket.remotePort} en puerto ${port}: ${err.message}`);
        clients.delete(socket);
    });
}

function startServer(port) {
    const server = net.createServer((socket) => handleClient(socket, port));

    server.listen(port, getLocalIP(), () => {
        console.log(`Servidor escuchando en ${getLocalIP()}:${port}`);
    });

    server.on('error', (err) => {
        console.error(`Error en el servidor en puerto ${port}: ${err.message}`);
    });
}

function generateRandomPort() {
    return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024; // Puertos entre 1024 y 65535
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptForNewPort() {
    rl.question('¿Deseas generar un nuevo puerto para el servidor? (s/n): ', (answer) => {
        if (answer.toLowerCase() === 's') {
            const port = generateRandomPort();
            startServer(port);
            promptForNewPort(); // Preguntar de nuevo
        } else {
            console.log('Servidor cerrado.');
            rl.close();
        }
    });
}

// Iniciar el proceso
promptForNewPort();

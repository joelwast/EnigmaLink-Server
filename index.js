const express = require('express');
const net = require('net');
const os = require('os');
const cors = require('cors');
const readline = require('readline');

const app = express();
const clients = new Set(); // Usamos un Set para los clientes de la mensajería
app.use(cors()); // Habilitar CORS
app.use(express.json());

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            console.log(`Interfaz: ${devName}, Dirección: ${alias.address}, Interna: ${alias.internal}`);
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
}

function handleClient(socket) {
    console.log(`Nuevo cliente conectado: ${socket.remoteAddress}:${socket.remotePort}`);
    clients.add(socket);

    socket.on('data', (data) => {
        const [encryptedMessage, key] = data.toString().split('|');
        console.log(`Mensaje recibido de ${socket.remoteAddress}:${socket.remotePort}`);

        // Reenvía el mensaje cifrado y la clave a todos los clientes, excepto al remitente
        for (const client of clients) {
            if (client !== socket) {
                client.write(`${encryptedMessage}|${key}`);
            }
        }
    });

    socket.on('end', () => {
        console.log(`Cliente desconectado: ${socket.remoteAddress}:${socket.remotePort}`);
        clients.delete(socket);
    });

    socket.on('error', (err) => {
        console.error(`Error en la conexión con ${socket.remoteAddress}:${socket.remotePort}: ${err.message}`);
        clients.delete(socket);
    });
}

function startMessageServer(port) {
    const server = net.createServer(handleClient);
    server.listen(port, () => {
        const localIP = getLocalIP();
        console.log(`Servidor de mensajería escuchando en ${localIP}:${port}`);
    });

    server.on('error', (err) => {
        console.error(`Error en el servidor de mensajería en puerto ${port}: ${err.message}`);
    });
}

function startServer(port) {
    startMessageServer(port);
}

function generateRandomPort() {
    return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
}

app.get('/generate', (req, res) => {
    const port = generateRandomPort();
    startServer(port);

    const localIP = getLocalIP();
    const url = `http://${localIP}:${port}`;

    console.log(`IP local: ${localIP}:${port}`);
    console.log(`URL generada: ${url}`);

    res.json({ link: url, localIP: `${localIP}:${port}` });
});

app.listen(5000, () => {
    const localIP = getLocalIP();
    console.log(`API escuchando en el puerto 5000, IP: ${localIP}`);
});

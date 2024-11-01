const express = require('express');
const net = require('net');
const os = require('os');

const app = express();
const clients = new Map();

app.use(express.json());

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
    return '0.0.0.0';
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
    return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
}

app.get('/generate', (req, res) => {
    const port = generateRandomPort();
    startServer(port);
    const url = `http://${getLocalIP()}:${port}`; // Generar URL con IP local y puerto
    res.json({ link: url });
});

app.listen(5000, () => {
    console.log('API escuchando en http://localhost:5000');
});

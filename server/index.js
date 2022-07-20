require('dotenv/config')

const { Server } = require('socket.io')
const express = require('express')
const http = require('http')
const https = require('https')
const { readFileSync } = require('fs')

const app = express()

const httpServer = process.env.NODE_ENV === 'production' ?
    https.createServer({
        key: readFileSync(`/etc/letsencrypt/live/${process.env.SERVER_DOMAIN}/privkey.pem`),
        cert: readFileSync(`/etc/letsencrypt/live/${process.env.SERVER_DOMAIN}/cert.pem`)
    }, app) :
    http.createServer(app);

const socketIO = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    path: '/'
})

const rooms = []
const clients = []

socketIO.on('connection', socket => {

    socket.on('disconnect', () => {
        console.log('[disconnection] ' + socket.id);
        rooms.splice(rooms.findIndex((item) => item.id == socket.id), 1);
        clients.splice(clients.findIndex((id) => id == socket.id), 1)
        socketIO.emit('users', clients);
    });

    console.log('[connection] ' + socket.id);

    clients.push(socket.id)
    socketIO.emit('users', clients);

    socket.on('offer', (offer) => {
        socketIO.to(offer.to).emit('offer', offer)
    });

    socket.on('answer', (answer) => {
        console.log('[answer received]');
        socketIO.to(answer.to).emit('answer', answer)
    });

    socket.on('ice', ice => {
        socketIO.to(ice.to).emit('ice', ice)
    })
})

httpServer.listen(process.env.SERVER_PORT || 9090, () => console.log('Server running'))
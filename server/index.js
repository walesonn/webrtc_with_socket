const { Server } = require('socket.io')

const server = new Server({})

const rooms = []
const clients = []

server.on('connection', socket => {

    socket.on('disconnect', () => {
        console.log('[disconnection] ' + socket.id);
        rooms.splice(rooms.findIndex((item) => item.id == socket.id), 1);
        clients.splice(clients.findIndex((id) => id == socket.id), 1)
        server.emit('users', clients);
    });

    console.log('[connection] ' + socket.id);

    clients.push(socket.id)
    server.emit('users', clients);

    socket.on('offer', (offer) => {
        server.to(offer.to).emit('offer', offer)
    });

    socket.on('answer', (answer) => {
        console.log('[answer received]');
        server.to(answer.to).emit('answer', answer)
    });

    socket.on('ice', ice => {
        server.to(ice.to).emit('ice', ice)
    })
})

server.listen(9090, {
    path: '/',
    cors: {
        methods: ['GET', 'POST'],
        origin: '*'
    }
})
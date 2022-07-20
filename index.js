
const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
const remote_audio = document.getElementById('remote_audio');
const init = document.getElementById('action_init');
const users = document.getElementById('users');

let limit = 0
let ice_candidate;
let local_offer;

peer.addEventListener('datachannel', event => {

    const channel = event.channe
    console.log('[channel]')
    console.log(channel)
});

peer.addEventListener("icecandidate", event => {
    console.log()
    if (limit == 0) {
        limit = 1
        console.log('[ice candidate]')
        console.log(event.candidate)
        ice_candidate = event.candidate
    }
});

peer.addEventListener("track", track => {
    console.log('[track]')
    const [streams] = track.streams
    remote_audio.srcObject = streams;
});

peer.addEventListener('icecandidateerror', event => {
    console.error('[icecandidateerror]')
    console.error(event)
});

peer.addEventListener("signalingstatechange", state => {
    console.log('[state change]')
    console.log(state)
})

const dataChanel = peer.createDataChannel('data')

function getMedia() {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((media) => {
                resolve(media)
            }).catch((error) => {
                reject(error)
            })
    })
}

async function action_init() {
    const socket = io('http://172.16.3.100:9090', { transports: ['websocket'] })

    socket.on('connect', () => {
        console.log('\x1b[32mconnected\x1b')

    });

    socket.on('disconnect', () => {
        console.log('\x1b[31mdisconnected \x1b')
    });

    socket.on('offer', async ({ offer, from }) => {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(new RTCSessionDescription(answer));
        socket.emit('answer', { answer, to: from, from: socket.id });
    });

    socket.on('answer', async ({ answer, from }) => {
        await peer.setRemoteDescription(new RTCSessionDescription(answer))
        socket.emit('ice', { ice: ice_candidate, to: from, from: socket.id })
    });

    socket.on('ice', async ({ ice, from }) => {
        await peer.addIceCandidate(new RTCIceCandidate(ice))
        socket.emit('ice', { ice: ice_candidate, to: from, from: socket.id })
    })

    socket.on('users', connected_users => {
        users.innerHTML = null
        connected_users.forEach((socket_id) => {
            if (socket.id != socket_id) {
                const li = document.createElement('li')

                li.onclick = async () => {

                    local_offer = await peer.createOffer();
                    await peer.setLocalDescription(new RTCSessionDescription(local_offer))

                    console.log('[local_offer]')
                    console.log(local_offer)

                    socket.emit('offer', { offer: local_offer, from: socket.id, to: socket_id })
                }

                li.innerHTML = socket_id
                users.appendChild(li)
            }
        });
    })

    getMedia()
        .then(async media => {
            media.getTracks().forEach(track => {
                peer.addTrack(track, media);
            })
        }).catch(error => {
            console.error(error)
            alert('An error ocurred')
        });

}

init.addEventListener('click', () => {
    action_init()
    init.remove()
})
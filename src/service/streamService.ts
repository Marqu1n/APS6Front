import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const socket = io(API_URL)

socket.on('connect',()=>{
    console.log('conectou')
})
socket.on('mensagemRecebida', (data) => {
    console.log('Mensagem recebida do servidor:', data,new Date());
});

export const sendImage = async (ms:string) => {
    if(!socket.connected){
        socket.connect()
    }
    if(ms && ms.length > 10){
        socket.emit('liveFeed', ms);
    }
};
export const closeSocket = async()=>{
    if (socket.connected) {
        socket.disconnect();
        console.log('Conexão fechada');
    }
}
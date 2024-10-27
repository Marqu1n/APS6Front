import { io } from "socket.io-client";
import { EventEmitter } from "events";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const socket = io(API_URL)

socket.on('connect',()=>{
    console.log('conectou')
})
socket.on('imagemRetorno', (imgBytes:ArrayBuffer) => {
    imagemRetornoEventEmitter.emit('retorno',  `data:image/png;base64,${imgBytes}`)
});

export const imagemRetornoEventEmitter:EventEmitter = new EventEmitter(); 

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
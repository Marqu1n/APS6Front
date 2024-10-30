import { io } from "socket.io-client";
import { EventEmitter } from "events";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL)
let shouldBeConnected:boolean = true
export const imagemRetornoEventEmitter:EventEmitter = new EventEmitter(); 

socket.on('connect',()=>{
    shouldBeConnected = true
    console.log('conectou')
})
socket.on('disconnect', ()=>{
    if(!shouldBeConnected){
        socket.open()
    }
})
imagemRetornoEventEmitter.on('isConnected',()=>{
    if(!socket.connect){
        if(shouldBeConnected){
            socket.open()
        }
    }
    if(!shouldBeConnected){
        socket.disconnect()
    }
})
socket.on('imagemRetorno', (imgBytes:ArrayBuffer) => {
    imagemRetornoEventEmitter.emit('retorno',  `data:image/png;base64,${imgBytes}`)
});

export const sendImage = async (ms:string, prePos: string | null | undefined) => {
    if(!socket.connected && shouldBeConnected){
        socket.connect()
    }
    if(!shouldBeConnected){
        socket.disconnect()
    }
    if(ms && ms.length > 10){
        socket.emit('liveFeed', ms,prePos);
    }
};
export const closeSocket = async()=>{
    if (socket.connected) {
        shouldBeConnected = false
        socket.disconnect();
        console.log('Conexão fechada');
    }
}
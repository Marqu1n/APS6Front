import { io } from "socket.io-client";
import { Fetch, WebSocket, WebTransport } from "engine.io-client";
import { EventEmitter } from "events";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL,{transports:[Fetch,WebSocket],perMessageDeflate:{threshold:2048}})
export const imagemRetornoEventEmitter:EventEmitter = new EventEmitter(); 

socket.on('connect',()=>{
    console.log('conectou')
})
socket.on("connect_error", (error) => {
    if (socket.active) {
      // temporary failure, the socket will automatically try to reconnect
    } else {
      // the connection was denied by the server
      // in that case, `socket.connect()` must be manually called in order to reconnect
      console.log(error.message);
    }
  });
  socket.on("disconnect", (reason, details) => {
    console.log("ERRO",details,reason)
  });
socket.on('imagemRetorno', (imgBytes:ArrayBuffer) => {
    imagemRetornoEventEmitter.emit('retorno',  `data:image/png;base64,${imgBytes}`)
});

export const sendImage = async (ms:string, prePos: string | null | undefined) => {
    if(ms && ms.length > 10){
        socket.emit('liveFeed', ms,prePos);
    }
};
export const closeSocket = async()=>{
    if (socket.connected) {
        socket.disconnect();
        console.log('Conexão fechada');
    }
}
import React, { useEffect, useRef, useState } from "react";
import "./webcam.css";

function WebcamCapture() {
  setInterval(()=>{console.log(temVideo)},10000)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameras,setCameras] = useState<MediaDeviceInfo[]>([]);
  const [permitiuCameras,setPermitiuCameras] = useState(false);
  const [temVideo,changeTemVideo] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({video:true}).then((res)=>{
      setPermitiuCameras(true)
    }).catch((err)=>{
      window.alert("Por favor, permita que usemos os dispositivos")
    }
    )

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [videoRef]);

  useEffect(()=>{
    if (permitiuCameras){
      navigator.mediaDevices.enumerateDevices().then(
        res =>{
          setCameras(res.filter(d => d.kind=='videoinput'))
        }
      )
    }else{
      setCameras([])
      changeTemVideo(false)
    }
  },
  [permitiuCameras])

  const espelhaTela = () => {
    navigator.mediaDevices.getDisplayMedia({video:true})
    .then(res => {
      if(videoRef.current){
        changeTemVideo(true)
        videoRef.current.srcObject = res
      }
      res.getTracks().forEach(track => {
          track.onended = () => {
            if(videoRef.current){
              videoRef.current.srcObject = null; // Limpa o vídeo
            }
            track.stop()
            changeTemVideo(false)
          };
        });
    }).catch(err=>{
      changeTemVideo(false)
      window.alert("Erro ao compartilhar tela. Erro: "+err)
    }
    )
  }

  const solicitaPermissao = async () =>{
    try{
      await navigator.mediaDevices.getUserMedia({video:true})
      setPermitiuCameras(true)
    } catch(error){
      console.error("Erro ao solicitar permissão:", error);
    }
  }

  const selectDevice = (id:string)=> {
    if(id){
      setSelectedDevice(id)
      if(id == 'tela'){
        espelhaTela()
        return;
      }
      if (videoRef.current?.srcObject ?? false){
        const stream = videoRef.current?.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:id}}})
      .then(res=>{
        if(videoRef.current){
          changeTemVideo(true)
          videoRef.current.srcObject = res
        }
      }).catch(err=>{
        changeTemVideo(false)
        console.error(err)
      })
    }
  }

  const temPermissao = (event:React.MouseEvent<HTMLSelectElement>) => {
    if(!permitiuCameras){
      event.preventDefault();
      window.alert("Você tem que permitir o navegador a usar sua câmera!")
      solicitaPermissao()
    }
  }

  return (
    <div>
      <h2>Centro de Captura</h2>
      <div className="container-fluid d-flex flex-column align-items-center justify-content-center">
        <div className="mb-3">
          {!permitiuCameras ?
            <button className="btn btn-primary" 
            onClick={() => solicitaPermissao()} >
              Permitir acesso a dispositos</button> 
          :
            <select value={selectedDevice} 
            className="form-select"
            style={{maxWidth:'20rem'}}
            onChange={(e)=>selectDevice(e.target.value)}>
              {
                <option value='' disabled> Selecione o dispositivo</option>
              }
              {
                cameras.map((item) => (
                  <option key={item.deviceId} value={item.deviceId}>{item.label || 'Sem Rótulo'}</option>
                ))
              }
              {
                <option value="tela" onSelect={(e)=>espelhaTela() }>Espelhar Tela</option>
              }
            </select>
          }
        </div>
        {/* temVideo
        ? */
        <div>
          <div className="embed-responsive embed-responsive-16by9">
            <video
              ref={videoRef}
              className="w-75 border rounded mx-auto"
              autoPlay
              playsInline
            />
          </div>
        </div>
        /* :
        <p className="text text-center">Nada pra mostrar :P</p> */
        }
      </div>
    </div>
  );
}

export default WebcamCapture;

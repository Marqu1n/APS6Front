import React, { useEffect, useRef, useState } from "react";
import styles from "./LiveFeed.module.css";
import { useLocation } from "react-router-dom";

function LiveFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const location = useLocation()
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[] | null>([]);
  const streamRef = useRef<MediaStream | null>(null)
  const [temVideo, changeTemVideo] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(()=>{
    const fetchCameras= async ()=>{
      const devices = await navigator.mediaDevices.enumerateDevices();
      if(devices){
        if(devices.every(x=>x.label==='')){
          return
        }
        setCameras(devices.filter(d => d.kind === 'videoinput'));
      } else {
        setCameras([]);
        changeTemVideo(false);
      }
    }
    fetchCameras();
    return () =>{
      stopStream()
    }
  },[])

  useEffect(()=>{
    return ()=>{
      stopStream()
    }
  },[location.pathname])

  useEffect(()=>{
    stream?.getTracks().forEach(t=>t.stop())
    const mostraWebcam = async () => {
      if(!selectedDevice){
        return
      }
      if(selectedDevice === 'tela'){
        navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(res => {
          setStream(res);
          videoRef.current!.srcObject = res;
          changeTemVideo(true);
          res.getTracks().forEach(track => {
            track.onended = function(){
              if(videoRef.current){
                videoRef.current.srcObject = null;
              }
              this.stop()
              changeTemVideo(false);
            };
          });
        })
        .catch(err => {
          changeTemVideo(false);
          window.alert("Erro ao compartilhar tela: " + err);
        });
        return
      }
      await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:selectedDevice}}}).then((res)=>{
        if(videoRef.current){
          setStream(res)
          videoRef.current.srcObject = res
          res.getTracks().forEach(t=>{
            t.onended = function(){
              if(videoRef.current){
                videoRef.current.srcObject = null
                this.stop()
                changeTemVideo(false)
              }
            }
          })
          changeTemVideo(true)
        }
      })
    }
    mostraWebcam()
  },[selectedDevice])

  const startStream = async () =>{
    const streamTemp = await navigator.mediaDevices?.getUserMedia({video:{facingMode:{ideal:'environment'}}})
    setStream(streamTemp)
    streamRef.current = streamTemp
  }
  const stopStream = () =>{
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameras(null)
    }
  }

  return (
    <div>
      <div className="py-4 container-fluid border border-dark rounded d-flex flex-column align-items-center justify-content-center">
        <div className="mb-3">
          {cameras && cameras.length>0?(<select
            value={selectedDevice}
            className="form-select shadow"
            style={{ maxWidth: '20rem' }}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            <option value='' disabled>Selecione o dispositivo</option>
            {cameras.map((item) => (
              <option key={item.deviceId} value={item.deviceId}>{item.label || 'Sem Rótulo'}</option>
            ))}
            <option value="tela">Espelhar Tela</option>
          </select>)
          : 
          <button className="btn btn-primary" onClick={()=>startStream()}>Permitir Dispositivos</button>
          }
          
        </div>
        <div>
          <div hidden={!temVideo} className="embed-responsive embed-responsive-16by9">
            <video
              ref={videoRef}
              className="w-75 border rounded mx-auto embed-responsive-item"
              autoPlay
              playsInline
            />
          </div>
        </div>
        <p hidden={temVideo} className="text text-center">Nada pra mostrar :P</p>
      </div>
    </div>
  );
}

export default LiveFeed;

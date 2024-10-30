import React, { Component, createRef, RefObject } from "react";
import { useLocation, Location } from "react-router-dom"; // Importando Location do react-router-dom
import {closeSocket, sendImage,imagemRetornoEventEmitter} from "../../service/streamService"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

interface LiveFeedState {
  stream: MediaStream | null;
  cameras: MediaDeviceInfo[];
  temVideo: boolean;
  selectedDevice: string;
  imagemBytesRetorno: string,
  selectedPrePos:string,
  track:null | MediaStreamTrack
}

interface LiveFeedProps {
  location: Location;
}

class LiveFeed extends Component<LiveFeedProps, LiveFeedState> {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  canvasRefRet:RefObject<HTMLCanvasElement>;
  preProcessamento: RefObject<HTMLSelectElement>;
  streamRef: MediaStream | null;
  sendImageInterval: any;
  isConnectedInterval: any;
  hasMounted: boolean = false
  videoWidth:number|undefined
  videoHeight:number|undefined
  constructor(props: LiveFeedProps) {
    super(props);
    this.videoRef = createRef<HTMLVideoElement>();
    this.canvasRef = createRef<HTMLCanvasElement>();
    this.canvasRefRet = createRef<HTMLCanvasElement>();
    this.preProcessamento = createRef<HTMLSelectElement>()
    this.state = {
      stream: null,
      cameras: [],
      temVideo: false,
      selectedDevice: '',
      imagemBytesRetorno: '',
      selectedPrePos:'normal',
      track:null
    };
    this.streamRef = null;

  }

  async componentDidMount() {
    if(!this.hasMounted){
      this.hasMounted = true
      await this.startStream();
      await this.fetchCameras();
      imagemRetornoEventEmitter.on('retorno', (retorno:string)=>{
        this.setState({imagemBytesRetorno:retorno},()=>{this.desenharImagem()})
      })
      this.isConnectedInterval = setInterval(() => {
        imagemRetornoEventEmitter.emit('isConnected')
      }, 5000);
    }
  }

  componentDidUpdate(prevProps: LiveFeedProps) {
console.log(process.env.REACT_APP_API_URL)

    // Verifica se o pathname mudou para parar o stream
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.stopStream();
    }
    //this.mostraWebcam() 
  }
  componentWillUnmount(): void {
      this.stopStream()
      imagemRetornoEventEmitter.off('retorno',()=>{})
      clearInterval(this.isConnectedInterval)
  }

  desenharImagem = () => {
    const { imagemBytesRetorno,selectedPrePos } = this.state;
    const canvas = this.canvasRefRet.current;
    if(canvas){
      const ctx = canvas.getContext('2d');
      if(ctx){
        const img = new Image();
        img.src = imagemBytesRetorno; // Use a string base64 da imagem
        if(selectedPrePos.includes("1024")){
          canvas.width = 1024
          canvas.height = 1024
        }else if(selectedPrePos.includes("640")){
          canvas.width = 640
          canvas.height = 640
        } else {
          canvas.width = this.videoWidth ?? 1024
          canvas.height = this.videoHeight ?? 1024
        }
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0,canvas.width, canvas.height); // Desenhe a imagem
        };
      }
    }
  };

  async fetchCameras() {
    //this.stopStream()
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (devices) {
      if (devices.every(x => x.label === '')) {
        return;
      }
      this.setState({ cameras: devices.filter(d => d.kind === 'videoinput') },()=>{
      this.setState({selectedDevice:this.state.cameras[0].deviceId},()=>{this.mostraWebcam()})
      });
      
    } else {
      this.setState({ cameras: [], temVideo: false });
    }
  }

  setaOnEnded(){
    const {track} = this.state
    if(track){
      track.onended = () => {
        if (this.videoRef.current) {
          this.videoRef.current.srcObject = null;
        }
        track.stop()
        this.setState({ temVideo: false });
      };
    }
  }

  async mostraWebcam() {
    const { selectedDevice } = this.state;

    if (!selectedDevice) {
      return;
    }
    //this.stopStream()
    if (selectedDevice === 'tela') {
      try {
        const res = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.setStream(res);
        res.getTracks().forEach(track => {
          this.setState({track:track}, ()=>{this.setaOnEnded()})
          
        });
      this.setState({ temVideo: true })

      } catch (err) {
        this.setState({ temVideo: false });
        window.alert("Erro ao compartilhar tela: " + err);
      }
      return;
    }

    try {
      const res = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: selectedDevice } } });
      this.setStream(res);
      res.getTracks().forEach(track => {
        this.setState({track:track},()=>{this.setaOnEnded()})
      });
      this.setState({ temVideo: true });
    } catch (err) {
      this.setState({ temVideo: false });
      console.error(err);
    }
  }

  setStream(stream: MediaStream) {
    if (this.videoRef.current) {
      this.videoRef.current.srcObject = stream;
      this.streamRef = stream;
      this.videoRef.current?.addEventListener('loadedmetadata',()=>{
        if(this.videoRef.current){
          this.videoHeight = this.videoRef.current.videoHeight
          this.videoWidth = this.videoRef.current.videoWidth
          if(!this.sendImageInterval){
            this.sendImageInterval = setInterval(async ()=>{
              await this.captureFrame();
            },1000)
          }
        }
      })
    }
  }
  

  async captureFrame(){
    const canvas = this.canvasRef.current;
    const video = this.videoRef.current;

    if (canvas && video) {
        const context = canvas.getContext('2d');
/*         if(this.state.selectedPrePos.includes("1024")){
          // Set canvas dimensions equal to video dimensions
          this.videoWidth= 1024;
          this.videoHeight = 1024;
          canvas.width= 1024
          canvas.height= 1024
        }else if(this.state.selectedPrePos.includes("640")){
          this.videoWidth= 640;
          this.videoHeight = 640;
          canvas.width= 640
          canvas.height= 640
        }else{ */
          this.videoWidth = this.videoRef.current?.videoWidth
          this.videoHeight = this.videoRef.current?.videoHeight
          canvas.width = this.videoWidth ?? 1024
          canvas.height = this.videoHeight ?? 1024
       /*  } */
/*         canvas.width = this.videoWidth
        canvas.height = this.videoHeight */

        // Draw the current video frame to the canvas
        context?.drawImage(video, 0, 0);

        // Get the image data as a data URL (base64)
        const imageData = canvas.toDataURL('image/png');
        await sendImage(imageData, this.preProcessamento.current?.value)
    }
  }


  startStream = async () => {
    try{
      console.log("chamou")
      const streamTemp = await navigator.mediaDevices.getUserMedia({ video: true });
      if(this.state.cameras.length <= 0){
        this.fetchCameras()
      }
      this.setStream(streamTemp);
    }catch(Ex){
      window.alert("Por favor, permita o acesso a câmera")
      console.error(Ex)
    }
  };

  stopStream = () => {
    const { stream, track } = this.state;
    if (stream) {
      track?.dispatchEvent(new Event("ended"))
      track?.stop()
      stream.getTracks().forEach((track) => track.stop());
      this.streamRef?.getTracks().forEach((track) => track.stop());
      this.streamRef = null
      this.setState({ stream: null, temVideo: false });
    }
    clearInterval(this.sendImageInterval)
    closeSocket()
  };

  render() {
    const { cameras, selectedDevice, temVideo } = this.state;

    return (
      <main>
        <div className="py-4 container-fluid border border-dark
         rounded d-flex flex-column align-items-center justify-content-center">
          {cameras.length > 0 ? (
          <div className="container-fluid align-items-center justify-content-center d-flex mb-3">
            <div className="mx-2">
              <button className="btn btn-primary" disabled={this.state.temVideo} onClick={()=>{this.mostraWebcam()}}>
                <FontAwesomeIcon icon={faRefresh} className="text-white"></FontAwesomeIcon>
              </button>
            </div>
            <div className="mx-2">
                <select
                  value={selectedDevice}
                  className="form-select shadow"
                  style={{ maxWidth: '20rem' }}
                  /* #onClick={}} */
                  onChange={(e) => this.setState(()=>({selectedDevice:e.target.value}),()=>{this.state.track?.dispatchEvent(new Event("ended"));this.mostraWebcam()})}
                >
                  <option value='' disabled>Selecione o dispositivo</option>
                  {cameras.map((item) => (
                    <option key={item.deviceId} 
                    onBlur={(e) => {this.mostraWebcam()}}
                    value={item.deviceId}
                    selected={item.deviceId === this.state.selectedDevice}>
                      {item.label || 'Sem Rótulo'}
                    </option>
                  ))}
                  <option value="tela" /* onFocus={()=>{this.mostraWebcam()}} */>Espelhar Tela</option>
                </select>
            </div>
            <div className="mx-2">
              <select
                  ref={this.preProcessamento}
                  value={this.preProcessamento.current?.value}
                  className="form-select shadow"
                  style={{ maxWidth: '20rem' }}
                  onChange={(e)=>(this.setState({selectedPrePos:e.target.value}))}
                >
                  <option value="normal">Normal</option>
                  <option value="Canny-Bilateral-1024">Canny-Bilateral-1024</option>
                  <option value="Canny-Bilateral-640">Canny-Bilateral-640</option>
                  <option value="Sobel-Bilateral-1024">Sobel-Bilateral-1024</option>
                  <option value="Sobel-Bilateral-640">Sobel-Bilateral-640</option>
                  <option value="Laplace-Bilateral-1024">Laplace-Bilateral-640</option>
                  <option value="Laplace-Bilateral-640">Laplace-Bilateral-640</option>
{/*                   <option value="bilateral">Bilateral</option>
                  <option value="cinza">Cinza</option>
                  <option value="clahe">Clahe</option> */}
                </select>
            </div>
          </div>
          ) : (
            <button className="btn btn-primary" onBlur={(e) => {}}>Permitir Dispositivos</button>
          )}
          <div className="flex-row" style={{display:`${temVideo?'hidden':'flex'}`}} hidden={!temVideo}>
            <div className="embed-responsive embed-responsive-16by9 mx-auto d-flex justify-content-center align-items-middle">
              <video
                ref={this.videoRef}
                className="w-50 border rounded mx-auto embed-responsive-item"
                //style={{maxWidth:"1vw"}}
                autoPlay
                playsInline
              />
            </div>
            <canvas ref={this.canvasRef} style={{ display: 'none' }} />
            <div className="embed-responsive embed-responsive-16by9 mx-auto d-flex justify-content-center align-items-middle">
              <canvas ref={this.canvasRefRet} 
              className="w-75 border rounded mx-auto embed-responsive-item"
              width={this.videoWidth ?? 0 }
              height={this.videoHeight ?? 0}/>
            </div>
          </div>
          <p hidden={temVideo} className="text text-center">Nada pra mostrar :P</p>
        </div>
      </main>
    );
  }
}

// Componente funcional que envolve o LiveFeed e passa a location
const LiveFeedWithRouter = (props: Omit<LiveFeedProps, 'location'>) => {
  const location = useLocation();
  return <LiveFeed {...props} location={location} />;
};

export default LiveFeedWithRouter;

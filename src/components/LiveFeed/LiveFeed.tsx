import React, { Component, createRef, RefObject } from "react";
import { useLocation, Location } from "react-router-dom"; // Importando Location do react-router-dom
import {closeSocket, sendImage} from "../../service/streamService"
interface LiveFeedState {
  stream: MediaStream | null;
  cameras: MediaDeviceInfo[];
  temVideo: boolean;
  selectedDevice: string;
}

interface LiveFeedProps {
  location: Location;
}

class LiveFeed extends Component<LiveFeedProps, LiveFeedState> {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  streamRef: MediaStream | null;
  sendImageInterval: any;
  hasMounted: boolean = false
  constructor(props: LiveFeedProps) {
    super(props);
    this.videoRef = createRef<HTMLVideoElement>();
    this.canvasRef = createRef<HTMLCanvasElement>();
    this.state = {
      stream: null,
      cameras: [],
      temVideo: false,
      selectedDevice: ''
    };
    this.streamRef = null;

  }

  async componentDidMount() {
    if(!this.hasMounted){
      this.hasMounted = true
      await this.fetchCameras();
      await this.startStream();
    }
  }

  componentDidUpdate(prevProps: LiveFeedProps) {
    // Verifica se o pathname mudou para parar o stream
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.stopStream();
    }
    //this.mostraWebcam() 
  }
  componentWillUnmount(): void {
      this.stopStream()
  }

  async fetchCameras() {
    //this.stopStream()
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (devices) {
      if (devices.every(x => x.label === '')) {
        return;
      }
      this.setState({ cameras: devices.filter(d => d.kind === 'videoinput') });
    } else {
      this.setState({ cameras: [], temVideo: false });
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
          track.onended = () => {
            if (this.videoRef.current) {
              this.videoRef.current.srcObject = null;
            }
            this.setState({ temVideo: false });
          };
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
        track.onended = () => {
          if (this.videoRef.current) {
            this.videoRef.current.srcObject = null;
          }
          this.setState({ temVideo: false });
        };
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
        if(!this.sendImageInterval){
          this.sendImageInterval = setInterval(async ()=>{
            await this.captureFrame();
          },5000)
        }
      })
    }
  }

  async captureFrame(){
    const canvas = this.canvasRef.current;
    const video = this.videoRef.current;

    if (canvas && video) {
        const context = canvas.getContext('2d');
        // Set canvas dimensions equal to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame to the canvas
        context?.drawImage(video, 0, 0);

        // Get the image data as a data URL (base64)
        const imageData = canvas.toDataURL('image/png');
        await sendImage(imageData)
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
    const { stream } = this.state;
    if (stream) {
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
      <div>
        <div className="py-4 container-fluid border border-dark
         rounded d-flex flex-column align-items-center justify-content-center">
          <div className="mb-3">
            {cameras.length > 0 ? (
              <select
                value={selectedDevice}
                className="form-select shadow"
                style={{ maxWidth: '20rem' }}
                onChange={(e) => this.setState(()=>({selectedDevice:e.target.value}),() => {this.mostraWebcam()})}
              >
                <option value='' disabled>Selecione o dispositivo</option>
                {cameras.map((item) => (
                  <option key={item.deviceId} value={item.deviceId}>{item.label || 'Sem Rótulo'}</option>
                ))}
                <option value="tela">Espelhar Tela</option>
              </select>
            ) : (
              <button className="btn btn-primary" onClick={() => {this.startStream()}}>Permitir Dispositivos</button>
            )}
          </div>
          <div hidden={!temVideo}>
            <div className="embed-responsive embed-responsive-16by9 mx-auto d-flex justify-content-center align-items-middle">
              <video
                ref={this.videoRef}
                className="w-75 border rounded mx-auto embed-responsive-item"
                autoPlay
                playsInline
              />
              <canvas ref={this.canvasRef} style={{ display: 'none' }} />
            </div>
          </div>
          <p hidden={temVideo} className="text text-center">Nada pra mostrar :P</p>
        </div>
      </div>
    );
  }
}

// Componente funcional que envolve o LiveFeed e passa a location
const LiveFeedWithRouter = (props: Omit<LiveFeedProps, 'location'>) => {
  const location = useLocation();
  return <LiveFeed {...props} location={location} />;
};

export default LiveFeedWithRouter;

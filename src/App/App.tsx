//import logo from "./logo.svg";
import "./App.css";
import LiveFeed from "../components/LiveFeed/LiveFeed";
import NavBar from "../components/NavBar/NavBar";
import { BrowserRouter as Router,Routes,Route } from "react-router-dom";
import FileUpload from "../components/FileUpload/FileUpload";

const App: React.FC = () => {
  return (
    <Router>
      <div>
      <NavBar/>
        <Routes>
          <Route path="/" element={<LiveFeed/>}/>
          <Route path="/upload" element={<FileUpload/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;

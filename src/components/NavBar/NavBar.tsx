import React, { FC } from 'react';
import styles from './NavBar.module.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faUpload } from '@fortawesome/free-solid-svg-icons';

interface NavBarProps {}

const NavBar: FC<NavBarProps> = () => (
  <nav className="navbar navbar-light shadow my-3 bg-light
   border rounded mx-3 d-flex justify-content-start"
  style={{fontSize:'1.5rem',height:'4rem'}}>
    <div className='rounded bg-primary py-0 mx-4 h-100 align-middle'>
      <Link to="/" className='text-decoration-none text-center align-middle px-4 py-2' >
        <FontAwesomeIcon icon={faHouse} className='text-white'></FontAwesomeIcon>
      </Link>
    </div>
    <div className='rounded bg-primary py-0 mx-4 h-100 align-middle'>
      <Link to="/upload" className='text-decoration-none text-center align-middle px-4 py-2'>
      <FontAwesomeIcon icon={faUpload}className='text-white'></FontAwesomeIcon>
      </Link>
    </div>
  </nav>
);

export default NavBar;

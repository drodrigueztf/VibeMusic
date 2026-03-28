import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Player from './Player';

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-area">
        <div className="app-content">
          <Outlet />
        </div>
      </div>
      <Player />
    </div>
  );
};

export default Layout;

import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { IoCompass, IoHomeSharp, IoCloudUpload, IoHeart, IoLibrary, IoPerson, IoLinkOutline, IoLogOutOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copiedInvite, setCopiedInvite] = useState(false);

  const inviteLink = user ? `${window.location.origin}/register?invite=${user._id}` : '';

  const handleCopyInvite = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 1800);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎵</div>
        <h1>VibeMusic</h1>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <IoHomeSharp /> Home
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <IoCompass /> Explore
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <IoLibrary /> Your Library
        </NavLink>
        {user && (
          <>
            <NavLink to="/upload" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <IoCloudUpload /> Upload
            </NavLink>
            <NavLink to="/favorites" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <IoHeart /> Favorites
            </NavLink>
            <NavLink to={`/profile/${user._id}`} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <IoPerson /> My Profile
            </NavLink>
            <div className="sidebar-invite-card">
              <div className="sidebar-invite-header">
                <IoLinkOutline />
                <span>Invitacion</span>
              </div>
              <div className="sidebar-invite-link" title={inviteLink}>
                {inviteLink}
              </div>
              <button type="button" className="sidebar-invite-btn" onClick={handleCopyInvite}>
                {copiedInvite ? 'Copiado' : 'Copiar link'}
              </button>
            </div>
          </>
        )}
      </nav>

      {user && (
        <>
          <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
            <IoLogOutOutline /> Log Out
          </button>
        </>
      )}
    </aside>
  );
};

export default Sidebar;

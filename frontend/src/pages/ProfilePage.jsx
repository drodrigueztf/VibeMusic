import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PlaylistCard from '../components/PlaylistCard';
import { IoPersonAdd, IoPersonRemove, IoMusicalNotes } from 'react-icons/io5';
import { getEntityProfileId } from '../utils/profile';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const profileId = id || currentUser?._id || '';

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      setError('User not found');
      return;
    }

    const fetchProfile = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await usersAPI.getProfile(profileId);
        setUser(res.data);
        
        if (currentUser && res.data.followers) {
          setIsFollowing(res.data.followers.includes(currentUser._id));
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, currentUser]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await usersAPI.unfollow(profileId);
        setIsFollowing(false);
        setUser(prev => ({ 
          ...prev, 
          followersCount: prev.followersCount - 1,
          followers: prev.followers.filter(fid => fid !== currentUser._id)
        }));
      } else {
        await usersAPI.follow(profileId);
        setIsFollowing(true);
        setUser(prev => ({ 
          ...prev, 
          followersCount: prev.followersCount + 1,
          followers: [...(prev.followers || []), currentUser._id]
        }));
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

  if (!id && currentUser?._id) {
    return <Navigate to={`/profile/${currentUser._id}`} replace />;
  }

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!user) return <div className="error-container">User not found</div>;

  const viewedUserId = getEntityProfileId(user);

  return (
    <div className="page-container profile-page">
      <header className="profile-header">
        <div className="profile-avatar-large">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">{user.username[0].toUpperCase()}</div>
          )}
        </div>
        <div className="profile-info">
          <span className="profile-label">Profile</span>
          <h1 className="profile-username">{user.username}</h1>
          <div className="profile-stats">
            <span><strong>{user.playlists?.length || 0}</strong> Public Playlists</span>
            <span><strong>{user.followersCount || 0}</strong> Followers</span>
            <span><strong>{user.followingCount || 0}</strong> Following</span>
          </div>
          
          {currentUser && currentUser._id !== viewedUserId && (
            <button 
              className={`follow-btn ${isFollowing ? 'unfollow' : ''}`}
              onClick={handleFollow}
            >
              {isFollowing ? <><IoPersonRemove /> Unfollow</> : <><IoPersonAdd /> Follow</>}
            </button>
          )}
        </div>
      </header>

      <section className="profile-content">
        <div className="section-header">
          <h2 className="section-title">Public Playlists</h2>
        </div>
        
        {user.playlists && user.playlists.length > 0 ? (
          <div className="cards-grid">
            {user.playlists.map(playlist => (
              <PlaylistCard key={playlist._id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <IoMusicalNotes />
            <p>This user hasn't created any public playlists yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;

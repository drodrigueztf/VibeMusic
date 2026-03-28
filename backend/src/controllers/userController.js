const { db, admin } = require('../config/db');

const serializeDoc = (doc) => ({ _id: doc.id, ...doc.data() });

const getUserProfile = async (req, res) => {
  try {
    const userRef = db().collection('users').doc(req.params.id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = doc.data();
    delete userData.password;

    const playlistsSnapshot = await db().collection('playlists')
      .where('createdBy._id', '==', req.params.id)
      .where('isPublic', '==', true)
      .get();
    
    const playlists = playlistsSnapshot.docs.map(serializeDoc);

    res.json({
      _id: doc.id,
      ...userData,
      playlists,
      followersCount: userData.followers ? userData.followers.length : 0,
      followingCount: userData.following ? userData.following.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUserRef = db().collection('users').doc(targetUserId);
    const currentUserRef = db().collection('users').doc(currentUserId);

    const [targetDoc, currentDoc] = await Promise.all([
      targetUserRef.get(),
      currentUserRef.get()
    ]);

    if (!targetDoc.exists) {
      return res.status(404).json({ message: 'User to follow not found' });
    }

    const targetData = targetDoc.data();
    const currentData = currentDoc.data();

    const targetFollowers = targetData.followers || [];
    const currentFollowing = currentData.following || [];

    if (currentFollowing.includes(targetUserId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    await Promise.all([
      targetUserRef.update({
        followers: admin.firestore.FieldValue.arrayUnion(currentUserId)
      }),
      currentUserRef.update({
        following: admin.firestore.FieldValue.arrayUnion(targetUserId)
      })
    ]);

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const targetUserRef = db().collection('users').doc(targetUserId);
    const currentUserRef = db().collection('users').doc(currentUserId);

    await Promise.all([
      targetUserRef.update({
        followers: admin.firestore.FieldValue.arrayRemove(currentUserId)
      }),
      currentUserRef.update({
        following: admin.firestore.FieldValue.arrayRemove(targetUserId)
      })
    ]);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  followUser,
  unfollowUser
};

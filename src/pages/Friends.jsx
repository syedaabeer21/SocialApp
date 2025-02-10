import { useState, useEffect } from "react";
import { auth, db } from "../config/firebase/firebaseConfig";
import { collection, getDocs, query, where,updateDoc,addDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";

function Friends() {
  const [user, setUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends,setFriends] = useState([])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        console.log("Current user:", currentUser);  // Log the user details
        setUser({
          name: currentUser.displayName,
          email: currentUser.email,
          photo: currentUser.photoURL,
          uid: currentUser.uid,
        });
        fetchFriendRequests(currentUser.uid); // Fetch friend requests
      } else {
        setUser(null);
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  const fetchFriendRequests = async (uid) => {
    try {
      const friendRequestsQuery = query(
        collection(db, "friend_requests"),
        where("receiverId", "==", uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(friendRequestsQuery);
      const requests = querySnapshot.docs.map((doc) => ({
         id: doc.id, // ✅ Firestore document ID include kiya
                ...doc.data(),
              }));
      setFriendRequests(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };
  const handleAcceptRequest = async (requestId, senderId, senderName) => {
    console.log('Request ID:', requestId);
    console.log('Sender ID:', senderId);
    console.log(senderName)

    if (!user) return;
    if (!senderName) {
      console.error("sender name is missing");
      return;
    }
    if (!user.name) {
      console.error("user name is missing");
      return;
    }

    try {
      const requestRef = doc(db, "friend_requests", requestId);
      await updateDoc(requestRef, { status: "accepted" });

      // Friend collection mein dono users ko add karna
      console.log(user.uid)
      console.log(senderId)
      const friendPair = [
        { userId1: user.uid, userId2: senderId, friendName: senderName, status: "accepted" },
        { userId1: senderId, userId2: user.uid, friendName: user.name, status: "accepted" },
      ];

      await Promise.all(friendPair.map((pair) => {
        return addDoc(collection(db, "friends"), pair);
      }));

      // UI se remove karna
      setFriendRequests((prevRequests) => prevRequests.filter(request => request.id !== requestId));

      console.log("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
  
      try {
        const friendsQuery = query(
          collection(db, "friends"),
          where("userId1", "==", user.uid),
          where("status", "==", "accepted")
        );
  
        const querySnapshot = await getDocs(friendsQuery);
        const fetchedRequests = querySnapshot.docs.map(doc => ({
            id: doc.id, // Include the document id here
            ...doc.data(), // Spread the rest of the document fields
          }));
        
          setFriends(fetchedRequests);
          
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
  
    fetchFriends();
  }, [user]);
    
  return (
    <div className="container mx-auto p-6">
  {user ? (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Friend Requests</h2>
      <ul className="space-y-4">
        {friendRequests.length > 0 ? (
          friendRequests.map((request, index) => (
            <li key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-md hover:bg-gray-100 transition-all">
              <p className="text-lg font-medium text-gray-700">{request.senderName}</p>
              <div className="space-x-2">
                <button
                  onClick={() => handleAcceptRequest(request.id, request.senderId)}
                  className="btn btn-sm bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Accept
                </button>
                <button
                  className="btn btn-sm bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Decline
                </button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-lg text-gray-600">No pending friend requests</p>
        )}
      </ul>
    </div>
  ) : (
    <p className="text-lg text-gray-600">Please log in to view friend requests</p>
  )}

  <div className="mt-8">
    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Friends</h2>
    <ul className="space-y-4">
      {friends.length > 0 ? (
        friends.map((friend, index) => (
          <li key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-md hover:bg-gray-100 transition-all">
            <p className="text-lg font-medium text-gray-700">
              {friend.userId1 === user.uid ? friend.userId2 : friend.userId1}
            </p>
          </li>
        ))
      ) : (
        <p className="text-lg text-gray-600">No friends yet!</p>
      )}
    </ul>
  </div>
</div>

  );
}

export default Friends;

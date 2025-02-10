import { useState, useEffect, useRef } from "react";
import { auth, db } from "../config/firebase/firebaseConfig.js";
import Login from "./Login.jsx";
import { signOut } from "firebase/auth";
import { addDoc, collection, getDocs, orderBy, query, where,serverTimestamp } from "firebase/firestore";
import { FaRegThumbsUp, FaCommentDots } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function App() {
  const [user, setUser] = useState(null);
  const [postContent, setPostContent] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const navigate = useNavigate()
  const userRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const newUser = {
          name: currentUser.displayName,
          email: currentUser.email,
          photo: currentUser.photoURL,
          uid: currentUser.uid,
        };
        setUser(newUser);
        userRef.current = newUser; // ✅ Update ref with latest user
      } else {
        setUser(null);
        userRef.current = null;
      }
      setLoading(false); // ✅ Ensure loading stops
    });
  
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    if (loading) return; // ✅ Jab tak user load nahi hota, function exit ho jaye
    
    if (user?.uid) {
      console.log("User data in useEffect:", user);
      fetchPosts();
    }
  }, [user, loading]);
  const fetchPosts = async () => {
    try {
      const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(postsQuery);
      
      const fetchedPosts = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const postData = { id: doc.id, ...doc.data() };
          
          const userQuery = query(collection(db, "users"), where("uid", "==", postData.userId));
          const userDoc = await getDocs(userQuery);
          const userData = userDoc.docs.length ? userDoc.docs[0].data() : null;
          
          return {
            ...postData,
            userName: userData ? userData.name : "Unknown",
            userPhoto: userData ? userData.photoURL : "",
          };
        })
      );
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handlePostSubmit = async () => {
    if (!userRef.current?.uid) {  // ✅ Use ref instead of state
      console.error("User is not logged in or UID is missing");
      return;
    }
    
    try {
      await addDoc(collection(db, "posts"), {
        content: postContent,
        imageUrl: imageUrl || "",  // Ensure it's never undefined
        userId: userRef.current.uid,    // Use `user` state instead of `auth.currentUser`
        createdAt: new Date(),
      });
  
      setPostContent("");
      setImageUrl(null);
      fetchPosts(); // Fetch posts after adding
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };
  

  const handleImageUpload = () => {
    const cloudinaryWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dppg93kty",
        uploadPreset: "abeer1234",
        sources: ["local", "url", "camera", "facebook", "dropbox"],
        cropping: true,
        multiple: false,
        theme: "minimal",
      },
      (error, result) => {
        if (result && result.event === "success") {
          setImageUrl(result.info.secure_url);
        } else if (error) {
          console.error("Cloudinary Upload Error:", error);
        }
      }
    );
    cloudinaryWidget.open();
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!user) return;
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        const usersData = querySnapshot.docs
          .map((doc) => ({id: doc.id,...doc.data(),}))
          .filter((u) => u.uid !== userRef.current.uid);
        setUsersList(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [user]);

  const sendFriendRequest = async (receiverId) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }
    console.log(user)
    try {
      // Check if request already exists
      const requestQuery = query(
        collection(db, "friend_requests"),
        where("senderId", "==", user.uid),
        where("senderName", "==", user.name ),
        where("receiverId", "==", receiverId),
        where("status", "==", "pending") // Check only pending requests
      );
  
      const existingRequest = await getDocs(requestQuery);
  
      if (!existingRequest.empty) {
        console.warn("Friend request already sent!");
        return;
      }
  
      // Send new request
      await addDoc(collection(db, "friend_requests"), {
        senderId: user.uid,
        receiverId: receiverId,
        senderName:user.name,
        status: "pending",
        timestamp: serverTimestamp(),
      });
  
      console.log("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };
  const friendsPage = () =>{
    navigate('/friends')
  }

  return (
    <div className="container mx-auto p-6">
    {loading ? (
      <div className="flex justify-center items-center text-lg font-semibold text-blue-500">Loading...</div>
    ) : user ? (
      <>
        <div className="navbar bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 shadow-lg rounded-lg">
          <div className="flex-1">
            <a className="text-white text-2xl font-bold">Social App</a>
          </div>
          <div className="flex-none gap-4 flex items-center">
            <p className="text-white text-lg">{user.name}</p>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <img alt="Profile" src={user.photo} className="w-12 h-12 rounded-full border-2 border-white" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content bg-white text-gray-700 rounded-box z-10 mt-3 w-52 p-3 shadow-lg">
                <li><a className="hover:bg-gray-100">Profile</a></li>
                <li onClick={friendsPage}><a className="hover:bg-gray-100">Friends</a></li>
                <li onClick={() => signOut(auth)}><a className="hover:bg-gray-100">Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
  
        <div className="flex mt-6">
          {/* Left Sidebar */}
          <div className="w-1/4 p-6 bg-white rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Users</h2>
            <ul>
              {usersList.map((u) => (
                <li key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-3 shadow-md hover:bg-gray-100 transition-all">
                  <p className="text-lg text-gray-700">{u.name}</p>
                  <button 
                    className="btn btn-sm bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => sendFriendRequest(u.uid)}
                  >
                    Send Request
                  </button>
                </li>
              ))}
            </ul>
          </div>
  
          {/* Right Main Content */}
          <div className="w-3/4 p-6 bg-white rounded-lg shadow-xl">
            <textarea 
              className="textarea textarea-bordered w-full mb-6 p-4 text-lg text-gray-700 placeholder-gray-500 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
              placeholder="What's on your mind?" 
              value={postContent} 
              onChange={(e) => setPostContent(e.target.value)} 
            />
            <div className="flex gap-4 items-center mb-6">
              <button 
                className="btn bg-blue-500 text-white hover:bg-blue-600 w-auto"
                onClick={handleImageUpload}
              >
                Upload Image
              </button>
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="w-36 h-36 object-cover" />
              )}
            </div>
            <button 
              className="btn bg-blue-500 text-white hover:bg-blue-600 w-full py-3"
              onClick={handlePostSubmit}
            >
              Post
            </button>
  
            {/* Post Feed */}
            <div className="mt-8 space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center mb-4">
                    <img className="w-12 h-12 rounded-full border-2 border-indigo-500" src={post.userPhoto} alt="User" />
                    <div className="ml-4">
                      <p className="font-semibold text-lg text-gray-800">{post.userName}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-lg">{post.content}</p>
                  {post.imageUrl && (
                    <img src={post.imageUrl} className="mt-4 w-full max-w-xs mx-auto rounded-lg shadow-md" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    ) : (
      <Login setUser={setUser} />
    )}
  </div>
  
  );
}
export default App;

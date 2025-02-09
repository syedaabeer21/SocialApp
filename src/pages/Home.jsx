import { useState, useEffect } from "react";
import { auth, db } from "../config/firebase/firebaseConfig.js";
import Login from "./Login.jsx";
import { signOut } from "firebase/auth";
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { FaRegThumbsUp, FaCommentDots } from "react-icons/fa"; // Add React Icons for like and comment

function App() {
  const [user, setUser] = useState(null);
  const [postContent, setPostContent] = useState("");
  const [imageUrl, setImageUrl] = useState(null); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName,
          email: currentUser.email,
          photo: currentUser.photoURL,
          uid: currentUser.uid,
        });
      } else {
        setUser(null);
      }
      setLoading(false); 
    });

    const fetchPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(postsQuery);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
    return () => unsubscribe();
  }, []);

  const handlePostSubmit = async () => {
    if (!user || !user.uid) {
      console.error("User is not logged in");
      return; 
    }

    try {
      await addDoc(collection(db, "posts"), {
        content: postContent,
        imageUrl: imageUrl, // Store image URL in Firestore
        userId: user.uid,
        createdAt: new Date(),
      });
      setPostContent("");
      setImageUrl(null); // Reset the image after posting
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  const handleImageUpload = () => {
    const cloudinaryWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dppg93kty", // Your Cloudinary cloud name
        uploadPreset: "abeer1234", // Your Cloudinary upload preset
        sources: ["local", "url", "camera", "facebook", "dropbox"],
        showAdvancedOptions: true,
        cropping: true,
        multiple: false,
        maxFileSize: 100000, // 10MB
        maxImageWidth: 100,
        maxImageHeight: 100,
        theme: "minimal",
      },
      (error, result) => {
        if (result && result.event === "success") {
          setImageUrl(result.info.secure_url); // Set image URL from Cloudinary
        } else if (error) {
          console.error("Cloudinary Upload Error:", error);
        }
      }
    );
    cloudinaryWidget.open();
  };
  useEffect(() => {
    if (!user) return;
  
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        const usersData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((u) => u.uid !== user.uid); // Exclude the logged-in user
          
  
        setUsersList(usersData);
        console.log(usersList)
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
  
    fetchUsers();
  }, [user]);

  return (
    <div className="container mx-auto p-4 ">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Show Home page and Navbar only after the user is logged in */}
          {user ? (
            <>
              {/* Navbar */}
              <div className="navbar bg-base-100">
                <div className="flex-1">
                  <a className="btn btn-ghost text-xl">Social App</a>
                </div>
                <div className="flex-none gap-2">
                  <div className="form-control">
                    <p>{user.name}</p>
                  </div>
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                      <div className="w-10 rounded-full">
                        <img alt="Profile" src={user.photo} />
                      </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                      <li><a className="justify-between">Profile</a></li>
                      <li><a>Settings</a></li>
                      <li onClick={() => signOut(auth)}><a>Logout</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex">
             {/* Sidebar */}
          <div className="w-1/4 p-4 bg-gray-100 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Users</h2>
            <ul>
              {usersList.map((u) => (
                <li key={u.id} className="flex justify-between items-center p-2 bg-white rounded-lg mb-2 shadow">
                  <div className="flex items-center">
                   
                    <p>{u.name}</p>
                  </div>
                  <button className="btn btn-sm bg-blue-500 text-white hover:bg-blue-600">Send Request</button>
                </li>
              ))}
            </ul>
          </div>
              {/* Home page content */}
              <div className="w-3/4 p-4">
              <div>
                <textarea
                  className="textarea textarea-bordered w-full mb-4"
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <button
                  className="btn bg-blue-500 text-white hover:bg-blue-600 mb-4"
                  onClick={handleImageUpload}
                >
                  Upload Image
                </button>
                {imageUrl && <img src={imageUrl} alt="Uploaded" className="w-20 h-20 mb-4 rounded-lg object-cover" />}
                <button
                  className="btn bg-blue-500 text-white hover:bg-blue-600"
                  onClick={handlePostSubmit}
                  
                >
                  Post
                </button>
              </div>

              <div className="mt-8">
                {posts.map((post) => (
                  <div key={post.id} className="post mb-6 p-6 bg-white rounded-lg shadow-lg">
                    <div className="flex items-center mb-4">
                      <img className="w-10 h-10 rounded-full" src={user.photo} alt="User" />
                      <div className="ml-3">
                        <p className="font-bold text-lg">{user.name}</p>
                        <p className="text-sm text-gray-500">{new Date(post.createdAt.seconds * 1000).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-800 mb-4">{post.content}</p>
                    {post.imageUrl && <img src={post.imageUrl} alt="Post Image" className="mb-4 w-full max-w-xs mx-auto" />}

                    {/* Like and Comment Icons */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <FaRegThumbsUp className="text-blue-500" />
                        <span>Like</span>
                      </div>
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <FaCommentDots className="text-gray-500" />
                        <span>Comment</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
              </div>
            </>
          ) : (
            <Login setUser={setUser} />
          )}
        </>
      )}
    </div>
  );
}

export default App;

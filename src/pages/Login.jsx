import { useState } from "react";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,updateProfile } from "firebase/auth";
import { auth, googleProvider, db } from "../config/firebase/firebaseConfig.js";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaImage } from "react-icons/fa";

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");  
  const [isSignup, setIsSignup] = useState(false); 
  const [imageUrl, setImageUrl] = useState("");
  //  Google Login
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          uid: user.uid,
        });
      }

      setUser({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        uid: user.uid,
      });

      setTimeout(() => navigate("/"), 500); // Ensure state is set before navigation
    } catch (error) {
      console.error(error);
    }
  };

  //  Email/Password Signup with Name
  const handleSignup = async () => {
    if (!email || !password || !name || !imageUrl) {
      alert("Please fill all fields including profile image!");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
        photoURL: imageUrl, // Set profile image
      });
      await setDoc(doc(db, "users", user.uid), {
        name: name, 
        email: user.email,
        photoURL: imageUrl,
        uid: user.uid,
      });

      setUser({
        name: name, 
        email: user.email,
        photo: imageUrl,
      });

      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };
  const handleImageUpload = () => {
    const cloudinaryWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dppg93kty",
        uploadPreset: "abeer1234",
        sources: ["local", "camera", "url"],
        cropping: true,
        multiple: false,
      },
      (error, result) => {
        if (result && result.event === "success") {
          setImageUrl(result.info.secure_url);
        }
      }
    );
    cloudinaryWidget.open();
  };
  //  Email/Password Login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUser({
          name: userSnap.data().name,
          email: userSnap.data().email,
          photo: userSnap.data().photoURL,
        });
      }

      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-400 to-indigo-600 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-2xl rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isSignup ? "Create an Account" : "Welcome Back"}
        </h2>

        <button
          className="flex items-center justify-center w-full py-2 px-4 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all mb-4"
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </button>

        <div className="relative text-center text-gray-500 my-4">
          <span className="bg-white px-2">or</span>
          <div className="absolute left-0 top-1/2 w-full border-t border-gray-300"></div>
        </div>

        <div className="space-y-4">
          {isSignup && (
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <FaLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignup && (
            <div className="text-center">
              <label className="flex items-center justify-center cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-600 py-2 px-4 rounded-lg">
                <FaImage className="mr-2" /> Upload Profile Image
                <input
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {imageUrl && (
                <img src={imageUrl} alt="Profile Preview" className="mt-3 w-16 h-16 rounded-full mx-auto shadow-md" />
              )}
            </div>
          )}
          
          <button
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
            onClick={isSignup ? handleSignup : handleLogin}
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </div>

        <p className="text-sm text-center text-gray-600 mt-4">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            className="text-blue-500 cursor-pointer font-semibold"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  
  );
};

export default Login;

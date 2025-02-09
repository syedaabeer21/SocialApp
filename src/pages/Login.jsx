import { useState } from "react";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, db } from "../config/firebase/firebaseConfig.js";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");  
  const [isSignup, setIsSignup] = useState(false); 

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
      });

      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  //  Email/Password Signup with Name
  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name, 
        email: user.email,
        photo: "",
        uid: user.uid,
      });

      setUser({
        name: name, 
        email: user.email,
        photo: "",
      });

      navigate("/");
    } catch (error) {
      console.error(error);
    }
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
          photo: userSnap.data().photo,
        });
      }

      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-4">Welcome Back</h2>

        <button 
          className="btn w-full bg-blue-500 text-white hover:bg-blue-600 mb-4"
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </button>

        <div className="my-4 text-center text-gray-600">or</div>

        <div>
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              className="input input-bordered w-full mb-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered w-full mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="btn w-full bg-blue-500 text-white hover:bg-blue-600 mb-4"
            onClick={isSignup ? handleSignup : handleLogin}
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </div>

        <p className="text-sm text-center text-gray-600">
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

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout'
import Home from './pages/Home'
import Login from './pages/Login'


const router=createBrowserRouter([
  {
  path:'/',
  element:<Layout/>,
  children:[
    {
      path:'',
      element:<Home/>
    },
    {
      path:'login',
      element:<Login/>
    },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}>
  </RouterProvider>
)

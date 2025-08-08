import React from 'react'
import { Outlet } from 'react-router'

const HomeLayout = () => {
  return (
    <div>
        <header className="bg-blue-500 text-white p-4">
          <h1 className="text-lg font-bold">My Chat App</h1>
        </header>
        <main className="p-4 min-h-screen">
          <Outlet />
        </main>
        <footer className="bg-gray-400 text-center p-4 mt-4">
          <p className="text-sm">© 2023 My Chat App</p>
        </footer>
    </div>
  )
}

export default HomeLayout
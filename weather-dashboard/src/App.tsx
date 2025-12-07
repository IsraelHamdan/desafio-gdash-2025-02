import './index.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/authContext';
import { ProtectedRoute } from './components/router/ProtectedRoute';
import { PublicLayout } from './components/layout/PublicLayout';
import { PrivateLayout } from './components/layout/PrivateLayout';

import AuthPage from './routes/auth';
import DashboardPage from './routes/dashboard';
import ProfilePage from './routes/profile';

function App() {
  const { status } = useAuth()
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout/>}>
          <Route 
            path='/'
            element={
              status === 'authenticated' 
                ? <Navigate to='/app/dashboard' replace/>
                : <AuthPage/>
            }
          />
        </Route>
        <Route element={
          <ProtectedRoute>
            <PrivateLayout/>
          </ProtectedRoute>
        } >
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

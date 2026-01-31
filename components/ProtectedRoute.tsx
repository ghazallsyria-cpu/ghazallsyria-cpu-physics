import React, { createContext, useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { User } from '../types';
import { RefreshCw } from 'lucide-react';

// 1. Define and export an AuthContext to provide authentication state to the app.
export const AuthContext = createContext<{ user: User | null; isLoading: boolean }>({
  user: null,
  isLoading: true,
});

// 2. Define and export a custom hook for easy access to the auth context.
export const useAuth = () => useContext(AuthContext);

// 3. Define the ProtectedRoute component.
interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-[#000407]">
        <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
        <p className="text-gray-500 font-black animate-pulse tracking-[0.3em]">LOADING SYSTEM...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to the login page, remembering where they came from.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect users without the required role to their dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  // Render the child route if the user is authenticated and has the correct role.
  return <Outlet />;
};

export default ProtectedRoute;

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const { userData, isLoading } = useAuth();

    if (isLoading) {
        // You can show a loading spinner here if you prefer
        return <div>Loading...</div>;
    }

    if (!userData) {
        // If no user is logged in, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    // If roles are specified and the user's role is not in the allowed list,
    // redirect them to the home page or an unauthorized page.
    if (allowedRoles && !allowedRoles.includes(userData.role)) {
        return <Navigate to="/" replace />;
    }

    // If the user is authenticated and has the correct role, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;

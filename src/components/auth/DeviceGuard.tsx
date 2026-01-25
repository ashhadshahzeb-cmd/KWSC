import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export const DeviceGuard = ({ children }: { children: React.ReactNode }) => {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        // Skip check for registration page
        if (location.pathname === "/register-device") {
            setIsVerified(true);
            return;
        }

        const token = localStorage.getItem("TrustedDeviceToken");
        // In a real app, verify this token with backend signature
        if (token) {
            setIsVerified(true);
        } else {
            setIsVerified(false);
        }
    }, [location]);

    if (isVerified === null) return null; // Loading state

    if (!isVerified && location.pathname !== "/register-device") {
        return <Navigate to="/register-device" replace />;
    }

    return <>{children}</>;
};

import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Fuel, ArrowLeft } from "lucide-react";
import Button from "../ui/Button";
import "./AuthNavbar.css";

export default function AuthNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isForgotPassword = location.pathname === "/forgot-password";
  const isResetPassword = location.pathname.includes("/reset-password");

  return (
    <motion.nav
      className='auth-nav'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className='auth-nav-container'>
        <motion.div
          className='auth-nav-brand'
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className='auth-nav-brand-icon'>
            <Fuel size={24} />
          </div>
          <span>FuelFlow</span>
        </motion.div>

        <div className='auth-nav-actions'>
          {(isForgotPassword || isResetPassword) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant='ghost'
                onClick={() => navigate("/login")}
                leftIcon={<ArrowLeft size={16} />}
              >
                Back to Login
              </Button>
            </motion.div>
          )}

          {isLoginPage && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant='ghost'
                onClick={() => navigate("/")}
                leftIcon={<ArrowLeft size={16} />}
              >
                Back to Home
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthNavbar from "../components/shared/AuthNavbar";
import "./LoginPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className='login-page'>
      <AuthNavbar />
      <div className='login-container'>
        <motion.div
          className='login-card'
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {!submitted ? (
            <>
              <div className='login-header'>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Forgot Password?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Enter your email and we'll send you a reset link
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className='login-form'>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Input
                    label='Email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='your.email@example.com'
                    leftIcon={<Mail size={18} />}
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type='submit'
                    fullWidth
                    loading={loading}
                    disabled={loading || !email}
                  >
                    Send Reset Link
                  </Button>
                </motion.div>
              </form>
            </>
          ) : (
            <motion.div
              className='login-success'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className='success-icon'>
                <CheckCircle size={48} />
              </div>
              <h2>Check Your Email</h2>
              <p>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

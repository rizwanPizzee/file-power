import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaEnvelope,
  FaArrowLeft,
} from "react-icons/fa";
import "../App.css";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 30;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function Login({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [remainingLockoutTime, setRemainingLockoutTime] = useState(0);
  const lockoutTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (lockoutEndTime) {
      lockoutTimerRef.current = setInterval(() => {
        const remaining = Math.ceil((lockoutEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutEndTime(null);
          setRemainingLockoutTime(0);
          setLoginAttempts(0);
          clearInterval(lockoutTimerRef.current);
        } else {
          setRemainingLockoutTime(remaining);
        }
      }, 1000);

      return () => clearInterval(lockoutTimerRef.current);
    }
  }, [lockoutEndTime]);

  const sanitizeEmail = (email) => {
    return email.trim().toLowerCase();
  };

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
  };

  const isLockedOut = () => {
    return lockoutEndTime && Date.now() < lockoutEndTime;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (isLockedOut()) {
      setError(
        `Too many login attempts. Please try again in ${remainingLockoutTime} seconds.`
      );
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);

    const emailError = validateEmail(sanitizedEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) throw error;

      setLoginAttempts(0);
    } catch (err) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutEnd = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
        setLockoutEndTime(lockoutEnd);
        setRemainingLockoutTime(LOCKOUT_DURATION_SECONDS);
        setError(
          `Too many login attempts. Please try again in ${LOCKOUT_DURATION_SECONDS} seconds.`
        );
      } else {
        const attemptsRemaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        setError(
          `${err.message} (${attemptsRemaining} attempt${
            attemptsRemaining !== 1 ? "s" : ""
          } remaining)`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="logo.png" alt="Logo" className="logo" />
        <h1 className="app-title" style={{ margin: "20px 0px" }}>
          File Power
        </h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type={secureTextEntry ? "password" : "text"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setSecureTextEntry(!secureTextEntry)}
            >
              {secureTextEntry ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {onBack && (
            <button onClick={onBack} className="login-back-btn">
              Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

import { BACKEND_URL } from "./menuService";

export interface LoginResponse {
  message?: string;
  token?: string;
  user?: any;
  notVerified?: boolean;
  error?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: email, password }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse login response:", text);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok && response.status !== 403) {
        throw new Error(data.message || data.error || "Login failed");
      }
      return data;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  },

  resendOTP: async (identifier: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: identifier.trim().toLowerCase() }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse resend-otp response:", text);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to send OTP");
      }
      return data;
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      throw error;
    }
  },

  verifyOTP: async (
    identifier: string,
    otp: string,
  ): Promise<{ message: string }> => {
    try {
      if (!identifier) throw new Error("Identifier (email/phone) is missing");
      if (!otp) throw new Error("OTP is missing");

      // Ensure otp is a string and trimmed
      const cleanOtp = String(otp).trim();
      const cleanIdentifier = identifier.trim().toLowerCase();

      const requestBody = { email: cleanIdentifier, otp: cleanOtp };
      console.log("🚀 Verifying OTP with body:", JSON.stringify(requestBody));

      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      console.log("📥 Verify OTP raw response:", text);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse verify-otp response:", text);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Invalid OTP");
      }
      return data;
    } catch (error: any) {
      console.error("Verify OTP error detail:", error);
      throw error;
    }
  },

  register: async (userData: any): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const text = await response.text();
      console.log("Registration raw response:", text);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse registration response:", text);
        throw new Error("Server returned an invalid response format");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Registration failed");
      }
      return data;
    } catch (error: any) {
      console.error("Registration error detail:", error);
      throw error;
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse forgot-password response:", text);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to send reset code",
        );
      }
      return data;
    } catch (error: any) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  resetPassword: async (
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    try {
      const cleanOtp = String(otp).trim();
      const cleanEmail = email.trim().toLowerCase();

      const requestBody = { email: cleanEmail, otp: cleanOtp, newPassword };
      console.log(
        "🚀 Resetting password with body:",
        JSON.stringify(requestBody),
      );

      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      console.log("📥 Reset Password raw response:", text);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse reset-password response:", text);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to reset password",
        );
      }
      return data;
    } catch (error: any) {
      console.error("Reset password error detail:", error);
      throw error;
    }
  },
};

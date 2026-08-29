"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";
import { motion } from "framer-motion";

export default function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length > 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0 to 4
  };

  const strength = getStrength(newPassword);
  
  const strengthColors = ["bg-gray-200", "bg-red-500", "bg-amber-500", "bg-blue", "bg-green-500"];
  const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  
  const currentStrengthColor = newPassword.length === 0 ? strengthColors[0] : strengthColors[strength === 0 ? 1 : strength];
  const currentStrengthLabel = newPassword.length === 0 ? "" : strengthLabels[strength === 0 ? 1 : strength];
  const strengthWidth = newPassword.length === 0 ? "0%" : `${Math.max(25, strength * 25)}%`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (strength < 2) {
      setError("Please choose a stronger password.");
      return;
    }

    setLoading(true);

    try {
      // Note: Supabase auth.updateUser only requires the new password by default, 
      // but requiring the current password client-side is good practice, although 
      // we can't easily verify it without re-authenticating. Let's do a re-auth first.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      // Verify current password by signing in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error("Current password is incorrect.");
      }

      // If successful, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-6 sm:p-8">
      <h2 className="text-xl font-bold text-navy mb-1">Change Password</h2>
      <p className="text-sm text-text-secondary mb-6">
        Update your password to keep your account secure. Note: Changing your password will not log you out of your current session.
      </p>

      {success && (
        <div className="mb-6">
          <FormAlert variant="success" message="Password updated successfully." />
        </div>
      )}

      {error && (
        <div className="mb-6">
          <FormAlert variant="error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <div className="space-y-1">
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          
          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-text-secondary">Password strength</span>
                <span className="font-medium text-text-primary">{currentStrengthLabel}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: strengthWidth, backgroundColor: newPassword.length > 0 ? undefined : "#E5E7EB" }}
                  className={`h-full ${currentStrengthColor}`}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <AuthButton type="submit" loading={loading} className="w-full sm:w-auto">
            Update Password
          </AuthButton>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";

export default function DeleteAccountSection() {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleDeactivate = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Call RPC to anonymize data and flag as deleted
      const { error: rpcError } = await supabase.rpc("deactivate_account");
      
      if (rpcError) throw rpcError;

      // 2. Scramble the password so they can't log in again easily
      // Even though we added a check in login, scrambling password adds extra security.
      // Supabase updateUser allows changing password without old password if authenticated.
      await supabase.auth.updateUser({
        password: Math.random().toString(36).slice(-10) + "A1!"
      });

      // 3. Sign out
      await supabase.auth.signOut();
      
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-red-200 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-red-100 bg-red-50/50">
        <h2 className="text-xl font-bold text-red-900 mb-1">Delete Account</h2>
        <p className="text-sm text-red-700">
          This is a serious, irreversible action. Please read the implications carefully.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div className="mb-6">
            <FormAlert variant="error" message={error} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="prose prose-sm text-text-secondary max-w-none">
              <p className="font-semibold text-text-primary">What happens when you delete your account?</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Your profile information (name, phone, address) will be permanently anonymized and scrubbed from our systems.</li>
                <li>You will lose all access to this account immediately.</li>
                <li>
                  <strong className="text-text-primary">Important:</strong> Any grievances or appeals you have already submitted will <strong>not</strong> be deleted. They will remain in the system so that government officers can complete their work and maintain historical audit records. However, they will no longer be linked to your personal identity.
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-[var(--radius-md)] hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
              >
                I understand, continue to deletion
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-text-secondary">
              To permanently delete your account and anonymize your data, please type <strong>DELETE</strong> in the box below.
            </p>
            
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Confirm Deletion</label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full max-w-sm px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-surface text-text-primary"
              />
            </div>

            <div className="pt-4 flex items-center gap-3 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg rounded-[var(--radius-md)] transition-colors border border-transparent"
              >
                Cancel
              </button>
              <AuthButton 
                onClick={handleDeactivate} 
                loading={loading}
                disabled={confirmText !== "DELETE"}
                className="w-auto px-6 !bg-red-600 hover:!bg-red-700 focus:!ring-red-500"
              >
                Permanently Delete Account
              </AuthButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

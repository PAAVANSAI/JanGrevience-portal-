import React from "react";
import Header from "@/components/layout/Header";
import ProfileSection from "@/components/settings/ProfileSection";
import SecuritySection from "@/components/settings/SecuritySection";
import ActivitySection from "@/components/settings/ActivitySection";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";

export const metadata = {
  title: "Account Settings - JanGrievance",
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Account Settings</h1>
          <p className="text-text-secondary mt-1">Manage your profile, security, and preferences all in one place.</p>
        </div>

        <div className="space-y-6 pb-8">
          {/* Profile Section */}
          <section id="profile">
            <ProfileSection />
          </section>

          <hr className="border-border" />

          {/* Security Section */}
          <section id="security">
            <SecuritySection />
          </section>

          <hr className="border-border" />

          {/* Activity Section */}
          <section id="activity">
            <ActivitySection />
          </section>

          <hr className="border-border" />

          {/* Danger Zone */}
          <section id="delete">
            <DeleteAccountSection />
          </section>
        </div>
      </main>
    </div>
  );
}

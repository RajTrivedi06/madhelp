"use client";

import React, { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";

export default function LandingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-6 sm:px-6 md:px-8">
      {/* Header Section */}
      <header className="text-center mb-8 sm:mb-10 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
          MadHelp
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mt-2">
          A UW Madison Course and Research Helper
        </p>
      </header>

      {/* About Section */}
      <section className="max-w-full sm:max-w-xl md:max-w-2xl text-center mb-6 sm:mb-8 md:mb-10">
        <p className="text-sm sm:text-base md:text-lg text-gray-700">
          MadHelp is a platform that helps students find research opportunities
          by analyzing their academic report and CV. Our goal is to streamline
          the process of connecting students with professors and projects that
          match their skills and interests.
        </p>
      </section>

      {/* Sign In Button */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Trigger asChild>
          <button className="px-4 py-2 sm:px-6 sm:py-2 text-base sm:text-lg bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
            Sign In
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[400px] sm:max-w-[450px] md:max-w-lg bg-white rounded-lg p-4 sm:p-6 shadow-md max-h-[85vh] overflow-y-auto">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
              Authentication
            </Dialog.Title>

            <Tabs.Root defaultValue="signup" className="flex flex-col">
              {/* Tabs List */}
              <Tabs.List className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <Tabs.Trigger
                  value="signup"
                  className="px-4 py-2 sm:px-6 sm:py-2 text-base sm:text-lg font-medium rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Sign Up
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="login"
                  className="px-4 py-2 sm:px-6 sm:py-2 text-base sm:text-lg font-medium rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Login
                </Tabs.Trigger>
              </Tabs.List>

              {/* Sign Up Tab Content */}
              <Tabs.Content value="signup">
                <SignUpForm />
              </Tabs.Content>

              {/* Login Tab Content */}
              <Tabs.Content value="login">
                <LoginForm />
              </Tabs.Content>
            </Tabs.Root>

            <Dialog.Close asChild>
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-lg sm:text-xl"
                aria-label="Close"
              >
                ✕
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/* Sign Up Form */
function SignUpForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    alert("Sign-up form submitted successfully!");
    setFormData({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="mb-3 sm:mb-4 rounded bg-red-100 p-2 sm:p-3 text-red-700 text-sm sm:text-base">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-green-600"
        />
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-green-600"
        />
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-green-600"
        />
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          name="confirm_password"
          value={formData.confirm_password}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-green-600"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-green-600 py-2 text-base sm:text-lg font-medium text-white hover:bg-green-700"
      >
        Sign Up
      </button>
    </form>
  );
}

/* Login Form */
function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    alert("Login form submitted successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="mb-3 sm:mb-4 rounded bg-red-100 p-2 sm:p-3 text-red-700 text-sm sm:text-base">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-blue-600"
        />
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-blue-600"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 py-2 text-base sm:text-lg font-medium text-white hover:bg-blue-700"
      >
        Login
      </button>
    </form>
  );
}

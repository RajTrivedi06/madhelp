import React from "react";
import { useNavigate } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { LineShadowText } from "../components/magicui/line-shadow-text";

function FileUploadButton({
  label,
  accept,
  name,
  onFileSelected,
}: {
  label: string;
  accept: string;
  name: string;
  onFileSelected?: (file: File) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected?.(file);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center text-sm font-medium py-1 px-3 text-white bg-red-600 hover:bg-red-700 rounded"
      >
        {label}
      </button>
      <input
        type="file"
        name={name}
        accept={accept}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

function SignUpForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        alert("Signup successful! Welcome " + result.username);
        navigate("/what-do-you-want");
      } else {
        alert(result.error || "Signup failed.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred during signup.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          name="username"
          required
          className="mt-1 w-full border border-gray-300 rounded-lg p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full border border-gray-300 rounded-lg p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          className="mt-1 w-full border border-gray-300 rounded-lg p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          name="confirm_password"
          required
          className="mt-1 w-full border border-gray-300 rounded-lg p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload CV (PDF Only)
        </label>
        <FileUploadButton label="Upload CV" accept=".pdf" name="cv" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload DARS (PDF Only)
        </label>
        <FileUploadButton label="Upload DARS" accept=".pdf" name="dars" />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
      >
        Sign Up
      </button>
    </form>
  );
}

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("token", result.token); // Store JWT token
        alert("Login successful! Welcome " + result.username);
        navigate("/dashboard"); // Redirect to dashboard
      } else {
        alert(result.error || "Login failed.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full border border-gray-300 rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          className="mt-1 w-full border border-gray-300 rounded p-2"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700"
      >
        Login
      </button>
    </form>
  );
}

export default function LandingPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const navigate = useNavigate();
  const shadowColor = "black";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* HEADER */}
      <header className="px-4 py-8 border-b-2 border-red-600 sm:px-6 sm:py-12">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Mad
            <LineShadowText
              shadowColor={shadowColor}
              className="italic text-red-600"
            >
              Help
            </LineShadowText>
          </h1>
          <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl text-center">
            Your Gateway to Research & Excellence at UW Madison
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-3xl w-full space-y-12">
          <section className="text-center">
            <p className="text-base sm:text-lg md:text-xl text-gray-800 leading-relaxed">
              At MadHelp, we bridge the gap between ambitious students and
              groundbreaking research opportunities...
            </p>
          </section>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <button className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 text-lg font-semibold">
                  Sign In
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl p-6 shadow-2xl mx-4">
                  <Dialog.Title className="text-2xl font-bold text-red-600 text-center mb-6">
                    Authentication
                  </Dialog.Title>
                  <Tabs.Root defaultValue="signup">
                    <Tabs.List className="flex justify-center gap-4 mb-6">
                      <Tabs.Trigger
                        value="signup"
                        className="px-4 py-2 font-semibold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 data-[state=active]:bg-red-600 data-[state=active]:text-white transition"
                      >
                        Sign Up
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="login"
                        className="px-4 py-2 font-semibold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 data-[state=active]:bg-red-600 data-[state=active]:text-white transition"
                      >
                        Login
                      </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="signup">
                      <SignUpForm />
                    </Tabs.Content>
                    <Tabs.Content value="login">
                      <LoginForm />
                    </Tabs.Content>
                  </Tabs.Root>
                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-xl"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <button
              onClick={() => navigate("/what-do-you-want")}
              className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-red-600 text-red-600 rounded-full shadow-lg hover:bg-red-50 text-lg font-semibold"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 px-4 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          © 2025 MadHelp. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

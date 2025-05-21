import React from "react";
import { useNavigate } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { LineShadowText } from "../components/magicui/line-shadow-text";
import { postForm } from "@/lib/api";

// ------------------------------------------------------------------
// Reusable PDF upload button
// ------------------------------------------------------------------
function FileUploadButton({
  label,
  accept,
  name,
  onFileSelected,
  required = false,
  multiple = false,
}: {
  label: string;
  accept: string;
  name: string;
  onFileSelected?: (files: File[]) => void;
  required?: boolean;
  multiple?: boolean;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    onFileSelected?.(files);
  };

  const removeFile = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter(
      (_, index) => index !== indexToRemove
    );
    setSelectedFiles(newFiles);
    onFileSelected?.(newFiles);

    // Reset the input value to allow selecting the same file again
    if (ref.current) {
      ref.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex items-center text-sm font-medium py-1 px-3 text-white bg-red-600 hover:bg-red-700 rounded"
      >
        {label}
      </button>
      <input
        hidden
        ref={ref}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={handleFileChange}
      />
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
            >
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-500 hover:text-red-600 focus:outline-none"
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
//   SIGN‑UP  form (posts to /api/signup)
// ------------------------------------------------------------------
function SignUpForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    // Debug: Log form data
    console.log("Form data:", Object.fromEntries(data.entries()));

    try {
      const res = await postForm("/api/signup", data);
      localStorage.setItem("token", res.token);
      alert(`Signup successful! Welcome ${res.username}.`);
      navigate("/what-do-you-want");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/** username / email / passwords **/}
      {[
        { label: "Username", name: "username", type: "text" },
        { label: "Email", name: "email", type: "email" },
        { label: "Password", name: "password", type: "password" },
        {
          label: "Confirm Password",
          name: "confirm_password",
          type: "password",
        },
      ].map(({ label, name, type }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            required
            type={type}
            name={name}
            className="mt-1 w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
      ))}

      {/** PDF uploads **/}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload CV (PDF Only) *
        </label>
        <FileUploadButton
          label="Upload CV"
          accept=".pdf"
          name="cv"
          required
          onFileSelected={(files) => {
            if (files.length > 1) {
              alert("Please select only one CV file");
              const input = document.querySelector(
                'input[name="cv"]'
              ) as HTMLInputElement;
              if (input) input.value = "";
            }
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload DARS Files (PDF Only) *
        </label>
        <p className="text-sm text-gray-500 mb-2">
          You can upload up to 4 DARS files. The first one is required.
        </p>
        <FileUploadButton
          label="Choose DARS Files"
          accept=".pdf"
          name="dars"
          required
          multiple
          onFileSelected={(files) => {
            if (files.length > 4) {
              alert("You can only upload up to 4 DARS files");
              const input = document.querySelector(
                'input[name="dars"]'
              ) as HTMLInputElement;
              if (input) input.value = "";
            }
          }}
        />
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

// ------------------------------------------------------------------
//   LOGIN form (posts to /api/login)
// ------------------------------------------------------------------
function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    try {
      const res = await postForm("/api/login", data);
      localStorage.setItem("token", res.token);
      alert(`Login successful! Welcome ${res.username}.`);
      navigate("/what-do-you-want");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {["email", "password"].map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700">
            {field === "email" ? "Email" : "Password"}
          </label>
          <input
            required
            type={field === "email" ? "email" : "password"}
            name={field}
            className="mt-1 w-full border border-gray-300 rounded p-2"
          />
        </div>
      ))}
      <button
        type="submit"
        className="w-full py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700"
      >
        Login
      </button>
    </form>
  );
}

// ------------------------------------------------------------------
//   Landing Page component
// ------------------------------------------------------------------
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
            Your Gateway to Research & Excellence at UW-Madison
          </p>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-3xl w-full space-y-12">
          <section className="text-center">
            <p className="text-base sm:text-lg md:text-xl text-gray-800 leading-relaxed">
              At MadHelp we bridge the gap between ambitious students and
              groundbreaking research opportunities…
            </p>
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* AUTH MODAL */}
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <button className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 text-lg font-semibold">
                  Sign In
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 w-full max-w-md bg-white rounded-xl p-6 shadow-2xl -translate-x-1/2 -translate-y-1/2 mx-4">
                  <Dialog.Title className="text-2xl font-bold text-red-600 text-center mb-6">
                    Authentication
                  </Dialog.Title>

                  <Tabs.Root defaultValue="signup">
                    <Tabs.List className="flex justify-center gap-4 mb-6">
                      {["signup", "login"].map((tab) => (
                        <Tabs.Trigger
                          key={tab}
                          value={tab}
                          className="px-4 py-2 font-semibold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 data-[state=active]:bg-red-600 data-[state=active]:text-white transition"
                        >
                          {tab === "signup" ? "Sign Up" : "Login"}
                        </Tabs.Trigger>
                      ))}
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
                      ×
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* CTA → feature selector */}
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

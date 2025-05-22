import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Label from "@radix-ui/react-label";
import { Edit, Check, X, FileText, Eye } from "lucide-react";
import { Badge, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Get API base URL from environment or default to localhost:5000
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// Create axios instance with base URL and auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const response = await axios.post(
          `${API_URL}/api/token/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );
        const { access_token, refresh_token } = response.data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ─── ProfileSection ───────────────────────────────────────────────────
interface Profile {
  username: string;
  email: string;
  created_at: string;
}

const ProfileSection = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({
    username: "",
    email: "",
    created_at: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/user/profile")
      .then((response) => setProfile(response.data.profile))
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
        if (err.response?.status === 401) navigate("/");
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">Error: {error}</div>
    );
  }

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put("/api/user/profile", {
        username: profile.username,
        email: profile.email,
      });
      setProfile(response.data.profile);
      setIsEditing(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <Edit size={16} /> <span>Edit</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["username", "email"].map((field) => (
          <div key={field}>
            <Label.Root className="block text-sm font-medium text-gray-700">
              {field === "username" ? "Username" : "Email"}
            </Label.Root>
            {isEditing ? (
              <input
                type={field === "email" ? "email" : "text"}
                value={profile[field as keyof Profile]}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setProfile((p) => ({ ...p, [field]: e.target.value }))
                }
                className="w-full p-2 border rounded"
              />
            ) : (
              <div className="p-3 border bg-gray-100">
                {profile[field as keyof Profile]}
              </div>
            )}
          </div>
        ))}
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700">
            Account Created
          </Label.Root>
          <div className="p-3 border bg-gray-100">
            {new Date(profile.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      {isEditing && (
        <div className="flex space-x-4">
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            <Check size={16} /> Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            <X size={16} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// ─── PasswordSection ───────────────────────────────────────────────────
interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

const PasswordSection = () => {
  const [pw, setPw] = useState<PasswordForm>({
    current: "",
    new: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPw((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (pw.new !== pw.confirm) {
      setError("New passwords must match!");
      return;
    }

    try {
      await api.put("/api/user/password", {
        current_password: pw.current,
        new_password: pw.new,
      });
      setSuccess(true);
      setPw({ current: "", new: "", confirm: "" });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to update password");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Change Password</h2>
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-600 rounded">
          Password updated successfully!
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        {[
          { name: "current", label: "Current Password" },
          { name: "new", label: "New Password" },
          { name: "confirm", label: "Confirm New Password" },
        ].map(({ name, label }) => (
          <div key={name}>
            <Label.Root className="block text-sm font-medium text-gray-700">
              {label}
            </Label.Root>
            <input
              type="password"
              name={name}
              value={pw[name as keyof PasswordForm]}
              onChange={onChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        ))}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Update Password
        </button>
      </form>
    </div>
  );
};

// ─── DocumentsSection ─────────────────────────────────────────────────
interface Document {
  id: number | string;
  name: string;
  label: string;
}

interface Docs {
  dars: Document[];
  cv: Document | null;
}

const DocumentsSection = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Docs>({ dars: [], cv: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/user/profile")
      .then((response) => setDocs(response.data.documents))
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
        if (err.response?.status === 401) navigate("/");
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">Error: {error}</div>
    );
  }

  const Card = ({ doc }: { doc: Document }) => (
    <div className="border rounded shadow-sm w-full sm:w-1/3">
      <div className="p-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-gray-500" />
        <div>
          <div className="font-medium">{doc.name}</div>
          <Badge
            variant="solid"
            color={doc.label === "DARS" ? "indigo" : "green"}
          >
            {doc.label}
          </Badge>
        </div>
      </div>
      <div className="border-t p-2 text-sm">
        <button
          onClick={() =>
            window.open(`${API_URL}/uploads/${doc.name}`, "_blank")
          }
          className="flex items-center gap-1 hover:underline"
        >
          <Eye className="w-4 h-4" /> Preview
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Documents</h2>
      <Tabs.Root defaultValue="dars">
        <Tabs.List className="flex gap-4 border-b mb-4">
          <Tabs.Trigger value="dars">DARS</Tabs.Trigger>
          <Tabs.Trigger value="cv">CV</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="dars">
          {docs.dars.length ? (
            <div className="flex flex-wrap gap-4">
              {docs.dars.map((d) => (
                <Card key={d.id} doc={d} />
              ))}
            </div>
          ) : (
            <p>No DARS files uploaded</p>
          )}
        </Tabs.Content>
        <Tabs.Content value="cv">
          {docs.cv ? <Card doc={docs.cv} /> : <p>No CV uploaded</p>}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

// ─── Main AccountSettingsPage ─────────────────────────────────────────
export default function AccountSettingsPage() {
  const navigate = useNavigate();

  // Simple guard: if tokens missing → bounce
  useEffect(() => {
    if (
      !localStorage.getItem("access_token") ||
      !localStorage.getItem("refresh_token")
    ) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <Theme>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Account Settings</h1>
        <Tabs.Root defaultValue="profile">
          <Tabs.List className="flex gap-6 border-b mb-6">
            <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
            <Tabs.Trigger value="password">Password</Tabs.Trigger>
            <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="profile">
            <ProfileSection />
          </Tabs.Content>
          <Tabs.Content value="password">
            <PasswordSection />
          </Tabs.Content>
          <Tabs.Content value="documents">
            <DocumentsSection />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Theme>
  );
}

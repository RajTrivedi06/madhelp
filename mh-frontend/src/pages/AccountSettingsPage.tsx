// AccountSettingsPage.tsx
import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  MouseEvent,
} from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Label from "@radix-ui/react-label";
import { Edit, Check, X, FileText, Eye } from "lucide-react";
import { Badge } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

// Helper function to make authenticated API calls
const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  onAuthError?: () => void
) => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (!accessToken || !refreshToken) {
    console.error("No tokens found in localStorage");
    if (onAuthError) onAuthError();
    throw new Error("No authentication tokens found");
  }

  try {
    // Validate access token format
    const tokenParts = accessToken.split(".");
    if (tokenParts.length !== 3) {
      console.error("Invalid access token format");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (onAuthError) onAuthError();
      throw new Error("Invalid authentication token");
    }

    // Try to decode the token payload
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log("Token payload:", payload);

      // Check if token is expired
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      if (Date.now() >= expirationTime) {
        console.log("Access token expired, attempting to refresh...");
        try {
          const refreshResponse = await fetch(
            "http://localhost:5000/api/token/refresh",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${refreshToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (refreshResponse.ok) {
            const { access_token, refresh_token } =
              await refreshResponse.json();
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
            console.log("Tokens refreshed successfully");
            // Retry the original request with the new access token
            return fetchWithAuth(url, options, onAuthError);
          } else {
            console.error("Token refresh failed");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            if (onAuthError) onAuthError();
            throw new Error("Session expired - please log in again");
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          if (onAuthError) onAuthError();
          throw new Error("Session expired - please log in again");
        }
      }

      if (!payload.sub || typeof payload.sub !== "number") {
        console.error("Invalid token payload - missing or invalid user ID");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (onAuthError) onAuthError();
        throw new Error("Invalid token format");
      }
    } catch (e) {
      console.error("Failed to decode token payload:", e);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (onAuthError) onAuthError();
      throw new Error("Invalid token format");
    }

    console.log("Making API request to:", url);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401 || response.status === 422) {
      console.error(`Authentication failed (${response.status})`);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (onAuthError) onAuthError();
      throw new Error("Authentication failed - please log in again");
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }));
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: url,
      });
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("API Response:", data);
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "Unable to connect to the server. Please check if the backend is running."
        );
      }
      throw new Error(`API request failed: ${error.message}`);
    }
    throw new Error("API request failed: Unknown error");
  }
};

// Add type definitions
interface Profile {
  username: string;
  email: string;
  created_at: string;
}

interface Document {
  id: number | string;
  name: string;
  label: string;
}

interface Documents {
  dars: Document[];
  cv: Document | null;
}

// ------------------------------
// ProfileSection Component
// ------------------------------
const ProfileSection = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    username: "",
    email: "",
    created_at: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleAuthError = () => {
    navigate("/");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchWithAuth(
          "http://localhost:5000/api/user/profile",
          {},
          handleAuthError
        );
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchWithAuth(
        "http://localhost:5000/api/user/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            username: profile.username,
            email: profile.email,
          }),
        },
        handleAuthError
      );
      setProfile(data.profile);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const handleCancel = (e: FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    // Reset profile data by fetching again
    fetchWithAuth("http://localhost:5000/api/user/profile", {}, handleAuthError)
      .then((data) => setProfile(data.profile))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to reset profile")
      );
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Username */}
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </Label.Root>
          {isEditing ? (
            <input
              type="text"
              value={profile.username}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setProfile({ ...profile, username: e.target.value })
              }
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="p-3 border rounded bg-gray-100 text-base">
              {profile.username}
            </div>
          )}
        </div>

        {/* Email Address */}
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </Label.Root>
          {isEditing ? (
            <input
              type="email"
              value={profile.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setProfile({ ...profile, email: e.target.value })
              }
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="p-3 border rounded bg-gray-100 text-base">
              {profile.email}
            </div>
          )}
        </div>

        {/* Account Created Date */}
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            Account Created
          </Label.Root>
          <div className="p-3 border rounded bg-gray-100 text-base">
            {new Date(profile.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Editing Actions */}
      {isEditing && (
        <div className="flex space-x-4">
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => handleSave(e)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Check size={16} />
            <span>Save</span>
          </button>
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => handleCancel(e)}
            className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ------------------------------
// PasswordSection Component
// ------------------------------
const PasswordSection = () => {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New password and confirmation do not match!");
      return;
    }
    // Simulate API call to update password
    console.log("Password update submitted:", passwords);
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </Label.Root>
          <input
            type="password"
            name="current"
            value={passwords.current}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </Label.Root>
          <input
            type="password"
            name="new"
            value={passwords.new}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </Label.Root>
          <input
            type="password"
            name="confirm"
            value={passwords.confirm}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update Password
        </button>
      </form>
    </div>
  );
};

// ------------------------------
// DocumentsSection Component
// ------------------------------
const DocumentsSection = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Documents>({ dars: [], cv: null });
  const [error, setError] = useState<string | null>(null);

  const handleAuthError = () => {
    navigate("/");
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await fetchWithAuth(
          "http://localhost:5000/api/user/profile",
          {},
          handleAuthError
        );
        setDocuments(data.documents);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      }
    };
    fetchDocuments();
  }, [navigate]);

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  // Reusable card component for a single document
  const DocumentCard = ({ doc }: { doc: Document }) => {
    return (
      <div className="flex flex-col border border-gray-200 rounded-lg shadow-sm overflow-hidden w-full sm:w-[48%] lg:w-[32%] xl:w-[24%]">
        <div className="p-4 flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-500" />
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 text-base">
              {doc.name}
            </span>
            <div className="mt-1">
              <Badge
                variant="solid"
                color={doc.label === "DARS" ? "indigo" : "green"}
                size="1"
              >
                {doc.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        <div className="px-4 py-2 flex items-center justify-between">
          <button
            onClick={() =>
              window.open(`http://localhost:5000/uploads/${doc.name}`, "_blank")
            }
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-2">Documents</h2>
      <p className="text-gray-600 mb-6">Your uploaded documents</p>

      <Tabs.Root defaultValue="dars" className="w-full">
        <Tabs.List
          className="flex items-center gap-4 pb-2 mb-6 border-b"
          aria-label="Select document type"
        >
          <Tabs.Trigger
            value="dars"
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600"
          >
            DARS Documents
          </Tabs.Trigger>
          <Tabs.Trigger
            value="cv"
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600"
          >
            CV
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="dars" className="space-y-6">
          {documents.dars.length === 0 ? (
            <p className="text-gray-500 mt-2">
              No DARS Documents uploaded yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4 mt-4">
              {documents.dars.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="cv" className="space-y-6">
          {!documents.cv ? (
            <p className="text-gray-500 mt-2">No CV uploaded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4 mt-4">
              <DocumentCard doc={documents.cv} />
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

// ------------------------------
// Main AccountSettingsPage
// ------------------------------
const AccountSettingsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
      navigate("/");
      return;
    }

    // Validate access token format
    try {
      const tokenParts = accessToken.split(".");
      if (tokenParts.length !== 3) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/");
        return;
      }

      // Check if token is expired
      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000;
      if (Date.now() >= expirationTime) {
        // Try to refresh the token
        fetch("http://localhost:5000/api/token/refresh", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${refreshToken}`,
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Token refresh failed");
            }
            return response.json();
          })
          .then(({ access_token, refresh_token }) => {
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
          })
          .catch(() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            navigate("/");
          });
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/");
    }
  }, [navigate]);

  return (
    <Theme>
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Account Settings</h1>
        <p className="mb-8 text-gray-600 text-lg">
          Manage your account information, security, and documents.
        </p>
        <Tabs.Root defaultValue="profile" className="w-full">
          {/* Top-Level Tabs */}
          <Tabs.List
            className="flex border-b mb-8"
            aria-label="Manage your account"
          >
            <Tabs.Trigger
              value="profile"
              className="px-6 py-3 border-b-2 transition-colors hover:bg-gray-100 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 text-lg"
            >
              Profile
            </Tabs.Trigger>
            <Tabs.Trigger
              value="password"
              className="px-6 py-3 border-b-2 transition-colors hover:bg-gray-100 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 text-lg"
            >
              Password
            </Tabs.Trigger>
            <Tabs.Trigger
              value="documents"
              className="px-6 py-3 border-b-2 transition-colors hover:bg-gray-100 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 text-lg"
            >
              Documents
            </Tabs.Trigger>
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Content value="profile" className="pt-4">
            <ProfileSection />
          </Tabs.Content>

          {/* Password Tab */}
          <Tabs.Content value="password" className="pt-4">
            <PasswordSection />
          </Tabs.Content>

          {/* Documents Tab */}
          <Tabs.Content value="documents" className="pt-4">
            <DocumentsSection />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </Theme>
  );
};

export default AccountSettingsPage;

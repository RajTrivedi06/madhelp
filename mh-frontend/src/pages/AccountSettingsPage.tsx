// AccountSettingsPage.tsx
import React, { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Label from "@radix-ui/react-label";
import { Edit, Check, X, FileText, Eye, Trash2 } from "lucide-react";
import { Badge } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

// Sample data for documents
const sampleDocuments = [
  {
    id: 1,
    name: "DARS_Fall2023.pdf",
    label: "DARS",
  },
  {
    id: 2,
    name: "DARS_Spring2023.pdf",
    label: "DARS",
  },
  {
    id: 3,
    name: "Resume_2023.pdf",
    label: "CV",
  },
];

// ------------------------------
// ProfileSection Component
// ------------------------------
const ProfileSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
  });

  const handleSave = () => {
    setIsEditing(false);
    // Simulate API call to save profile data
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset profile data if needed
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </Label.Root>
          {isEditing ? (
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="p-3 border rounded bg-gray-100 text-base">
              {profile.name}
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
              onChange={(e) =>
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

        {/* Phone Number */}
        <div>
          <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </Label.Root>
          {isEditing ? (
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="p-3 border rounded bg-gray-100 text-base">
              {profile.phone}
            </div>
          )}
        </div>
      </div>

      {/* Editing Actions */}
      {isEditing && (
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Check size={16} />
            <span>Save</span>
          </button>
          <button
            onClick={handleCancel}
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
// DocumentsSection with Sub-Tabs
// ------------------------------
const DocumentsSection = () => {
  // Separate documents for the two sub-tabs
  const darsDocuments = sampleDocuments.filter((doc) => doc.label === "DARS");
  const cvDocuments = sampleDocuments.filter((doc) => doc.label === "CV");

  const handleAddDars = () => {
    alert("Add DARS Document - Implement your own logic or modal here.");
  };

  const handleAddCV = () => {
    alert("Add CV Document - Implement your own logic or modal here.");
  };

  const handlePreview = (doc) => {
    alert(`Previewing: ${doc.name}`);
  };

  const handleDelete = (docId, label) => {
    alert(
      `Delete ${label} document with ID: ${docId} (implement delete logic)`
    );
  };

  // Reusable card component for a single document
  const DocumentCard = ({ doc }) => {
    return (
      <div className="flex flex-col border border-gray-200 rounded-lg shadow-sm overflow-hidden w-full sm:w-[48%] lg:w-[32%] xl:w-[24%]">
        {/* Top section with icon, name, and badge */}
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

        {/* Divider */}
        <div className="h-px bg-gray-200" />

        {/* Bottom actions row */}
        <div className="px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => handlePreview(doc)}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => handleDelete(doc.id, doc.label)}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-2">Documents</h2>
      <p className="text-gray-600 mb-6">Manage your uploaded documents</p>

      <Tabs.Root defaultValue="dars" className="w-full">
        {/* Sub-tabs for DARS and CV */}
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

        {/* DARS Documents */}
        <Tabs.Content value="dars" className="space-y-6">
          <div className="flex items-center justify-between">
            <div />
            <button
              onClick={handleAddDars}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
            >
              + Add DARS
            </button>
          </div>

          {darsDocuments.length === 0 ? (
            <p className="text-gray-500 mt-2">
              No DARS Documents uploaded yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4 mt-4">
              {darsDocuments.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </Tabs.Content>

        {/* CV Documents */}
        <Tabs.Content value="cv" className="space-y-6">
          <div className="flex items-center justify-between">
            <div />
            <button
              onClick={handleAddCV}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
            >
              + Add CV
            </button>
          </div>

          {cvDocuments.length === 0 ? (
            <p className="text-gray-500 mt-2">No CV uploaded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4 mt-4">
              {cvDocuments.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
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

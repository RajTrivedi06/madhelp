import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/MadHelp.png";
import InfiniteMovingCards from "../InfiniteMovingCards";
import { User, ChevronDown, Settings, LogOut } from "lucide-react";

const randomNames = [
  "Alex Johnson|Physics",
  "Maria Gonzalez|Biology",
  "David Smith|Computer Science",
  "Samantha Lee|Mathematics",
  "John Doe|Engineering",
  "Emily Chen|Chemistry",
  "Liam Wright|Astronomy",
  "Olivia Martin|Environmental Science",
  "Noah Brown|Psychology",
  "Emma Wilson|Economics",
  "Grace Turner|Political Science",
  "Ethan Hall|Philosophy",
  "Sophia Carter|Sociology",
  "Daniel Wright|Statistics",
  "Madison Scott|Business",
  "Joshua Adams|History",
  "Isabella Roberts|Linguistics",
  "Benjamin Harris|Finance",
  "Charlotte Evans|Anthropology",
  "Mason Thomas|Physics",
].map((entry) => {
  const [name, faculty] = entry.split("|");
  return {
    content: (
      <div className="p-4 w-64 h-32 text-center flex flex-col justify-center items-center">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <p className="text-sm opacity-80 text-gray-200">{faculty}</p>
      </div>
    ),
  };
});

export default function ExploreOpportunitiesPage() {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = () => {
    // Clear stored JWT tokens
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Close profile dropdown
    setIsProfileOpen(false);
    // Redirect to landing page
    navigate("/", { replace: true });
  };

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-white px-12 py-16 border-4 border-gray-300 shadow-2xl rounded-lg">
      {/* Profile Icon and Dropdown */}
      <div className="absolute top-8 right-8">
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-haspopup="true"
            aria-expanded={isProfileOpen}
          >
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  navigate("/account-setting");
                  setIsProfileOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logo Centered at Top */}
      <img
        src={logo}
        alt="MadHelp Logo"
        className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-auto"
      />

      {/* Shifted Boxes Down */}
      <div className="flex justify-between items-center w-full max-w-7xl mt-40 mb-20">
        {/* Course Search AI Feature */}
        <div className="text-left w-1/2 bg-white p-10 rounded-xl shadow-xl border border-gray-200 transform transition duration-300 hover:scale-105">
          <h2 className="text-4xl font-semibold text-black mb-4">
            Course Search AI
          </h2>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Use AI to find the best courses at UW Madison based on your
            interests and needs.
          </p>
          <button
            onClick={() => navigate("/course-search-ai")}
            className="px-8 py-4 text-lg bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105"
          >
            Start Searching
          </button>
        </div>
      </div>

      {/* Research Assistant Feature with Infinite Moving Cards on the Side */}
      <div className="flex justify-between items-center w-full max-w-7xl">
        {/* Moving Cards Section */}
        <div className="w-2/5 flex items-center">
          <InfiniteMovingCards
            items={randomNames}
            speed={10}
            direction="left"
          />
        </div>

        {/* Research Assistant Feature */}
        <div className="text-left w-1/2 bg-white p-10 rounded-xl shadow-xl border border-gray-200 transform transition duration-300 hover:scale-105">
          <h2 className="text-4xl font-semibold text-black mb-4">
            Research Assistant Opportunities
          </h2>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Find research assistant opportunities based on your academic profile
            and CV.
          </p>
          <button
            onClick={() => navigate("/ra-feature")}
            className="px-8 py-4 text-lg bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105"
          >
            Start Exploring
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate("/")}
        className="mt-16 px-10 py-4 text-lg bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
      >
        Back to Home
      </button>
    </div>
  );
}

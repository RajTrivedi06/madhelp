import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/MadHelp.png";
import InfiniteMovingCards from "../InfiniteMovingCards";

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

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-white px-12 py-16 border-4 border-gray-300 shadow-2xl rounded-lg">
      {/* Logo Centered at Top */}
      <img
        src={logo}
        alt="MadHelp Logo"
        className="absolute top-8 left-1/3 transform -translate-x-1/2 w-90 h-auto"
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

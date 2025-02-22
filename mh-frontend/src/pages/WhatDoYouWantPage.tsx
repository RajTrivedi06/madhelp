// src/app/pages/what-do-you-want/WhatDoYouWantPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function WhatDoYouWantPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-6 sm:px-6 md:px-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-8 sm:mb-10 md:mb-12">
        What Do You Want?
      </h1>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate("/ra-feature")}
          className="px-4 py-2 sm:px-6 sm:py-2 text-base sm:text-lg bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
        >
          RA Feature
        </button>
        <button
          onClick={() => navigate("/course-search-ai")}
          className="px-4 py-2 sm:px-6 sm:py-2 text-base sm:text-lg bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700"
        >
          Course Search AI
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 sm:px-6 sm:py-2 text-base sm:text-lg bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

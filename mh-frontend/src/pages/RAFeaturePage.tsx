// src/app/pages/landing-page/RAFeaturePage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function RAFeaturePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-6 sm:px-6 md:px-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-8 sm:mb-10 md:mb-12">
        Research Assistant Feature
      </h1>
      <p className="text-sm sm:text-base md:text-lg text-gray-700 text-center max-w-full sm:max-w-xl md:max-w-2xl mb-6 sm:mb-8">
        This page will help you find research assistant opportunities based on
        your academic profile and CV. Feature coming soon!
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate("/what-do-you-want")}
          className="px-4 py-2 sm:px-6 sm:py-2 text-base sm:text-lg bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700"
        >
          Back
        </button>
      </div>
    </div>
  );
}

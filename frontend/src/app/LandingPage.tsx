import React from "react";
import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800">MadHelp</h1>
        <p className="text-lg text-gray-600">
          A UW Madison Course and Research Helper
        </p>
      </header>

      {/* About Section */}
      <section className="max-w-2xl text-center mb-8">
        <p className="text-gray-700 text-lg">
          MadHelp is a platform that helps students find research opportunities
          by analyzing their academic report and CV. Our goal is to streamline
          the process of connecting students with professors and projects that
          match their skills and interests.
        </p>
      </section>

      {/* Buttons */}
      <div className="flex gap-4">
        <Link href="/login">
          <button className="px-6 py-2 text-lg bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
            Login
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-6 py-2 text-lg bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;

// src/pages/CourseSearchAIPage.tsx
//current edit
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";

interface Course {
  "Course Title": string;
  Credits: string;
  Description: string;
  Requisites: string;
  "Learning Outcomes": string;
  "Repeatable for Credit": string;
  "Last Taught": string;
  "Course Designation": string;
}

export default function CourseSearchAIPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/courses.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = Papa.parse<Course>(csv, {
          header: true,
          skipEmptyLines: true,
        });
        setCourses(parsed.data);
      })
      .catch((err) => console.error("Failed to load CSV:", err));
  }, []);

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "")
      .trim();

  const filteredCourses = courses.filter((course) =>
    normalize(course["Course Title"] || "").includes(normalize(searchQuery))
  );

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 md:px-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
        Course Search AI
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Explore available courses at UW–Madison.
      </p>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto mb-10">
        <input
          type="text"
          placeholder="Search courses by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Course Title Badges */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course, i) => (
          <Dialog.Root
            key={i}
            open={selectedCourse === course}
            onOpenChange={(open) => setSelectedCourse(open ? course : null)}
          >
            <Dialog.Trigger asChild>
              <div className="group flex items-center justify-center p-6 border border-gray-300 rounded-xl shadow-sm hover:shadow-md bg-white cursor-pointer transition-all hover:border-red-500">
                <h2 className="text-sm sm:text-base font-semibold transition-colors duration-200 text-black group-hover:text-red-600 text-center">
                  {course["Course Title"]}
                </h2>
              </div>
            </Dialog.Trigger>

            {/* Modal Content */}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 w-full max-w-lg bg-white rounded-xl p-6 transform -translate-x-1/2 -translate-y-1/2 shadow-xl max-h-[90vh] overflow-y-auto">
                <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                  {course["Course Title"]}
                </Dialog.Title>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Credits:</strong> {course.Credits}
                  </p>
                  <p>
                    <strong>Description:</strong> {course.Description || "N/A"}
                  </p>
                  {course.Requisites && (
                    <p>
                      <strong>Requisites:</strong> {course.Requisites}
                    </p>
                  )}
                  {course["Learning Outcomes"] && (
                    <p>
                      <strong>Learning Outcomes:</strong>{" "}
                      {course["Learning Outcomes"]}
                    </p>
                  )}
                  {course["Repeatable for Credit"] && (
                    <p>
                      <strong>Repeatable for Credit:</strong>{" "}
                      {course["Repeatable for Credit"]}
                    </p>
                  )}
                  {course["Last Taught"] && (
                    <p>
                      <strong>Last Taught:</strong> {course["Last Taught"]}
                    </p>
                  )}
                  {course["Course Designation"] && (
                    <p>
                      <strong>Course Designation:</strong>{" "}
                      {course["Course Designation"]}
                    </p>
                  )}
                </div>
                <Dialog.Close asChild>
                  <button className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Close
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ))}
      </div>

      {/* Back Button */}
      <div className="mt-12 text-center">
        <button
          onClick={() => navigate("/what-do-you-want")}
          className="px-6 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-800"
        >
          Back
        </button>
      </div>
    </div>
  );
}

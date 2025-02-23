import React, { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// Import the JSON data file
import jsonData from "./csvjson.json";

interface Faculty {
  Name: string;
  Email: string;
  Faculty: string;
  "Summary of Research": string;
  "Fields of Research": string;
  "Link to Page": string;
}

const RAFeaturePage: React.FC = () => {
  const [facultyData, setFacultyData] = useState<Faculty[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<Faculty[]>([]);
  const [selectedResearchFields, setSelectedResearchFields] = useState<
    string[]
  >([]);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Since the JSON file is imported, we can load it directly
    if (jsonData && jsonData.length > 0) {
      setFacultyData(jsonData);
      setFilteredProfessors(jsonData);
    } else {
      setError("No data found in JSON.");
    }
    setLoading(false);
  }, []);

  // Create a unique list of research fields by splitting the comma-separated string for each professor
  const researchFieldsOptions = Array.from(
    new Set(
      facultyData.flatMap((prof) =>
        prof["Fields of Research"]
          .split(",")
          .map((field) => field.trim())
          .filter(Boolean)
      )
    )
  );

  const filteredDropdownOptions = researchFieldsOptions.filter((field) =>
    field.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setSelectedResearchFields((prev) => {
      if (checked) {
        return prev.includes(field) ? prev : [...prev, field];
      } else {
        return prev.filter((f) => f !== field);
      }
    });
  };

  const removeBadge = (field: string) => {
    setSelectedResearchFields((prev) => prev.filter((f) => f !== field));
  };

  const handleMatchMe = () => {
    if (selectedResearchFields.length === 0) {
      setFilteredProfessors(facultyData);
    } else {
      // Filter professors whose research fields (after splitting) include any selected field
      const filtered = facultyData.filter((prof) =>
        prof["Fields of Research"]
          .split(",")
          .map((field) => field.trim())
          .some((field) => selectedResearchFields.includes(field))
      );
      setFilteredProfessors(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="w-full flex justify-between items-center px-8 py-4 shadow-sm bg-white">
        <h1 className="text-2xl font-bold">Course Search AI</h1>
        <button className="text-red-500 font-medium hover:underline">
          Sign Out
        </button>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="bg-gray-200 px-4 py-2 rounded">
                Select Research Field
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white shadow-md rounded p-2">
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Search interests..."
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredDropdownOptions.map((field) => (
                      <DropdownMenu.CheckboxItem
                        key={field}
                        className="px-2 py-1 cursor-pointer hover:bg-gray-100 flex items-center"
                        checked={selectedResearchFields.includes(field)}
                        onCheckedChange={(checked: boolean) =>
                          handleCheckboxChange(field, checked)
                        }
                      >
                        {field}
                      </DropdownMenu.CheckboxItem>
                    ))}
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
          <button
            onClick={handleMatchMe}
            className="bg-red-500 text-white font-bold px-6 py-2 rounded hover:bg-red-600"
          >
            MATCH ME
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {selectedResearchFields.map((field) => (
            <div
              key={field}
              className="bg-red-500 text-white rounded-full px-3 py-1 flex items-center"
            >
              {field}
              <button
                onClick={() => removeBadge(field)}
                className="ml-2 text-white font-bold"
                aria-label={`Remove ${field}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProfessors.map((prof, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 flex flex-col items-start"
              >
                <h2 className="font-bold text-lg mb-1">{prof.Name}</h2>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Department:</strong> {prof.Faculty}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Research Fields:</strong> {prof["Fields of Research"]}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Email:</strong> {prof.Email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Description:</strong> {prof["Summary of Research"]}
                </p>
                <a
                  href={prof["Link to Page"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline mt-2"
                >
                  Visit Profile
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default RAFeaturePage;

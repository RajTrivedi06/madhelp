import React, { useState, useEffect } from "react";
import jsonData from "./csvjson.json";
import { Badge } from "@radix-ui/themes";
import { Flex } from "@radix-ui/themes";
import { Plus } from "lucide-react";
import { XIcon } from "lucide-react";

// Import drawer components and Button from your UI library
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@radix-ui/themes";
import { CopyIcon } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for drawer and selected professor
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Faculty | null>(
    null
  );
  const [emailTemplate, setEmailTemplate] = useState<string>(
    "Dear Professor,\n\nI am very interested in your research. Could you please provide more details?\n\nBest regards,"
  );

  useEffect(() => {
    if (jsonData && jsonData.length > 0) {
      setFacultyData(jsonData);
    } else {
      setError("No data found in JSON.");
    }
    setLoading(false);
  }, []);

  // When a professor is selected, open the drawer
  const handleMoreInfo = (prof: Faculty) => {
    setSelectedProfessor(prof);
    setDrawerOpen(true);
    // Optionally, customize the email template based on the professor
    setEmailTemplate(
      `Dear prof. ${prof.Name},\n\nI am very interested in your research on ${prof["Fields of Research"]}. Could you please provide more details?\n\nBest regards,`
    );
  };

  // Copy the email template to the clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(emailTemplate).then(() => {
      alert("Email template copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="w-full flex justify-between items-center px-8 py-4 shadow-sm bg-white">
        <h1 className="text-2xl font-bold">RA Feature</h1>
        <button className="text-red-500 font-medium hover:underline">
          Sign Out
        </button>
      </header>

      <main className="flex-1 container mx-auto p-4">
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {facultyData.map((prof, index) => {
              const departments = prof.Faculty.split(";").map((dept) =>
                dept.trim()
              );
              return (
                <div
                  key={index}
                  className="relative border border-gray-200 rounded-lg p-4 flex flex-col items-start transition-all duration-200 hover:shadow-lg hover:border-red-300 hover:scale-[1.02] cursor-pointer group"
                >
                  <h2 className="font-bold text-lg mb-1 group-hover:text-red-600 transition-colors">
                    {prof.Name}
                  </h2>
                  <Flex className="flex flex-wrap gap-2">
                    {departments.map((dept, i) => (
                      <Badge
                        key={i}
                        color="red"
                        className="whitespace-normal break-words rounded-full py-1 px-3 text-sm group-hover:bg-red-100 transition-colors"
                      >
                        {dept}
                      </Badge>
                    ))}
                  </Flex>
                  {/* More Info button at bottom right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoreInfo(prof);
                    }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    aria-label="More Info"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Drawer for More Info */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSelectedProfessor(null);
        }}
      >
        <DrawerTrigger asChild>
          {/* This trigger is not used since we're opening the drawer from the card */}
          <div />
        </DrawerTrigger>
        <DrawerContent>
          <div className="flex h-full">
            {/* Left half: Professor Details */}
            <div className="w-1/2 p-4 border-r border-gray-200 overflow-y-auto">
              {selectedProfessor && (
                <>
                  <DrawerHeader>
                    <DrawerTitle>{selectedProfessor.Name}</DrawerTitle>
                    <DrawerDescription>Faculty Information</DrawerDescription>
                  </DrawerHeader>
                  <div className="mt-4 space-y-2">
                    <p>
                      <strong>Email:</strong> {selectedProfessor.Email}
                    </p>
                    <p>
                      <strong>Departments:</strong> {selectedProfessor.Faculty}
                    </p>
                    <p>
                      <strong>Summary:</strong>{" "}
                      {selectedProfessor["Summary of Research"]}
                    </p>
                    <p>
                      <strong>Fields of Research:</strong>{" "}
                      {selectedProfessor["Fields of Research"]}
                    </p>
                    <p>
                      <strong>Link:</strong>{" "}
                      <a
                        href={selectedProfessor["Link to Page"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        Visit Page
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>
            {/* Right half: Email Template */}
            <div className="w-1/2 p-4 flex flex-col">
              <DrawerHeader>
                <DrawerTitle>Email Template</DrawerTitle>
                <DrawerDescription>
                  Customize your message below
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex-1 mt-4">
                <textarea
                  className="w-full h-full p-2 border border-gray-300 rounded-md resize-none"
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={handleCopy} variant="outline">
                  <CopyIcon className="mr-2" />
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">
                    <XIcon className="mr-2" />
                  </Button>
                </DrawerClose>
              </div>
            </div>
          </div>
          <DrawerFooter />
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default RAFeaturePage;

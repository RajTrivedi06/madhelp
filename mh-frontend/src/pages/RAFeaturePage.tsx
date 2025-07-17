import React, { useEffect, useState } from "react";
import { authGet } from "@/lib/api";
import { Badge, Flex, Button } from "@radix-ui/themes";
import { Plus, X as XIcon, Copy as CopyIcon } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";

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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Faculty | null>(
    null
  );
  const [emailTemplate, setEmailTemplate] = useState(
    "Dear Professor,\n\nI am very interested in your research. Could you please provide more details?\n\nBest regards,"
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await authGet<Faculty[]>("/api/faculty");
        setFacultyData(data);
      } catch (e: unknown) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMoreInfo = (prof: Faculty) => {
    setSelectedProfessor(prof);
    setDrawerOpen(true);
    setEmailTemplate(
      `Dear Prof. ${prof.Name},\n\nI am very interested in your research on ${prof["Fields of Research"]}. Could you please provide more details?\n\nBest regards,`
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-gray-900">
      <header className="w-full flex justify-between items-center px-8 py-4 shadow-sm">
        <h1 className="text-2xl font-bold">RA Feature</h1>
        <button className="text-red-600 hover:underline">Sign Out</button>
      </header>

      <main className="flex-1 container mx-auto p-4">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {facultyData.map((prof, idx) => {
              const depts = prof.Faculty.split(";").map((d) => d.trim());
              return (
                <div
                  key={idx}
                  className="relative border rounded-lg p-4 hover:shadow-lg transition cursor-pointer group"
                >
                  <h2 className="font-bold text-lg mb-1 group-hover:text-red-600">
                    {prof.Name}
                  </h2>
                  <Flex wrap="wrap" gap="1">
                    {depts.map((d, i) => (
                      <Badge key={i} color="red">
                        {d}
                      </Badge>
                    ))}
                  </Flex>

                  <button
                    className="absolute bottom-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600"
                    onClick={() => handleMoreInfo(prof)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(o) => !o && setSelectedProfessor(null)}
      >
        <DrawerContent className="flex h-[75vh]">
          {/* Left */}
          <div className="w-1/2 p-4 border-r overflow-y-auto">
            {selectedProfessor && (
              <>
                <DrawerHeader>
                  <DrawerTitle>{selectedProfessor.Name}</DrawerTitle>
                  <DrawerDescription>Faculty Information</DrawerDescription>
                </DrawerHeader>
                <div className="space-y-2">
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
                    <strong>Fields:</strong>{" "}
                    {selectedProfessor["Fields of Research"]}
                  </p>
                  <p>
                    <strong>Link:</strong>{" "}
                    <a
                      href={selectedProfessor["Link to Page"]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      Visit Page
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right */}
          <div className="w-1/2 p-4 flex flex-col">
            <DrawerHeader>
              <DrawerTitle>Email Template</DrawerTitle>
            </DrawerHeader>

            <textarea
              value={emailTemplate}
              onChange={(e) => setEmailTemplate(e.target.value)}
              className="flex-1 w-full border rounded p-2 resize-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button
                onClick={() => navigator.clipboard.writeText(emailTemplate)}
              >
                <CopyIcon className="mr-1" /> Copy
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">
                  <XIcon className="mr-1" /> Close
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default RAFeaturePage;

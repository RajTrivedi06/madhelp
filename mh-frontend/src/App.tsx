import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

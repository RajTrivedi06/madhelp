// router.tsx
import React from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import AuthenticateRouters from "./AuthenticateRouters";
import NonAuthenticatedRouters from "./NonAuthenticatedRouters";

// Import all page components from the correct path
import LandingPage from "../pages/LandingPage";
import WhatDoYouWantPage from "../pages/WhatDoYouWantPage";
import RAFeaturePage from "../pages/RAFeaturePage";
import CourseSearchAIPage from "../pages/CourseSearchAIPage";
import AccountSettingsPage from "../pages/AccountSettingsPage";

// Use Outlet from react-router-dom instead of a custom App component
const App = () => {
  return <Outlet />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <NonAuthenticatedRouters />,
        children: [
          { index: true, element: <LandingPage /> },
          // any other public marketing pages…
        ],
      },
      {
        element: <AuthenticateRouters />,
        children: [
          { path: "what-do-you-want", element: <WhatDoYouWantPage /> },
          { path: "ra-feature", element: <RAFeaturePage /> },
          { path: "course-search-ai", element: <CourseSearchAIPage /> },
          { path: "account-setting", element: <AccountSettingsPage /> },
        ],
      },
    ],
  },
]);

export default router;

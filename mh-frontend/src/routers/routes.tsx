import React from "react";
import { createBrowserRouter } from "react-router-dom";
import AuthenticateRouters from "./AuthenticateRouters";
import NonAuthenticatedRouters from "./NonAuthenticatedRouters";

// Import all page components
import LandingPage from "../pages/LandingPage";
import WhatDoYouWantPage from "../pages/WhatDoYouWantPage";
import AccountSettingsPage from "../pages/AccountSettingsPage";
import RAFeaturePage from "../pages/RAFeaturePage";
import CourseSearchAIPage from "../pages/CourseSearchAIPage";

// Import your page components here
// import LandingPage from "../pages/LandingPage";
// import DashboardPage from "../pages/DashboardPage";
// etc...

const router = createBrowserRouter([
  {
    element: <NonAuthenticatedRouters />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      // Add other public routes here
    ],
  },
  {
    element: <AuthenticateRouters />,
    children: [
      {
        path: "/what-do-you-want",
        element: <WhatDoYouWantPage />,
      },
      {
        path: "/account-setting",
        element: <AccountSettingsPage />,
      },
      {
        path: "/ra-feature",
        element: <RAFeaturePage />,
      },
      {
        path: "/course-search-ai",
        element: <CourseSearchAIPage />,
      },
      // Add other protected routes here
    ],
  },
]);

export default router;

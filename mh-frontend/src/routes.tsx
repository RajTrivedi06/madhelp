import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LandingPage from "./pages/LandingPage";
import WhatDoYouWantPage from "./pages/WhatDoYouWantPage";
import RAFeaturePage from "./pages/RAFeaturePage";
import CourseSearchAIPage from "./pages/CourseSearchAIPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "what-do-you-want",
        element: <WhatDoYouWantPage />,
        children: [
          {
            index: true,
            element: <div>Please select an option</div>,
          },
          {
            path: "ra-feature",
            element: <RAFeaturePage />,
          },
          {
            path: "course-search-ai",
            element: <CourseSearchAIPage />,
          },
        ],
      },
    ],
  },
]);

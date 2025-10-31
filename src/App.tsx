import { Suspense, useEffect } from "react";
import { useRoutes, Routes, Route, useLocation } from "react-router-dom";
import Home from "./components/home";
import SessionCompletePage from "./components/SessionCompletePage";
import routes from "tempo-routes";

function App() {
  const location = useLocation();
  
  // Update theme-color meta tag and HTML class based on current route
  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const htmlElement = document.documentElement;
    
    // Remove all route-specific classes
    htmlElement.classList.remove('home-route', 'complete-route');
    
    if (location.pathname === "/") {
      // Set dark theme for home page
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", "#171717"); // neutral-900
      }
      htmlElement.classList.add('home-route');
      htmlElement.style.backgroundColor = "#171717";
    } else if (location.pathname === "/complete") {
      // Set light theme for session complete page
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", "#fafaf9"); // stone-50
      }
      htmlElement.classList.add('complete-route');
      htmlElement.style.backgroundColor = "#fafaf9";
    }
  }, [location.pathname]);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/complete" element={<SessionCompletePage />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
import { Navigate, useLocation } from "react-router-dom";
import { buildLegacyAdminRedirectTarget } from "./app/legacy-admin-paths";

export default function App() {
  const location = useLocation();
  const targetPath = buildLegacyAdminRedirectTarget(
    location.pathname,
    location.search,
    location.hash,
  );

  return <Navigate to={targetPath} replace />;
}

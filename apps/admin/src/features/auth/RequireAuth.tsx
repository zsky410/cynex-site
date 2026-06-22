import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LOGIN_PATH } from "../../config";
import { getStoredToken } from "../../lib/auth-storage";

export function RequireAuth() {
  const location = useLocation();

  if (!getStoredToken()) {
    return (
      <Navigate
        to={LOGIN_PATH}
        replace
        state={{ redirectTo: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

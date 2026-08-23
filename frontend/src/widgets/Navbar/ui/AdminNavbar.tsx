import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { adminRoutes } from "@/app/router/routes/admin";
import { AUTH_BYPASSED, useLogoutMutation } from "@/features/auth";
import { Button } from "@/shared/ui";

import { NavItem } from "../model";

import { BottomNavItem, Navbar } from "./Navbar";

// Derived from the route table so adding an admin route lights up the nav.
const NAV_ITEMS: NavItem[] = adminRoutes.map(({ path, label, icon }) => ({
  label,
  icon,
  path: `/${path}`,
}));

/* The admin shell's navbar: same chrome as the public one, different items and
   a logout in place of About/Settings. */
export const AdminNavbar = () => {
  const navigate = useNavigate();
  const { mutate: logout, isPending: loggingOut } = useLogoutMutation();

  /* Navigate regardless of the result: if the call failed because the session
     was already gone, the right place is still the login screen. */
  const handleLogout = () => {
    if (loggingOut) return;
    logout(undefined, {
      onSettled: () => navigate("/admin/login", { replace: true }),
    });
  };

  /* Nothing to log out of when the session was never there: under dev:noauth the
     button would only clear the auth cache and drop you on a login screen the
     guard no longer sends anyone to. */
  if (AUTH_BYPASSED) return <Navbar items={NAV_ITEMS} />;

  return (
    <Navbar
      items={NAV_ITEMS}
      actions={
        <Button
          onClick={handleLogout}
          variant="navInactive"
          size="sm"
          icon={<LogOut />}
          className="rounded-full"
          aria-label="Выйти"
        />
      }
      bottomTrailing={
        <BottomNavItem label="Выйти" icon={<LogOut />} onClick={handleLogout} />
      }
    />
  );
};

import { useEffect, useState } from "react";
import { IS_PUBLIC } from "../lib/site-edition.js";

export default function SignOutButton() {
  const [account, setAccount] = useState(null);
  useEffect(() => {
    if (IS_PUBLIC) return undefined;
    const controller = new AbortController();
    fetch("/auth/me", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((details) => {
        if (!controller.signal.aborted && details?.mode === "supabase" && details.user) {
          setAccount({ isAdmin: details.user.role === "admin" });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (IS_PUBLIC) return null;
  return <div className="internal-account-actions no-print">
    {account && <nav className="internal-account-links" aria-label="Account">
      {account.isAdmin && <a href="/admin/users">Manage users</a>}
      <a href="/account/password">Change password</a>
    </nav>}
    <form action="/auth/logout" method="post" className="internal-signout">
      <button type="submit">Sign out</button>
    </form>
  </div>;
}

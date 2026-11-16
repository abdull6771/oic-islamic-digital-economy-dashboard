export default function SignOutButton() {
  return <form action="/auth/logout" method="post" className="internal-signout no-print">
    <button type="submit">Sign out</button>
  </form>;
}

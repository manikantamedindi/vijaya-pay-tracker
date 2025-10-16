import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to login as the main page
  redirect("/login")
}

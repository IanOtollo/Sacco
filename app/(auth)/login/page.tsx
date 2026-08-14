import { redirect } from "next/navigation";

// The sign-in form now lives inline on the landing page (split-screen
// layout), so this route just forwards there.
export default function LoginPage() {
  redirect("/");
}

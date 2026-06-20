import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function page() {
  return (
    <div className="w-full flex flex-col h-screen justify-center items-center">
      <Button variant="default" asChild>
        <Link href="/login">Login</Link>
      </Button>
    </div>
  );
}

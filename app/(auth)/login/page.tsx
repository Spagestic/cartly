import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              alt="Logo"
              className="size-8 pixel-crisp"
              height={40}
              src="/cartly_logo.png"
              width={40}
            />
            <span className="font-bold -ml-2">Cartly</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
        {/* <Image
          src="/bg.png"
          alt="Background Image"
          fill
          className="object-cover"
        /> */}
      </div>
    </div>
  );
}

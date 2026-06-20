import Link from "next/link";
import NextImage from "next/image";

export function ChatSidebarHeader() {
  return (
    <Link
      href="/chat"
      className="flex items-center gap-0 pl-0 text-xl font-medium tracking-tighter"
    >
      <NextImage
        alt="Logo"
        className="pixel-crisp size-8 dark:invert"
        height={40}
        src="/cartly_logo.png"
        width={40}
      />
      <h1 className="leading-none">Cartly</h1>
    </Link>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SHELL } from "@/components/shell";
import { CaseHeader } from "@/components/CaseHeader";
import { SadTv } from "@/components/face/SadTv";

export const metadata: Metadata = {
  title: "404 — nothing on this channel · a.barchenko",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper theme-fade">
      <CaseHeader progress={false} />
      <main className={`${SHELL} flex flex-1 flex-col items-center justify-center pb-20 text-center`}>
        <SadTv />

        <Link href="/" className="group mt-10 inline-flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/projects/arrow.svg" alt="" className="h-[34px] w-[26px]" aria-hidden />
          <span className="font-serif text-[32px] italic text-accent transition-opacity group-hover:opacity-70">
            Take me home
          </span>
        </Link>
      </main>
    </div>
  );
}

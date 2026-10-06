/* Shared page gutter — matches every section's content column. Lives in a
   plain (non-"use client") module so server components get the real string:
   imported from a client module it arrives as a client-reference stub, which
   breaks as soon as it's interpolated into a class list. */
export const SHELL = "mx-auto w-full max-w-[1240px] px-6 sm:px-10 lg:px-14";

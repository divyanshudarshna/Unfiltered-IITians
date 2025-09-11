// lib/PatchedLink.tsx
"use client";

import NextLink, { LinkProps } from "next/link";
import { startProgress } from "@/lib/progressBus";
import { MouseEvent, ReactNode } from "react";

interface PatchedLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export default function PatchedLink({
  children,
  onClick,
  ...props
}: PatchedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    startProgress(); // 🚀 show progress immediately
    if (onClick) onClick(e);
  };

  return (
    <NextLink {...props} onClick={handleClick}>
      {children}
    </NextLink>
  );
}

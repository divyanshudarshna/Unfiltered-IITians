"use client";

import NextLink, { LinkProps } from "next/link";
import { startProgress } from "@/lib/progressBus";
import { MouseEvent, ReactNode } from "react";

interface PatchedLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  external?: boolean; // optional flag for external links
}

export default function PatchedLink({
  children,
  onClick,
  external = false,
  ...props
}: PatchedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    startProgress();
    if (onClick) onClick(e);
  };

  // External links should render <a> to avoid client-side routing
  if (external || typeof props.href === "string" && props.href.startsWith("http")) {
    return (
      <a {...props} onClick={handleClick}>
        {children}
      </a>
    );
  }

  // Internal links use Next.js Link
  return (
    <NextLink {...props} onClick={handleClick}>
      {children}
    </NextLink>
  );
}

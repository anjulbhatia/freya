"use client";

import Gmail from "@thesvg/react/gmail";
import GoogleCalendar from "@thesvg/react/google-calendar";
import Notion from "@thesvg/react/notion";
import Slack from "@thesvg/react/slack";
import Github from "@thesvg/react/github";
import { cn } from "cn";
import type { ProviderId } from "@/lib/freya";

const MAP = {
  gmail: Gmail,
  calendar: GoogleCalendar,
  notion: Notion,
  slack: Slack,
  github: Github,
} as const;

export function ProviderIcon({
  provider,
  className,
}: {
  provider: ProviderId;
  className?: string;
}) {
  const Icon = MAP[provider];

  if (provider === "notion") {
    return (
      <Notion
        variant={"mono"}
        className={cn(
          "size-4 shrink-0",
          className
        )}
        aria-hidden
      />
    );
  }
  return (
    <Icon
      className={cn(
        "size-4 shrink-0",
        (provider === "github") && "dark:invert",
        className
      )}
      aria-hidden
    />
  );
}

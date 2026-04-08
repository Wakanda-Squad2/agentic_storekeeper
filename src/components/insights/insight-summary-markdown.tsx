"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const components: Components = {
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-foreground last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 ps-5 text-sm text-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 ps-5 text-sm text-foreground">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed [&>ul]:mt-2 [&>ol]:mt-2">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-1 mt-2 text-sm font-semibold text-foreground first:mt-0">{children}</h5>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-90"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-border" />,
  blockquote: ({ children }) => (
    <blockquote className="border-border text-muted-foreground my-2 border-s-2 ps-3 text-sm italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => (
    <code
      className={cn(
        "rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted text-foreground my-2 overflow-x-auto rounded-md p-3 text-xs">{children}</pre>
  ),
};

type Props = {
  /** Markdown from the insight / chat agent (summaries, invoice breakdowns, etc.). */
  children: string;
  className?: string;
};

export function InsightSummaryMarkdown({ children, className }: Props) {
  if (!children.trim()) {
    return null;
  }
  return (
    <div className={cn("min-w-0 text-sm", className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}

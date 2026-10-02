"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  BotIcon,
  Bug01Icon,
  CalendarPlus01Icon,
  Tick01Icon,
  Copy01Icon,
  File01Icon,
  FileUploadIcon,
  LayoutTemplateIcon,
  LightbulbIcon,
  Mic01Icon,
  PlusSignIcon,
  SendIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
} from "@/components/ui/message-scroller";
import { ProviderIcon } from "@/lib/app-icons";
import {
  PROVIDERS,
  type KanbanCard,
  type CardType,
  type ProviderId,
} from "@/lib/freya";
import { getConnections } from "@/lib/store";

interface Props {
  onCreate: (c: KanbanCard) => void;
}

interface Entry {
  id: string;
  role: "user" | "agent";
  text: string;
  type?: CardType;
  files?: string[];
  time: string;
}

interface StagedFile {
  id: string;
  name: string;
  size: string;
}

const QUICK: { icon: IconSvgElement; label: string; insert: string }[] = [
  { icon: CalendarPlus01Icon, label: "Meeting", insert: "Call Sam on Wednesday about " },
  { icon: Bug01Icon, label: "Bug", insert: "Fix bug on PR #3122: " },
  { icon: SendIcon, label: "Task", insert: "Send proposal to Acme by Friday: " },
  { icon: LightbulbIcon, label: "Idea", insert: "Idea: " },
];

const TYPE_ICON: Record<CardType, IconSvgElement> = {
  meeting: CalendarPlus01Icon,
  bug: Bug01Icon,
  task: SendIcon,
  "follow-up": SendIcon,
  idea: LightbulbIcon,
};

const MAX_LEN = 2000;

function classify(title: string): CardType {
  const t = title.toLowerCase();
  if (t.startsWith("idea:")) return "idea";
  if (t.includes("call") || t.includes("meet")) return "meeting";
  if (t.includes("fix") || t.includes("bug") || t.includes("pr #")) return "bug";
  if (t.includes("send") || t.includes("follow")) return "follow-up";
  return "task";
}

function now(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatPanel({ onCreate }: Props) {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [thinking, setThinking] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [connected, setConnected] = useState<ProviderId[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = getConnections();
    const on = PROVIDERS.map((p) => p.id).filter((id) => saved[id]);
    setConnected(on.length > 0 ? on : PROVIDERS.map((p) => p.id));
  }, []);

  const canSend = (input.trim().length > 0 || staged.length > 0) && !thinking;

  function submit(raw?: string) {
    const title = (raw ?? input).trim();
    if ((!title && staged.length === 0) || thinking) return;
    const type = classify(title || staged.map((f) => f.name).join(", "));
    const files = staged.map((f) => f.name);
    onCreate({
      id: crypto.randomUUID(),
      title: title || `Attachments: ${files.join(", ")}`,
      type,
      column: "planned",
    });
    setEntries((e) => [
      ...e,
      { id: crypto.randomUUID(), role: "user", text: title, files, time: now() },
    ]);
    setInput("");
    setStaged([]);
    setTemplatesOpen(false);
    setThinking(true);
    window.setTimeout(() => {
      setEntries((e) => [
        ...e,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: `Classified as ${type} and queued in Planned${
            files.length > 0 ? ` with ${files.length} attachment${files.length > 1 ? "s" : ""}` : ""
          }. Process it from the board when ready.`,
          type,
          time: now(),
        },
      ]);
      setThinking(false);
    }, 600);
  }

  function copy(id: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1200);
  }

  function stageFiles(list: FileList | null) {
    if (!list) return;
    const next: StagedFile[] = Array.from(list)
      .slice(0, 5)
      .map((f) => ({ id: crypto.randomUUID(), name: f.name, size: fmtSize(f.size) }));
    setStaged((s) => [...s, ...next].slice(0, 5));
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="min-h-0 flex-1">
        <MessageScrollerProvider>
          <MessageScroller>
            <MessageScrollerViewport className="fc-scroll overflow-y-scroll">
              <MessageScrollerContent className="gap-4 px-1 py-1">
                {entries.length === 0 && !thinking && (
                  <Empty className="border-0">
                    <EmptyHeader>
                      <div className="mb-2 flex items-center justify-center">
                        {connected.map((id, i) => (
                          <span
                            key={id}
                            title={PROVIDERS.find((p) => p.id === id)?.label ?? id}
                            className="flex size-9 items-center justify-center rounded-full bg-surface-raised shadow-(--surface-shadow) ring-1 ring-surface-border"
                            style={{ marginLeft: i === 0 ? 0 : -8, zIndex: connected.length - i }}
                          >
                            <ProviderIcon provider={id} className="size-5" />
                          </span>
                        ))}
                      </div>
                      <EmptyTitle>Capture anything</EmptyTitle>
                      <EmptyDescription>
                        Type work like you think it. Freya classifies
                        and queues it as a card.
                      </EmptyDescription>
                    </EmptyHeader>
                    <div className="flex max-w-sm flex-wrap justify-center gap-1.5">
                      {QUICK.map((q) => (
                        <Button
                          key={q.label}
                          variant="outline"
                          size="xs"
                          onClick={() => submit(q.insert.trimEnd())}
                        >
                          <HugeiconsIcon icon={q.icon} strokeWidth={2} />
                          {q.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-micro text-muted-foreground">
                      Try: “Call Sam on Wednesday about the pilot”
                    </p>
                  </Empty>
                )}

                {entries.map((m) =>
                  m.role === "user" ? (
                    <MessageScrollerItem key={m.id}>
                      <Message align="end">
                        <MessageContent>
                          {m.files && m.files.length > 0 && (
                            <div className="flex flex-col items-end gap-1">
                              {m.files.map((f) => (
                                <Badge key={f} variant="outline">
                                  <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
                                  {f}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {m.text && (
                            <Bubble variant="secondary" align="end">
                              <BubbleContent className="rounded-2xl">{m.text}</BubbleContent>
                            </Bubble>
                          )}
                          <MessageFooter>{m.time}</MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ) : (
                    <MessageScrollerItem key={m.id}>
                      <Message align="start">
                        <MessageAvatar className="bg-primary/15 text-primary">
                          <HugeiconsIcon icon={BotIcon} strokeWidth={2} className="size-4" />
                        </MessageAvatar>
                        <MessageContent>
                          <MessageHeader>Freya</MessageHeader>
                          <div className="px-2.5 text-body leading-relaxed">
                            {m.text}
                          </div>
                          <MessageFooter className="gap-1.5 px-0">
                            {m.type &&
                              (() => {
                                const Icon = TYPE_ICON[m.type];
                                return (
                                  <Badge variant="secondary">
                                    <HugeiconsIcon icon={Icon} strokeWidth={2} />
                                    {m.type}
                                  </Badge>
                                );
                              })()}
                            <span>{m.time}</span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => copy(m.id, m.text)}
                              aria-label="Copy reply"
                            >
                              {copied === m.id ? (
                                <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} />
                              ) : (
                                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                              )}
                            </Button>
                          </MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )
                )}

                {thinking && (
                  <MessageScrollerItem>
                    <Message align="start">
                      <MessageAvatar className="bg-primary/15 text-primary">
                        <HugeiconsIcon icon={BotIcon} strokeWidth={2} className="size-4" />
                      </MessageAvatar>
                      <MessageContent>
                        <div className="flex items-center gap-2 px-2.5 py-1 text-caption text-muted-foreground">
                          <Spinner />
                          Classifying…
                        </div>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {templatesOpen && (
        <div className="grid grid-cols-2 gap-1">
          {QUICK.map((q) => (
            <Button
              key={q.label}
              variant="outline"
              size="xs"
              className="justify-start"
              onClick={() => {
                setInput(q.insert);
                setTemplatesOpen(false);
              }}
            >
              <HugeiconsIcon icon={q.icon} strokeWidth={2} />
              {q.label}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-surface-raised shadow-(--surface-shadow) ring-1 ring-surface-border transition-all focus-within:shadow-(--floating-shadow) focus-within:ring-2 focus-within:ring-primary/20">
        {staged.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {staged.map((f) => (
                <Attachment key={f.id} size="xs" orientation="horizontal" className="rounded-lg">
                  <AttachmentMedia>
                    <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{f.name}</AttachmentTitle>
                    <AttachmentDescription>{f.size}</AttachmentDescription>
                  </AttachmentContent>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setStaged((s) => s.filter((x) => x.id !== f.id))}
                    aria-label={`Remove ${f.name}`}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                  </Button>
                </Attachment>
              ))}
            </div>
            <Separator className="mt-2" />
          </>
        )}

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="What to do next…"
          rows={1}
          className="fc-scroll max-h-32 min-h-10 resize-none border-0 bg-transparent px-3 pt-2.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />

        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Add">
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                  </Button>
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                  <HugeiconsIcon icon={FileUploadIcon} strokeWidth={2} />
                  Upload file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplatesOpen((v) => !v)}>
                  <HugeiconsIcon icon={LayoutTemplateIcon} strokeWidth={2} />
                  From template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Voice input">
              <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} />
            </Button>
            <Button
              size="icon"
              className="size-8 rounded-full"
              onClick={() => submit()}
              disabled={!canSend}
              aria-label="Send"
            >
              <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            stageFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

    </div>
  );
}

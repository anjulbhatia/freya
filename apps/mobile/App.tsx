import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import "./global.css";
import type { CardType, ProviderId } from "shared/types";

const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "gmail", label: "Gmail" },
  { id: "calendar", label: "Google Calendar" },
  { id: "meet", label: "Google Meet" },
  { id: "notion", label: "Notion" },
  { id: "slack", label: "Slack" },
  { id: "github", label: "GitHub" },
];

const COLUMNS = [
  { id: "planned", label: "Tasks" },
  { id: "ongoing", label: "Running" },
  { id: "completed", label: "Done" },
] as const;

function classify(title: string): CardType {
  const t = title.toLowerCase();
  if (/^idea\s*:/.test(t)) return "idea";
  if (/\b(fix|bug)\b/.test(t) || /pr\s*#\d+/.test(t)) return "bug";
  if (/\b(call|meet|meeting|sync)\b/.test(t)) return "meeting";
  if (/\b(send|follow[\s-]?up|remind|ping)\b/.test(t)) return "follow-up";
  return "task";
}

export default function App() {
  const [input, setInput] = useState("");
  const [queued, setQueued] = useState<{ title: string; type: CardType }[]>([]);

  function capture() {
    const title = input.trim();
    if (!title) return;
    setQueued((q) => [{ title, type: classify(title) }, ...q].slice(0, 20));
    setInput("");
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0b]">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="gap-4 p-5">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-white">freya</Text>
          <Text className="text-sm text-neutral-400">
            Capture anything. The board decides what happens next.
          </Text>
        </View>

        <View className="gap-2 rounded-2xl bg-[#131316] p-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={capture}
            placeholder="Call Bob at 3pm about the pilot…"
            placeholderTextColor="#737373"
            returnKeyType="done"
            className="rounded-xl bg-[#0a0a0b] px-3 py-2.5 text-base text-white"
          />
          <Pressable
            onPress={capture}
            className="items-center rounded-xl bg-[#e8ff3c] py-2.5 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-black">Queue to Planned</Text>
          </Pressable>
        </View>

        {queued.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Queued on this device
            </Text>
            {queued.map((c, i) => (
              <View key={`${c.title}-${i}`} className="gap-0.5 rounded-2xl bg-[#131316] p-3">
                <Text className="text-sm font-medium text-white">{c.title}</Text>
                <Text className="text-xs text-neutral-400">
                  {c.type} · {COLUMNS[0].label}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Integrations
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <View key={p.id} className="rounded-full bg-[#131316] px-3 py-1.5">
                <Text className="text-xs text-neutral-300">{p.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

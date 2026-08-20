export interface MemoryStoryReceipt {
  date: string;
  episode: string;
  id: string;
  note: string;
  seconds: number;
  title: string;
  url: string;
  videoId: string;
}

export interface MemoryStoryChapter {
  accent: "amber" | "blue" | "mint" | "violet";
  changed: string;
  id: string;
  index: string;
  period: string;
  question: string;
  receipts: readonly MemoryStoryReceipt[];
  summary: string;
  title: string;
}

export interface IndustryComparison {
  id: string;
  label: string;
  sourceLabel: string;
  sourceUrl: string;
  text: string;
  title: string;
}

export const memoryStoryChapters: readonly MemoryStoryChapter[] = [
  {
    accent: "amber",
    changed:
      "Memory begins as the answer to restart, recovery, and handoff—not personal recall.",
    id: "state",
    index: "01",
    period: "February · Episode 4",
    question:
      "What state must survive when a group of agents pauses, fails, or hands work to someone else?",
    receipts: [
      {
        date: "Feb 3, 2026",
        episode: "Agentic Mesh · Episode 4",
        id: "agentic-mesh:6JsgiUC7pn0:c67c2d42ccb472ae985dd528",
        note: "Ambient agents add identity, state, and long-running conversations to distributed systems.",
        seconds: 1607,
        title: "The Future of Ambient Agents",
        url: "https://www.youtube.com/watch?v=6JsgiUC7pn0",
        videoId: "6JsgiUC7pn0",
      },
    ],
    summary:
      "The first durable idea is architectural: agents turn short, stateless calls into work that may run for hours. Memory is the shared record that lets the system continue.",
    title: "State becomes architecture",
  },
  {
    accent: "blue",
    changed:
      "The question shifts from “How much can we store?” to “What belongs in working memory now?”",
    id: "context",
    index: "02",
    period: "February · Episode 7",
    question:
      "Who chooses the right page of enterprise knowledge for this moment—and what gets left out?",
    receipts: [
      {
        date: "Feb 3, 2026",
        episode: "Agentic Mesh · Episode 7",
        id: "agentic-mesh:IMsg_GHW8m4:4cb7d6e9c299aea47006af40",
        note: "The context window is framed as scarce; the goal becomes minimum viable context.",
        seconds: 0,
        title: "Navigating the Scarcity of Context in AI",
        url: "https://www.youtube.com/watch?v=IMsg_GHW8m4",
        videoId: "IMsg_GHW8m4",
      },
      {
        date: "Feb 3, 2026",
        episode: "Agentic Mesh · Episode 7",
        id: "agentic-mesh:IMsg_GHW8m4:9b8302eb1e87f9c42280cd86",
        note: "Virtual memory becomes the analogy: page the right enterprise knowledge into a limited context window.",
        seconds: 1119,
        title: "The virtual context manager",
        url: "https://www.youtube.com/watch?v=IMsg_GHW8m4",
        videoId: "IMsg_GHW8m4",
      },
    ],
    summary:
      "A larger context window is not the same as better memory. The emerging thesis is selection: assemble the smallest useful working set from a much larger corpus.",
    title: "Context becomes scarce",
  },
  {
    accent: "violet",
    changed:
      "Memory must carry authority and boundaries—not just semantically similar facts.",
    id: "policy",
    index: "03",
    period: "February · Episode 8",
    question:
      "Can an agent explain which policy shaped its context, who approved it, and whether it was current?",
    receipts: [
      {
        date: "Feb 3, 2026",
        episode: "Agentic Mesh · Episode 8",
        id: "agentic-mesh:TcvU63r8o5k:d6c8df6b91d1f2985ab2acb8",
        note: "Policies and decision boundaries are proposed as first-class context, alongside concepts and tools.",
        seconds: 1,
        title: "Context Engineering: Policies and Boundaries",
        url: "https://www.youtube.com/watch?v=TcvU63r8o5k",
        videoId: "TcvU63r8o5k",
      },
      {
        date: "Feb 3, 2026",
        episode: "Agentic Mesh · Episode 8",
        id: "agentic-mesh:TcvU63r8o5k:ccac6cec56434630d40580d1",
        note: "At enterprise scale, the context assembly process must be repeatable, traceable, and auditable.",
        seconds: 1258,
        title: "Traceable context at agent scale",
        url: "https://www.youtube.com/watch?v=TcvU63r8o5k",
        videoId: "TcvU63r8o5k",
      },
    ],
    summary:
      "Context engineering expands from retrieving nouns and facts to retrieving the rules of the business. The memory system starts to look governed.",
    title: "Context becomes governed",
  },
  {
    accent: "mint",
    changed:
      "Memory expands from prompt assembly into a governed data product with receipts.",
    id: "fabric",
    index: "04",
    period: "March · Episodes 13 & 15",
    question:
      "How do we preserve source credibility as documents become chunks, concepts, summaries, and decisions?",
    receipts: [
      {
        date: "Mar 9, 2026",
        episode: "Agentic Mesh · Episode 13",
        id: "agentic-mesh:1k82nNgnnwI:542c2e6d8d55626baf5fcd94",
        note: "The knowledge fabric joins ingestion, indexing, hybrid retrieval, policies, and token-aware delivery.",
        seconds: 104,
        title: "The Agentic Knowledge Fabric",
        url: "https://www.youtube.com/watch?v=1k82nNgnnwI",
        videoId: "1k82nNgnnwI",
      },
      {
        date: "Mar 23, 2026",
        episode: "Agentic Mesh · Episode 15",
        id: "agentic-mesh:hJoDzOfAJgQ:2bb6986f4c9f17a8c25d8da1",
        note: "Context is described as an engineered product linked by stable identifiers and provenance.",
        seconds: 106,
        title: "Architecture for the Agentic Knowledge Fabric",
        url: "https://www.youtube.com/watch?v=hJoDzOfAJgQ",
        videoId: "hJoDzOfAJgQ",
      },
    ],
    summary:
      "Retrieval is no longer a single search call. It becomes an end-to-end system for producing bounded context with stable identity, provenance, and access back to the source of record.",
    title: "Memory becomes a knowledge fabric",
  },
  {
    accent: "blue",
    changed:
      "Chat history is no longer enough; enterprise memory includes recoverable workflow state.",
    id: "continuity",
    index: "05",
    period: "March · Episode 16",
    question:
      "What is the canonical checkpoint when several agents disagree about where a long-running process stopped?",
    receipts: [
      {
        date: "Mar 30, 2026",
        episode: "Agentic Mesh · Episode 16",
        id: "agentic-mesh:S8sAqVxLULg:31d3962a4fcab9cf35fbf7e8",
        note: "Persisted state enables restart and recovery across agents, people, transactions, and days of work.",
        seconds: 1092,
        title: "The Agent Harness",
        url: "https://www.youtube.com/watch?v=S8sAqVxLULg",
        videoId: "S8sAqVxLULg",
      },
    ],
    summary:
      "The working definition broadens again: memory is the ability to resume a business process safely, not merely to recall what a user typed in one conversation.",
    title: "Memory becomes process continuity",
  },
  {
    accent: "amber",
    changed:
      "The view separates memory by role and makes trust a retrieval constraint.",
    id: "system",
    index: "06",
    period: "April · Episode 19",
    question:
      "How should these layers consolidate, contradict, expire, and remain accountable over time?",
    receipts: [
      {
        date: "Apr 28, 2026",
        episode: "Agentic Mesh · Episode 19",
        id: "agentic-mesh:ZiaOffGBytM:70358eedb5689ef45ff941fc",
        note: "Six layers are named: long-term, working, static, conversational, shared conversational, and episodic.",
        seconds: 99,
        title: "Agent Memory: The Foundation of Agent Architecture",
        url: "https://www.youtube.com/watch?v=ZiaOffGBytM",
        videoId: "ZiaOffGBytM",
      },
      {
        date: "Apr 28, 2026",
        episode: "Agentic Mesh · Episode 19",
        id: "agentic-mesh:ZiaOffGBytM:7f3f0c7860613f260d99a1b5",
        note: "Enterprise memory is tied to agent identity and role-based access—not universal recall.",
        seconds: 1539,
        title: "Identity and access at the memory layer",
        url: "https://www.youtube.com/watch?v=ZiaOffGBytM",
        videoId: "ZiaOffGBytM",
      },
    ],
    summary:
      "The current model is a system of memory systems. Different layers serve reasoning, collaboration, continuity, and experience; identity determines which memories an agent may retrieve.",
    title: "Memory becomes a system of systems",
  },
] as const;

export const industryComparisons: readonly IndustryComparison[] = [
  {
    id: "convergence",
    label: "Convergence",
    sourceLabel: "Karpathy · Software Is Changing (Again) · 10:14",
    sourceUrl: "https://www.youtube.com/watch?v=LCEmiRjPEtQ&t=614s",
    text: "Both views treat the context window as working memory and the LLM as the processor that operates over it.",
    title: "Context has to be programmed",
  },
  {
    id: "extension",
    label: "John's extension",
    sourceLabel: "Agentic Mesh · Episodes 4–19",
    sourceUrl: "https://www.youtube.com/watch?v=ZiaOffGBytM&t=99s",
    text: "The podcast develops the enterprise layer around that working memory: durable state, shared conversations, episodic history, provenance, policy, identity, and recovery.",
    title: "The enterprise needs more than a window",
  },
  {
    id: "gap",
    label: "Unresolved gap",
    sourceLabel: "Karpathy with Dwarkesh Patel · 22:07",
    sourceUrl: "https://www.dwarkesh.com/p/andrej-karpathy",
    text: "External memory can restore context, but it does not by itself give a model continual learning or a human-like process for consolidating experience into changed judgment.",
    title: "Recall is not learning",
  },
] as const;

export const nextMemoryQuestions = [
  "When should an experience change the agent’s working model—and when should it remain only an immutable receipt?",
  "How should contradictory beliefs be related without rewriting the historical record?",
  "What deserves to be forgotten, and what must survive for policy, trust, or accountability?",
  "Which memory belongs to one agent, a collaborating group, the enterprise, or the underlying model?",
  "What evaluation proves that memory improves judgment rather than merely increasing recall?",
] as const;

export const guestMemoryPrompts = [
  {
    label: "Open",
    text: "Tell me about a time an AI system remembered the wrong thing. What failed: storage, retrieval, policy, identity, or judgment?",
  },
  {
    label: "Leading",
    text: "My current view is that enterprise memory is an evidence system with dates and access controls—not a chat log. Where does that view break?",
  },
  {
    label: "Compare",
    text: "Karpathy describes context as working memory and continual learning as missing. Should enterprise systems compensate externally, or is that the wrong layer to solve?",
  },
  {
    label: "Evolve",
    text: "Which experiences should permanently change an agent, and who gets to decide that the change was warranted?",
  },
] as const;

export function timestampedMemoryStoryUrl(
  receipt: MemoryStoryReceipt,
): string {
  const url = new URL(receipt.url);
  url.searchParams.set("t", `${receipt.seconds}s`);
  return url.toString();
}

export function memoryStoryThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

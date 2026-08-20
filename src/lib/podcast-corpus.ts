import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_TRANSCRIPT_CHUNK_CHARACTERS = 1_800;
export const DEFAULT_TRANSCRIPT_OVERLAP_CHARACTERS = 320;

export interface TranscriptFileMetadata {
  baseName: string;
  date: string;
  publishedAt: string;
  speaker: string;
  speakerSlug: string;
  videoId: string;
}

export interface TranscriptSegment {
  startSeconds: number;
  timestamp: string;
  text: string;
}

export interface TranscriptChunk {
  endSeconds: number;
  endTimestamp: string;
  ordinal: number;
  segmentCount: number;
  startSeconds: number;
  startTimestamp: string;
  text: string;
}

export interface PodcastSource {
  title: string;
  url: string;
}

export interface PodcastMemoryDocument {
  memory_id: string;
  memory_type: "transcript_chunk";
  subject_id: string;
  subject: string;
  statement: string;
  context: string;
  people: string[];
  topics: string[];
  status: "ACTIVE";
  is_current: true;
  observed_at: string;
  valid_from: string;
  ingested_at: string;
  source: {
    url: string;
    title: string;
    published_at: string;
    episode_id: string;
    locator: string;
  };
}

export interface BuildPodcastDocumentsOptions {
  ingestedAt: string;
  metadata: TranscriptFileMetadata;
  source: PodcastSource;
  transcript: string;
  chunkCharacters?: number;
  overlapCharacters?: number;
}

const transcriptFilePattern =
  /^(\d{4}-\d{2}-\d{2})_([A-Za-z0-9_-]{11})_([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)\.txt$/;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function displayNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function assertIsoTimestamp(value: string, name: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${name} must be a valid ISO timestamp.`);
  }
}

export function parseTranscriptFileName(
  fileName: string,
): TranscriptFileMetadata {
  const match = transcriptFilePattern.exec(fileName);

  if (!match) {
    throw new Error(
      `Transcript filename must match YYYY-MM-DD_<video-id>_<speaker-slug>.txt: ${fileName}`,
    );
  }

  const [, date, videoId, speakerSlug] = match;
  const publishedAt = `${date}T00:00:00.000Z`;
  const parsedDate = new Date(publishedAt);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`Transcript filename contains an invalid date: ${fileName}`);
  }

  return {
    baseName: fileName.slice(0, -path.extname(fileName).length),
    date,
    publishedAt,
    speaker: displayNameFromSlug(speakerSlug),
    speakerSlug,
    videoId,
  };
}

export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":");

  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error(`Invalid transcript timestamp: ${timestamp}`);
  }

  const values = parts.map((part) => Number(part));

  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error(`Invalid transcript timestamp: ${timestamp}`);
  }

  if (parts.length === 2) {
    const [minutes, seconds] = values;
    if (seconds >= 60) {
      throw new Error(`Invalid transcript timestamp: ${timestamp}`);
    }
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = values;
  if (minutes >= 60 || seconds >= 60) {
    throw new Error(`Invalid transcript timestamp: ${timestamp}`);
  }
  return hours * 3_600 + minutes * 60 + seconds;
}

export function formatTimestamp(totalSeconds: number): string {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0) {
    throw new Error("Timestamp seconds must be a non-negative integer.");
  }

  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function parseTimestampedTranscript(
  transcript: string,
): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const timestampLine = /^\[(\d+(?::[0-5]\d){1,2})\]\s*(.*)$/;

  for (const rawLine of transcript.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const timestampMatch = timestampLine.exec(line);
    if (timestampMatch) {
      const [, timestamp, rawText] = timestampMatch;
      const text = normalizeWhitespace(rawText);
      segments.push({
        startSeconds: parseTimestamp(timestamp),
        timestamp,
        text,
      });
      continue;
    }

    const current = segments.at(-1);
    if (current) {
      current.text = normalizeWhitespace(`${current.text} ${line}`);
    }
  }

  return segments.filter((segment) => segment.text.length > 0);
}

export function chunkTranscriptSegments(
  segments: readonly TranscriptSegment[],
  options: {
    chunkCharacters?: number;
    overlapCharacters?: number;
  } = {},
): TranscriptChunk[] {
  const chunkCharacters =
    options.chunkCharacters ?? DEFAULT_TRANSCRIPT_CHUNK_CHARACTERS;
  const overlapCharacters =
    options.overlapCharacters ?? DEFAULT_TRANSCRIPT_OVERLAP_CHARACTERS;

  if (!Number.isInteger(chunkCharacters) || chunkCharacters <= 0) {
    throw new Error("chunkCharacters must be a positive integer.");
  }
  if (
    !Number.isInteger(overlapCharacters) ||
    overlapCharacters < 0 ||
    overlapCharacters >= chunkCharacters
  ) {
    throw new Error(
      "overlapCharacters must be a non-negative integer smaller than chunkCharacters.",
    );
  }

  const chunks: TranscriptChunk[] = [];
  let start = 0;

  while (start < segments.length) {
    let end = start;
    let characterCount = 0;

    while (end < segments.length) {
      const separatorCharacters = end === start ? 0 : 1;
      const nextLength =
        characterCount + separatorCharacters + segments[end].text.length;

      if (end > start && nextLength > chunkCharacters) break;

      characterCount = nextLength;
      end += 1;
    }

    const selectedSegments = segments.slice(start, end);
    const firstSegment = selectedSegments[0];
    const lastSegment = selectedSegments.at(-1);

    if (!firstSegment || !lastSegment) break;

    chunks.push({
      endSeconds: lastSegment.startSeconds,
      endTimestamp: formatTimestamp(lastSegment.startSeconds),
      ordinal: chunks.length,
      segmentCount: selectedSegments.length,
      startSeconds: firstSegment.startSeconds,
      startTimestamp: formatTimestamp(firstSegment.startSeconds),
      text: selectedSegments.map((segment) => segment.text).join(" "),
    });

    if (end >= segments.length) break;

    let nextStart = end;
    let overlapSize = 0;

    // Always advance past at least the first segment in a chunk. This keeps the
    // overlap deterministic while preventing an oversized segment from looping.
    while (nextStart > start + 1 && overlapSize < overlapCharacters) {
      nextStart -= 1;
      overlapSize += segments[nextStart].text.length + 1;
    }

    start = nextStart;
  }

  return chunks;
}

export function createTranscriptChunkId(
  metadata: TranscriptFileMetadata,
  chunk: TranscriptChunk,
): string {
  const digest = createHash("sha256")
    .update(
      [
        metadata.videoId,
        chunk.startSeconds.toString(),
        chunk.endSeconds.toString(),
        chunk.text,
      ].join("\0"),
    )
    .digest("hex")
    .slice(0, 24);

  return `podcast:${metadata.videoId}:${digest}`;
}

function transcriptLocator(chunk: TranscriptChunk): string {
  const range =
    chunk.startTimestamp === chunk.endTimestamp
      ? chunk.startTimestamp
      : `${chunk.startTimestamp}-${chunk.endTimestamp}`;

  return `Transcript ${range} (chunk ${chunk.ordinal + 1})`;
}

export function buildPodcastMemoryDocuments(
  options: BuildPodcastDocumentsOptions,
): PodcastMemoryDocument[] {
  assertIsoTimestamp(options.ingestedAt, "ingestedAt");

  const headerVideoId = /^Video ID:\s*(\S+)\s*$/m.exec(
    options.transcript,
  )?.[1];

  if (headerVideoId && headerVideoId !== options.metadata.videoId) {
    throw new Error(
      `Transcript header video ID does not match filename: ${options.metadata.baseName}.txt`,
    );
  }

  const segments = parseTimestampedTranscript(options.transcript);
  if (segments.length === 0) {
    throw new Error(
      `Transcript contains no timestamped text: ${options.metadata.baseName}.txt`,
    );
  }

  const chunks = chunkTranscriptSegments(segments, {
    chunkCharacters: options.chunkCharacters,
    overlapCharacters: options.overlapCharacters,
  });

  return chunks.map((chunk) => ({
    memory_id: createTranscriptChunkId(options.metadata, chunk),
    memory_type: "transcript_chunk",
    subject_id: `youtube:${options.metadata.videoId}`,
    subject: `DAMA LA Podcast with ${options.metadata.speaker}`,
    statement: chunk.text,
    context: `Podcast transcript from "${options.source.title}", featuring ${options.metadata.speaker}, published ${options.metadata.date}.`,
    people: ["John Miller", options.metadata.speaker],
    topics: ["podcast"],
    status: "ACTIVE",
    is_current: true,
    observed_at: options.metadata.publishedAt,
    valid_from: options.metadata.publishedAt,
    ingested_at: options.ingestedAt,
    source: {
      url: options.source.url,
      title: options.source.title,
      published_at: options.metadata.publishedAt,
      episode_id: options.metadata.videoId,
      locator: transcriptLocator(chunk),
    },
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function resolvePodcastSource(
  metadata: TranscriptFileMetadata,
  episodeRecord?: unknown,
): PodcastSource {
  const record = isRecord(episodeRecord) ? episodeRecord : undefined;
  const urls = record && isRecord(record.urls) ? record.urls : undefined;
  const title =
    record && typeof record.title === "string" && record.title.trim()
      ? record.title.trim()
      : `DAMA LA Podcast with ${metadata.speaker}`;
  const url =
    validHttpUrl(urls?.watch) ??
    `https://www.youtube.com/watch?v=${metadata.videoId}`;

  return { title, url };
}

async function readEpisodeRecord(
  transcriptPath: string,
  metadata: TranscriptFileMetadata,
): Promise<unknown | undefined> {
  const episodePath = path.join(
    path.dirname(path.dirname(transcriptPath)),
    "episodes",
    `${metadata.baseName}.json`,
  );

  try {
    return JSON.parse(await readFile(episodePath, "utf8")) as unknown;
  } catch (error) {
    if (
      isRecord(error) &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }

    throw new Error(`Unable to read episode metadata: ${episodePath}`, {
      cause: error,
    });
  }
}

export async function listPodcastTranscriptFiles(
  transcriptDirectory: string,
): Promise<string[]> {
  const entries = await readdir(transcriptDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => path.join(transcriptDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export async function loadPodcastMemoryDocuments(
  transcriptPath: string,
  ingestedAt: string,
  chunkOptions: {
    chunkCharacters?: number;
    overlapCharacters?: number;
  } = {},
): Promise<PodcastMemoryDocument[]> {
  const metadata = parseTranscriptFileName(path.basename(transcriptPath));
  const [transcript, episodeRecord] = await Promise.all([
    readFile(transcriptPath, "utf8"),
    readEpisodeRecord(transcriptPath, metadata),
  ]);
  const source = resolvePodcastSource(metadata, episodeRecord);

  return buildPodcastMemoryDocuments({
    ingestedAt,
    metadata,
    source,
    transcript,
    ...chunkOptions,
  });
}

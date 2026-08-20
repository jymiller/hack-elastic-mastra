import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  chunkTranscriptSegments,
  parseTimestampedTranscript,
  type PodcastMemoryDocument,
  type TranscriptChunk,
} from "./podcast-corpus.js";

export interface AgenticMeshTranscriptFileMetadata {
  baseName: string;
  episodeLabel: string;
  episodeNumber: number;
  fileName: string;
  videoId: string;
}

export interface AgenticMeshEpisodeMetadata {
  episodeNumber: number;
  guests: string[];
  hosts: string[];
  publishedAt: string;
  sourceUrl: string;
  title: string;
  transcriptFiles: string[];
  videoId: string;
}

export interface BuildAgenticMeshDocumentsOptions {
  chunkCharacters?: number;
  episode: AgenticMeshEpisodeMetadata;
  fileMetadata: AgenticMeshTranscriptFileMetadata;
  ingestedAt: string;
  overlapCharacters?: number;
  transcript: string;
}

const transcriptFilePattern =
  /^episode-(\d{2})-([A-Za-z0-9_-]{11})-youtube-auto\.txt$/;
const fullIsoTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(
  value: unknown,
  name: string,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Agentic Mesh metadata ${name} must be an object.`);
  }

  return value;
}

function requireNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Agentic Mesh metadata ${name} must be a non-empty string.`);
  }

  return value.trim();
}

function assertFullIsoTimestamp(value: string, name: string): void {
  if (!fullIsoTimestampPattern.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${name} must be a full ISO timestamp with a timezone.`);
  }
}

function uniqueNames(value: unknown, name: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Agentic Mesh metadata ${name} must be an array.`);
  }

  const names: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const person = requireNonEmptyString(item, `${name} entry`);
    if (!seen.has(person)) {
      seen.add(person);
      names.push(person);
    }
  }

  return names;
}

function uniquePeople(episode: AgenticMeshEpisodeMetadata): string[] {
  const people: string[] = [];
  const seen = new Set<string>();

  for (const person of [...episode.hosts, ...episode.guests]) {
    if (!seen.has(person)) {
      seen.add(person);
      people.push(person);
    }
  }

  return people;
}

function requireTranscriptFiles(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      "Agentic Mesh metadata transcript.files must be a non-empty array.",
    );
  }

  return value.map((item) =>
    requireNonEmptyString(item, "transcript.files entry").replaceAll("\\", "/"),
  );
}

function validatedYoutubeUrl(value: unknown, videoId: string): string {
  const sourceUrl = requireNonEmptyString(value, "platform_urls.youtube");
  let url: URL;

  try {
    url = new URL(sourceUrl);
  } catch {
    throw new Error(
      "Agentic Mesh metadata platform_urls.youtube must be a valid URL.",
    );
  }

  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.searchParams.get("v") !== videoId
  ) {
    throw new Error(
      "Agentic Mesh metadata YouTube URL must identify its youtube.video_id.",
    );
  }

  return sourceUrl;
}

export function parseAgenticMeshTranscriptFileName(
  fileName: string,
): AgenticMeshTranscriptFileMetadata {
  const match = transcriptFilePattern.exec(fileName);

  if (!match) {
    throw new Error(
      `Agentic Mesh transcript filename must match episode-NN-VIDEOID-youtube-auto.txt: ${fileName}`,
    );
  }

  const [, episodeLabel, videoId] = match;
  const episodeNumber = Number(episodeLabel);

  if (episodeNumber < 1) {
    throw new Error(
      `Agentic Mesh transcript filename has an invalid episode number: ${fileName}`,
    );
  }

  return {
    baseName: fileName.slice(0, -path.extname(fileName).length),
    episodeLabel,
    episodeNumber,
    fileName,
    videoId,
  };
}

export function parseAgenticMeshEpisodeMetadata(
  value: unknown,
): AgenticMeshEpisodeMetadata {
  const record = requireRecord(value, "record");
  const episodeNumber = record.episode_number;

  if (!Number.isInteger(episodeNumber) || Number(episodeNumber) < 1) {
    throw new Error(
      "Agentic Mesh metadata episode_number must be a positive integer.",
    );
  }

  const youtube = requireRecord(record.youtube, "youtube");
  const videoId = requireNonEmptyString(youtube.video_id, "youtube.video_id");
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new Error(
      "Agentic Mesh metadata youtube.video_id must be an 11-character video ID.",
    );
  }

  const publishedAt = requireNonEmptyString(
    record.published_at,
    "published_at",
  );
  assertFullIsoTimestamp(publishedAt, "Agentic Mesh metadata published_at");

  const platformUrls = requireRecord(record.platform_urls, "platform_urls");
  const transcript = requireRecord(record.transcript, "transcript");

  return {
    episodeNumber: Number(episodeNumber),
    guests: uniqueNames(record.guests, "guests"),
    hosts: uniqueNames(record.hosts, "hosts"),
    publishedAt,
    sourceUrl: validatedYoutubeUrl(platformUrls.youtube, videoId),
    title: requireNonEmptyString(record.title, "title"),
    transcriptFiles: requireTranscriptFiles(transcript.files),
    videoId,
  };
}

export function validateAgenticMeshEpisodeMetadata(
  fileMetadata: AgenticMeshTranscriptFileMetadata,
  episode: AgenticMeshEpisodeMetadata,
): void {
  if (episode.episodeNumber !== fileMetadata.episodeNumber) {
    throw new Error(
      `Agentic Mesh episode number does not match transcript filename: ${fileMetadata.fileName}`,
    );
  }

  if (episode.videoId !== fileMetadata.videoId) {
    throw new Error(
      `Agentic Mesh metadata video ID does not match transcript filename: ${fileMetadata.fileName}`,
    );
  }

  const expectedTranscriptSuffix = `/${fileMetadata.fileName}`;
  const referencesTranscript = episode.transcriptFiles.some(
    (file) =>
      file === fileMetadata.fileName || file.endsWith(expectedTranscriptSuffix),
  );

  if (!referencesTranscript) {
    throw new Error(
      `Agentic Mesh metadata does not reference transcript filename: ${fileMetadata.fileName}`,
    );
  }
}

function validateTranscriptHeader(
  transcript: string,
  fileMetadata: AgenticMeshTranscriptFileMetadata,
): void {
  const videoIds = Array.from(
    transcript.matchAll(/^Video ID:\s*(\S+)\s*$/gm),
    (match) => match[1],
  );

  if (videoIds.length !== 1) {
    throw new Error(
      `Agentic Mesh transcript must contain exactly one Video ID header: ${fileMetadata.fileName}`,
    );
  }

  if (videoIds[0] !== fileMetadata.videoId) {
    throw new Error(
      `Agentic Mesh transcript header video ID does not match filename: ${fileMetadata.fileName}`,
    );
  }
}

function createAgenticMeshChunkId(
  fileMetadata: AgenticMeshTranscriptFileMetadata,
  chunk: TranscriptChunk,
): string {
  const digest = createHash("sha256")
    .update(
      [
        fileMetadata.episodeLabel,
        fileMetadata.videoId,
        chunk.startSeconds.toString(),
        chunk.endSeconds.toString(),
        chunk.text,
      ].join("\0"),
    )
    .digest("hex")
    .slice(0, 24);

  return `agentic-mesh:${fileMetadata.videoId}:${digest}`;
}

function transcriptLocator(chunk: TranscriptChunk): string {
  const range =
    chunk.startTimestamp === chunk.endTimestamp
      ? chunk.startTimestamp
      : `${chunk.startTimestamp}-${chunk.endTimestamp}`;

  return `Transcript ${range} (chunk ${chunk.ordinal + 1})`;
}

export function buildAgenticMeshMemoryDocuments(
  options: BuildAgenticMeshDocumentsOptions,
): PodcastMemoryDocument[] {
  assertFullIsoTimestamp(options.ingestedAt, "ingestedAt");
  validateAgenticMeshEpisodeMetadata(options.fileMetadata, options.episode);
  validateTranscriptHeader(options.transcript, options.fileMetadata);

  const segments = parseTimestampedTranscript(options.transcript);
  if (segments.length === 0) {
    throw new Error(
      `Agentic Mesh transcript contains no timestamped text: ${options.fileMetadata.fileName}`,
    );
  }

  const chunks = chunkTranscriptSegments(segments, {
    chunkCharacters: options.chunkCharacters,
    overlapCharacters: options.overlapCharacters,
  });
  const episodeId = `agentic-mesh:episode-${options.fileMetadata.episodeLabel}`;

  return chunks.map((chunk) => ({
    memory_id: createAgenticMeshChunkId(options.fileMetadata, chunk),
    memory_type: "transcript_chunk",
    subject_id: episodeId,
    subject: `The Agentic Mesh Podcast — Episode ${options.episode.episodeNumber}: ${options.episode.title}`,
    statement: chunk.text,
    context: `Agentic Mesh podcast transcript from Episode ${options.episode.episodeNumber}, "${options.episode.title}", published ${options.episode.publishedAt}.`,
    people: uniquePeople(options.episode),
    topics: ["podcast", "agentic-mesh"],
    status: "ACTIVE",
    is_current: true,
    observed_at: options.episode.publishedAt,
    valid_from: options.episode.publishedAt,
    ingested_at: options.ingestedAt,
    source: {
      url: options.episode.sourceUrl,
      title: options.episode.title,
      published_at: options.episode.publishedAt,
      episode_id: episodeId,
      locator: transcriptLocator(chunk),
    },
  }));
}

export async function listAgenticMeshTranscriptFiles(
  transcriptDirectory: string,
): Promise<string[]> {
  const entries = await readdir(transcriptDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => ({
      metadata: parseAgenticMeshTranscriptFileName(entry.name),
      transcriptPath: path.join(transcriptDirectory, entry.name),
    }))
    .sort(
      (left, right) =>
        left.metadata.episodeNumber - right.metadata.episodeNumber ||
        left.transcriptPath.localeCompare(right.transcriptPath),
    )
    .map(({ transcriptPath }) => transcriptPath);
}

async function readEpisodeMetadata(
  transcriptPath: string,
  fileMetadata: AgenticMeshTranscriptFileMetadata,
): Promise<AgenticMeshEpisodeMetadata> {
  const episodePath = path.join(
    path.dirname(path.dirname(transcriptPath)),
    "episodes",
    `episode-${fileMetadata.episodeLabel}.json`,
  );

  let value: unknown;
  try {
    value = JSON.parse(await readFile(episodePath, "utf8")) as unknown;
  } catch (error) {
    throw new Error(`Unable to read Agentic Mesh episode metadata: ${episodePath}`, {
      cause: error,
    });
  }

  return parseAgenticMeshEpisodeMetadata(value);
}

export async function loadAgenticMeshMemoryDocuments(
  transcriptPath: string,
  ingestedAt: string,
  chunkOptions: {
    chunkCharacters?: number;
    overlapCharacters?: number;
  } = {},
): Promise<PodcastMemoryDocument[]> {
  const fileMetadata = parseAgenticMeshTranscriptFileName(
    path.basename(transcriptPath),
  );
  const [transcript, episode] = await Promise.all([
    readFile(transcriptPath, "utf8"),
    readEpisodeMetadata(transcriptPath, fileMetadata),
  ]);

  return buildAgenticMeshMemoryDocuments({
    ...chunkOptions,
    episode,
    fileMetadata,
    ingestedAt,
    transcript,
  });
}

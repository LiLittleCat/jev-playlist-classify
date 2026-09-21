import { APIError, choice, TypeSafeClient } from '@typesafe-ai/sdk'

const languageCriteria = {
  chinese: 'The song is primarily performed in a Chinese language, including Mandarin or Cantonese.',
  english: 'The song is primarily performed in English.',
  japanese: 'The song is primarily performed in Japanese.',
  korean: 'The song is primarily performed in Korean.',
  spanish: 'The song is primarily performed in Spanish.',
  french: 'The song is primarily performed in French.',
  other: 'The song is primarily performed in another identifiable language not listed above.',
  uncertain: 'The title and artist do not provide enough reliable evidence, or the song is instrumental.',
} as const

type Language = keyof typeof languageCriteria

interface SongInput {
  id: string
  title: string
  artist: string
}

export interface ApiResult {
  status: number
  body: Record<string, unknown>
}

function isSong(value: unknown): value is SongInput {
  if (!value || typeof value !== 'object') return false
  const song = value as Record<string, unknown>
  return (
    typeof song.id === 'string' &&
    typeof song.title === 'string' &&
    song.title.trim().length > 0 &&
    typeof song.artist === 'string' &&
    song.artist.trim().length > 0
  )
}

const BATCH_SIZE = 100
const BATCH_CONCURRENCY = 4

interface ClassifiedSong extends SongInput {
  language: Language
  confidence: number
  probabilities: Record<Language, number>
}

async function classifyBatch(
  client: TypeSafeClient,
  songs: SongInput[],
): Promise<{ model: string; songs: ClassifiedSong[] }> {
  const questions = Object.fromEntries(
    songs.map((_, index) => [
      `song_${index}`,
      choice(
        `What is the primary language of the lyrics for songs[${index}]? Use both the song title and artist identity as evidence. Choose uncertain rather than guessing when the metadata is insufficient.`,
        languageCriteria,
      ),
    ]),
  )
  const response = await client.systemOne({
    model: 'jev-latest',
    state: {
      songs: songs.map(({ title, artist }) => ({ title, artist })),
      task: 'Identify the primary language in which each song is performed. The title script alone may not match the lyrics language.',
    },
    questions,
  })

  return {
    model: response.model,
    songs: songs.map((song, index) => {
      const answer = response.answers[`song_${index}`]
      return {
        ...song,
        language: answer.choice as Language,
        confidence: answer.confidence,
        probabilities: answer.probabilities as Record<Language, number>,
      }
    }),
  }
}

export async function classifyPlaylist(body: unknown): Promise<ApiResult> {
  if (!body || typeof body !== 'object') {
    return { status: 400, body: { error: '请求内容无效。' } }
  }

  const { apiKey, songs } = body as { apiKey?: unknown; songs?: unknown }
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return { status: 400, body: { error: '请填写 TypeSafe API Key。' } }
  }
  if (!Array.isArray(songs) || songs.length === 0 || !songs.every(isSong)) {
    return { status: 400, body: { error: '歌单必须至少包含一首格式完整的歌曲。' } }
  }

  const client = new TypeSafeClient({
    apiKey: apiKey.trim(),
    defaultModel: 'jev-latest',
    timeout: 60_000,
  })

  try {
    const batches = Array.from(
      { length: Math.ceil(songs.length / BATCH_SIZE) },
      (_, index) => songs.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
    )
    const completed = new Array<{ model: string; songs: ClassifiedSong[] }>(batches.length)
    let nextBatch = 0

    async function worker() {
      while (nextBatch < batches.length) {
        const batchIndex = nextBatch
        nextBatch += 1
        completed[batchIndex] = await classifyBatch(client, batches[batchIndex])
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(BATCH_CONCURRENCY, batches.length) }, () => worker()),
    )

    return {
      status: 200,
      body: {
        model: completed[0].model,
        songs: completed.flatMap((batch) => batch.songs),
      },
    }
  } catch (error) {
    if (error instanceof APIError) {
      const suffix = error.requestId ? `（请求 ID：${error.requestId}）` : ''
      if (error.status === 400) return { status: 400, body: { error: `TypeSafe 拒绝了分类请求：${error.message}${suffix}` } }
      if (error.status === 401) return { status: 401, body: { error: `TypeSafe API Key 无效。${suffix}` } }
      if (error.status === 403) return { status: 403, body: { error: `此 Key 没有调用 Jev 的权限。${suffix}` } }
      if (error.status === 404) return { status: 404, body: { error: `TypeSafe 模型或接口不存在：${error.message}${suffix}` } }
      if (error.status === 422) return { status: 422, body: { error: `TypeSafe 无法处理此请求：${error.message}${suffix}` } }
      if (error.status === 429) return { status: 429, body: { error: `TypeSafe 请求过于频繁，请稍后重试。${suffix}` } }

      console.error('TypeSafe API failure', error.status, error.message, error.requestId ?? '')
      return { status: 502, body: { error: `TypeSafe 服务返回 ${error.status}。${suffix}` } }
    }

    console.error('TypeSafe connection failure', error instanceof Error ? error.message : error)
    return { status: 502, body: { error: '服务器无法连接 TypeSafe，请检查网络或代理设置。' } }
  }
}


export const languageMeta = {
  chinese: { label: '中文', english: 'Chinese', tone: 'coral' },
  english: { label: '英文', english: 'English', tone: 'blue' },
  japanese: { label: '日语', english: 'Japanese', tone: 'yellow' },
  korean: { label: '韩语', english: 'Korean', tone: 'green' },
  spanish: { label: '西班牙语', english: 'Spanish', tone: 'violet' },
  french: { label: '法语', english: 'French', tone: 'pink' },
  other: { label: '其他语种', english: 'Other', tone: 'slate' },
  uncertain: { label: '待确认', english: 'Uncertain', tone: 'gray' },
} as const

export type Language = keyof typeof languageMeta

export interface SongInput {
  id: string
  title: string
  artist: string
}

export interface ClassifiedSong extends SongInput {
  language: Language
  confidence: number
  probabilities: Record<Language, number>
}


export async function classifySongs(
  songs: SongInput[],
  apiKey: string,
): Promise<{ songs: ClassifiedSong[]; model: string }> {
  const response = await fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, songs }),
  })

  const payload = (await response.json().catch(() => null)) as
    | { songs: ClassifiedSong[]; model: string; error?: never }
    | { error: string; songs?: never; model?: never }
    | null

  if (!response.ok) {
    throw new Error(payload?.error ?? `分类服务请求失败（${response.status}）`)
  }
  if (!payload || !payload.songs || !payload.model) {
    throw new Error('分类服务返回了无效结果。')
  }

  return { songs: payload.songs, model: payload.model }
}

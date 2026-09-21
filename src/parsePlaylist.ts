import type { SongInput } from './classify'

export type PlaylistFormat = 'title-artist' | 'artist-title' | 'title-only'

export interface ParsedPlaylist {
  songs: SongInput[]
  invalidLines: Array<{ line: number; value: string }>
}

const delimiterPattern = /\s*[-–—]\s+/g

export function formatSong(
  song: Pick<SongInput, 'title' | 'artist'>,
  format: PlaylistFormat,
): string {
  if (format === 'title-only') return song.title
  if (format === 'artist-title') return `${song.artist} - ${song.title}`
  return `${song.title} - ${song.artist}`
}

export function parsePlaylist(
  value: string,
  format: PlaylistFormat = 'title-artist',
): ParsedPlaylist {
  const songs: SongInput[] = []
  const invalidLines: ParsedPlaylist['invalidLines'] = []

  value.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) return

    if (format === 'title-only') {
      songs.push({ id: `line-${index + 1}`, title: line, artist: '' })
      return
    }

    const delimiters = [...line.matchAll(delimiterPattern)]
    const delimiter = delimiters.at(-1)
    if (!delimiter || delimiter.index === undefined) {
      invalidLines.push({ line: index + 1, value: line })
      return
    }

    const firstPart = line.slice(0, delimiter.index).trim()
    const secondPart = line.slice(delimiter.index + delimiter[0].length).trim()
    const title = format === 'artist-title' ? secondPart : firstPart
    const artist = format === 'artist-title' ? firstPart : secondPart
    if (!title || !artist) {
      invalidLines.push({ line: index + 1, value: line })
      return
    }

    songs.push({ id: `line-${index + 1}`, title, artist })
  })

  return { songs, invalidLines }
}

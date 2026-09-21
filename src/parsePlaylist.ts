import type { SongInput } from './classify'

export interface ParsedPlaylist {
  songs: SongInput[]
  invalidLines: Array<{ line: number; value: string }>
}

const delimiterPattern = /\s[-–—]\s/g

export function parsePlaylist(value: string): ParsedPlaylist {
  const songs: SongInput[] = []
  const invalidLines: ParsedPlaylist['invalidLines'] = []

  value.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) return

    const delimiters = [...line.matchAll(delimiterPattern)]
    const delimiter = delimiters.at(-1)
    if (!delimiter || delimiter.index === undefined) {
      invalidLines.push({ line: index + 1, value: line })
      return
    }

    const title = line.slice(0, delimiter.index).trim()
    const artist = line.slice(delimiter.index + delimiter[0].length).trim()
    if (!title || !artist) {
      invalidLines.push({ line: index + 1, value: line })
      return
    }

    songs.push({ id: `line-${index + 1}`, title, artist })
  })

  return { songs, invalidLines }
}

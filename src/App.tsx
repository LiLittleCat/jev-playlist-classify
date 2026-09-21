import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Music2,
  RotateCcw,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  classifySongs,
  type ClassifiedSong,
  type Language,
} from './classify'
import { parsePlaylist } from './parsePlaylist'

const starterPlaylist = `晴天 - 周杰伦
红豆 - 王菲

Blinding Lights - The Weeknd
Hello - Adele

Lemon - 米津玄師
夜に駆ける - YOASOBI

좋은 날 - IU
사랑을 했다 - iKON

Despacito - Luis Fonsi
Bailando - Enrique Iglesias

La vie en rose - Édith Piaf
Dernière danse - Indila

Volare - Domenico Modugno
99 Luftballons - Nena`

const outputDefinitions: ReadonlyArray<{
  id: Language
  title: string
  subtitle: string
}> = [
  { id: 'chinese', title: '中文歌曲', subtitle: 'Chinese' },
  { id: 'english', title: '英文歌曲', subtitle: 'English' },
  { id: 'japanese', title: '日语歌曲', subtitle: 'Japanese' },
  { id: 'korean', title: '韩语歌曲', subtitle: 'Korean' },
  { id: 'spanish', title: '西班牙语歌曲', subtitle: 'Spanish' },
  { id: 'french', title: '法语歌曲', subtitle: 'French' },
  { id: 'other', title: '其他语言', subtitle: 'Other languages' },
  { id: 'uncertain', title: '待确认', subtitle: 'Needs review' },
]

async function writeToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const fallback = document.createElement('textarea')
    fallback.value = text
    fallback.style.position = 'fixed'
    fallback.style.opacity = '0'
    document.body.appendChild(fallback)
    fallback.focus()
    fallback.select()
    const copied = document.execCommand('copy')
    fallback.remove()
    if (!copied) throw new Error('clipboard unavailable')
  }
}


function App() {
  const [playlistText, setPlaylistText] = useState(starterPlaylist)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [results, setResults] = useState<ClassifiedSong[]>([])
  const [model, setModel] = useState('')
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const parsedPlaylist = useMemo(() => parsePlaylist(playlistText), [playlistText])
  const validSongs = parsedPlaylist.songs

  const resultGroups = useMemo(
    () =>
      outputDefinitions.map((group) => {
        const songs = results.filter((song) => song.language === group.id)
        return {
          ...group,
          count: songs.length,
          text: songs.map((song) => `${song.title} - ${song.artist}`).join('\n'),
        }
      }),
    [results],
  )

  function updatePlaylist(value: string) {
    setPlaylistText(value)
    setResults([])
    setError('')
  }

  function reset() {
    setPlaylistText(starterPlaylist)
    setResults([])
    setError('')
    setCopiedGroup(null)
  }

  async function runClassification() {
    setError('')
    if (!apiKey.trim()) {
      setError('请先填写 TypeSafe API Key。')
      return
    }
    if (validSongs.length === 0) {
      setError('至少需要一首填写完整的歌曲。')
      return
    }

    setLoading(true)
    try {
      const response = await classifySongs(validSongs, apiKey.trim())
      setResults(response.songs)
      setModel(response.model)
      setCopiedGroup(null)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '未知错误'
      setError(`分类失败：${message}`)
    } finally {
      setLoading(false)
    }
  }

  async function copyGroup(id: string, text: string) {
    if (!text) return
    try {
      await writeToClipboard(text)
      setCopiedGroup(id)
      window.setTimeout(() => setCopiedGroup((current) => (current === id ? null : current)), 1800)
    } catch {
      setError('复制失败，请在结果框中全选并手动复制。')
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SONGTYPE 首页">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>SONGTYPE</span>
        </a>
        <div className="header-status">
          <span className="live-dot" />
          <span>JEV LATEST</span>
          <span className="header-rule" />
          <span>语言分类器</span>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="eyebrow"><Sparkles size={14} /> TypeSafe AI · System One</div>
          <h1>你的歌单，<br /><em>一目了然。</em></h1>
          <p className="hero-copy">
            输入歌名与歌手，交给最新的 Jev 模型识别歌曲语言。一次请求，整张歌单完成分类。
          </p>
          <div className="hero-stats" aria-label="产品特性">
            <div><strong>8</strong><span>语言类别</span></div>
            <div><strong>分批</strong><span>并发处理</span></div>
            <div><strong>JEV</strong><span>最新模型</span></div>
          </div>
        </section>

        <section className="workspace" aria-label="歌单分类工作台">
          <div className="panel input-panel">
            <div className="panel-heading">
              <div>
                <span className="step-number">01</span>
                <div><p className="kicker">PLAYLIST</p><h2>粘贴歌单</h2></div>
              </div>
              <button className="text-button" onClick={reset} type="button"><RotateCcw size={14} /> 重置示例</button>
            </div>

            <label className="playlist-input-label" htmlFor="playlist-text">
              每行一首，格式为 <code>歌名 - 歌手</code>
            </label>
            <textarea
              id="playlist-text"
              className="playlist-textarea"
              value={playlistText}
              onChange={(event) => updatePlaylist(event.target.value)}
              placeholder={'晴天 - 周杰伦\nBlinding Lights - The Weeknd\nLemon - 米津玄師'}
              spellCheck={false}
            />
            <div className="parse-summary">
              <span><Check size={14} /> 已识别 {validSongs.length} 首歌曲</span>
              {parsedPlaylist.invalidLines.length > 0 && (
                <span className="parse-warning">
                  <AlertCircle size={14} />
                  第 {parsedPlaylist.invalidLines.map(({ line }) => line).join('、')} 行格式不正确
                </span>
              )}
            </div>
          </div>

          <aside className="panel key-panel">
            <div className="panel-heading compact">
              <div>
                <span className="step-number">02</span>
                <div><p className="kicker">CONNECT</p><h2>连接 Jev</h2></div>
              </div>
            </div>
            <p className="panel-copy">密钥仅保留在当前页面内存中，并通过本站后端转发给 TypeSafe。刷新页面后即清除。</p>
            <label className="key-label" htmlFor="api-key">TypeSafe API Key</label>
            <div className="key-input-wrap">
              <KeyRound size={17} />
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="ts_live_••••••••••"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={() => setShowKey((shown) => !shown)} aria-label={showKey ? '隐藏密钥' : '显示密钥'}>
                {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div className="security-note"><LockKeyhole size={15} /><span>同源后端转发，不再从浏览器直接请求 TypeSafe。</span></div>

            {error && <div className="error-message" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}

            <button className="classify-button" onClick={runClassification} disabled={loading} type="button">
              {loading ? <LoaderCircle className="spin" size={19} /> : <WandSparkles size={19} />}
              <span>{loading ? `Jev 正在分批分析 ${validSongs.length} 首…` : `开始分类 ${validSongs.length} 首歌`}</span>
              {!loading && <ArrowRight size={19} />}
            </button>
            <p className="model-note">模型别名 <code>jev-latest</code> · 结果含置信度</p>
          </aside>
        </section>

        <section className={`results-section ${results.length ? 'has-results' : ''}`} aria-live="polite">
          <div className="results-heading">
            <div>
              <span className="step-number">03</span>
              <div><p className="kicker">RESULTS</p><h2>分类结果</h2></div>
            </div>
            {results.length > 0 && <div className="model-pill"><Check size={14} /> {model} · {results.length} 首</div>}
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <div className="record"><div className="record-center"><Music2 size={25} /></div></div>
              <div><h3>等待你的歌单</h3><p>填写歌曲与 API Key 后，分类结果会出现在这里。</p></div>
            </div>
          ) : (
            <div className="output-grid">
              {resultGroups.map((group) => (
                <article className={`output-panel output-${group.id}`} key={group.id}>
                  <div className="output-heading">
                    <div>
                      <p>{group.subtitle}</p>
                      <h3>{group.title}</h3>
                    </div>
                    <span>{group.count} 首</span>
                  </div>
                  <textarea
                    aria-label={`${group.title}分类结果`}
                    value={group.text}
                    readOnly
                    placeholder="暂无歌曲"
                    spellCheck={false}
                  />
                  <button
                    className="copy-button"
                    type="button"
                    onClick={() => copyGroup(group.id, group.text)}
                    disabled={!group.text}
                  >
                    {copiedGroup === group.id ? <Check size={15} /> : <Copy size={15} />}
                    {copiedGroup === group.id ? '已复制' : '复制全部'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer><span>SONGTYPE / 2026</span><span>Powered by TypeSafe · Jev</span></footer>
    </div>
  )
}

export default App

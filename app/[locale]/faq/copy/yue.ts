import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "常見問題｜字幕編輯器",
    description: "關於字幕編輯器嘅常見問題。",
  },
  heading: "常見問題",
  backToEditor: "返去編輯器",
  languageLabel: "常見問題嘅語言",
  questions: {
    "why-this-editor": {
      question: "點解仲要整多個字幕編輯器？",
      answer: [
        "係，我知市面上已經有好多字幕編輯器。不過我試過之後，覺得冇一個完全啱自己用，所以就整咗呢個。下面係我試過嘅編輯器，同埋我覺得佢哋有咩唔夠好：",
        {
          list: "ul",
          items: [
            [
              { link: "happyScribe", label: "Happy Scribe" },
              " 有個免費嘅網上字幕編輯器，唔使註冊帳戶就用得。改字幕、對住條片預覽都好容易。佢最接近我想要嘅嘢。可惜佢冇波形圖，冇呢樣嘢我就唔會揀佢。而且佢冇開源，我哋想自己改都唔得。",
            ],
            [
              { link: "subtitleEdit", label: "Subtitle Edit" },
              " 好好用，我想要嘅功能佢都有。佢有波形圖，預覽同編輯都好方便，甚至連 AI 語音轉文字都有。不過佢係桌面軟件，要安裝，而且唔支援 Mac。我要用 Windows 或者 Linux 嘅機先改到字幕。",
            ],
            [
              { link: "aegisub", label: "Aegisub" },
              " 同 Subtitle Edit 差唔多，亦係桌面軟件，適合做複雜啲嘅字幕編輯。另外，我覺得佢個波形圖唔係咁直觀。（順帶一提，呢啲桌面軟件嘅介面仲係九十年代嗰種款，我一見到就真係冇晒心機。）",
            ],
            [
              "其他選擇，例如 ",
              { link: "openSubtitleEditor", label: "Open Subtitle Editor" },
              " 或者 ",
              { link: "movavi", label: "Movavi" },
              "，一係就太複雜，塞咗太多功能入去，一係就要畀錢。",
            ],
          ],
        },
        "佢哋冇一個係開源嘅，啲介面一係太肉酸，一係太複雜，搞到我改字幕嗰陣好唔順手。我想要嘅字幕編輯器係咁嘅：",
        {
          list: "ol",
          items: [
            "永久免費",
            "開源",
            "完全喺網頁上面用，唔使下載或者安裝",
            "唔使註冊或者登入帳戶",
            "用起上嚟簡單直接",
            "有波形圖睇",
          ],
        },
        "所以我就整咗呢個。",
      ],
    },
    maintenance: {
      question: "你會唔會積極維護呢個程式？",
      answer: [
        [
          "呢個程式喺 GitHub 開咗源：",
          { link: "repo", label: "laubonghaudoi/subtitle-editor" },
          "。我會定期睇 issue 同接受 PR，不過我近排幾忙，未必有時間開發新功能。呢個係社群項目，隨時歡迎大家貢獻！",
        ],
      ],
    },
    "media-formats": {
      question: "可唔可以支援多啲影片或者音訊檔案格式？",
      answer: [
        [
          "呢個程式靠瀏覽器內置嘅播放器，幫你載入嘅影片或者音訊檔解碼。所以支援邊啲格式係由你個瀏覽器決定，我都冇辦法改。例如 Safari 同 Microsoft Edge 支援 AC3 格式，但係 Chrome 同 Firefox 就唔支援。不過你仍然可以用 ",
          { link: "ffmpeg", label: "ffmpeg" },
          " 將媒體檔轉做瀏覽器支援嘅格式，再載入編輯器。",
        ],
      ],
    },
    contribute: {
      question: "有嘢想反映？",
      answer: [
        [
          "歡迎",
          { link: "issues", label: "喺 GitHub 開個 issue" },
          "。我想呢個程式盡量保持簡單，所以下面呢啲功能唔係我嘅目標，我亦冇打算加落去：",
        ],
        {
          list: "ul",
          items: [
            "註冊帳戶",
            "雲端儲存",
            "多人協作編輯",
            "AI 語音轉文字",
            "翻譯",
            "好似 VTT 檔嗰類複雜嘅字幕編輯。",
          ],
        },
        [
          "我喺",
          { link: "scope", label: "呢個 GitHub issue" },
          " 講過點解我唔打算加呢啲功能。如果你需要當中任何一樣進階功能，請用我上面列出嘅其他工具。",
        ],
      ],
    },
    transcription: {
      question: "我需要 AI 語音轉文字工具或者 SRT 產生器，有冇推介？",
      answer: [
        "有，我建議先用 AI 語音轉文字工具產生 SRT 檔，再用呢個編輯器修改。所以我先至喺上面將「AI 語音轉文字」列做唔打算加嘅功能。直接用專門嘅工具做呢樣嘢，比起將佢整埋入呢個編輯器容易得多。Hugging Face 上面有好多免費嘅 SRT 產生器，例如：",
        {
          list: "ul",
          items: [
            [{ link: "hfK2", label: "k2-fsa/generate-subtitles-for-videos" }],
            [
              {
                link: "hfBatuhan",
                label: "BatuhanYilmaz/Whisper-Auto-Subtitled-Video-Generator",
              },
            ],
            [
              {
                link: "hfNeuralFalcon",
                label: "NeuralFalcon/Whisper-Turbo-Subtitle",
              },
            ],
          ],
        },
        [
          "你亦可以下載我上面提過嘅 ",
          { link: "subtitleEdit", label: "Subtitle Edit" },
          "，佢有內置嘅 AI 語音轉文字功能。",
        ],
      ],
    },
    "youtube-subtitles": {
      question: "我想下載一條 YouTube 片，再抽返條片嘅字幕出嚟，可以點做？",
      answer: [
        [
          "用 ",
          { link: "ytdlp", label: "yt-dlp" },
          "。佢係免費嘅，亦係最可靠嘅 YouTube 影片下載工具。如果條片有字幕，佢仲可以直接下載埋啲字幕。",
        ],
      ],
    },
  },
} satisfies FaqContent;

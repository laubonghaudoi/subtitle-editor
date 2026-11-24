import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "字幕編輯器常見問題｜改字幕、對時間同儲存檔案",
    description:
      "睇吓點樣喺瀏覽器改 SRT 同 WebVTT 字幕、對返啱時間、編輯幾條語言唔同嘅字幕軌，同埋將改好嘅字幕儲落自己部機。",
  },
  heading: "字幕編輯器常見問題",
  backToEditor: "返去字幕編輯器",
  languageLabel: "常見問題嘅語言",
  questions: {
    "edit-subtitles": {
      question: "點樣改 SRT 或者 WebVTT 字幕？",
      answer:
        "撳「載入 .srt/.vtt」開你個 .srt 或者 .vtt 檔。撳入要改嗰句字幕，改好再撳 Enter 確認。如果想對住段片或者錄音嚟改，就撳「載入媒體」開返對應嘅檔案。",
    },
    "sync-subtitles": {
      question: "字幕出得太早或者太遲，點樣對返啱？",
      answer:
        "如果淨係得一句唔啱，可以喺波形圖拖嗰句字幕方塊嘅左邊或者右邊，對返講嘢嘅起點同終點。如果成條字幕軌都早咗咁多秒，就開「批量位移」，揀「成段字幕」，將秒數設做正數。字幕出得太遲就用負數。睇過預覽先撳「確定位移」。",
    },
    "convert-srt-vtt": {
      question: "點樣將 SRT 轉做 WebVTT，或者將 WebVTT 轉返做 SRT？",
      answer:
        "撳「載入 .srt/.vtt」開原本嗰個字幕檔，再撳「儲存字幕」。喺要匯出嗰條字幕軌揀 .vtt 就會儲做 WebVTT，揀 .srt 就會儲做 SRT。兩種格式都有字幕文字同顯示時間。如果仲要用原有 WebVTT 嘅字幕位置或者樣式，記得留返個原檔。",
    },
    "multiple-tracks": {
      question: "同一條片可唔可以編輯兩種語言嘅字幕？",
      answer:
        "可以。開咗第一個字幕檔之後，撳「載入 .srt/.vtt」，揀「開新字幕軌」加埋另一種語言。同一段片或者錄音最多可以開四條字幕軌。撳對應嘅分頁就可以轉去改嗰種語言，每條軌都可以分開儲存。",
    },
    "save-subtitles": {
      question: "匯出字幕應該揀邊種格式？個檔會儲喺邊？",
      answer:
        "撳「儲存字幕」，喺要匯出嘅字幕軌揀格式。SRT 同 WebVTT 都有時間碼，可以配住段片播。TXT 淨係得字幕文字。CSV 就有每句字幕嘅編號、開始時間、結束時間同文字。如果瀏覽器彈出儲存視窗，你可以喺入面改檔名同揀資料夾。如果見到嘅係編輯器嘅下載視窗，就入檔名再撳「下載」，個檔會儲喺瀏覽器下載設定指定嘅位置。",
    },
    privacy: {
      question: "我開嘅片同字幕有邊個睇到？",
      answer:
        "瀏覽器會喺你部機讀取媒體同字幕檔。編輯器喺本機處理檔案內容，唔使上載檔案，亦唔使開戶口。瀏覽器會留低字幕軌同設定，方便下次還原。網站亦有用寄存同流量分析服務，呢啲服務可能會收到同今次瀏覽有關嘅資料。",
    },
    offline: {
      question: "冇網絡可唔可以照改？下次開返仲喺唔喺度？",
      answer:
        "趁有網絡嗰陣開一次編輯器，等佢載入晒。瀏覽器快取咗個程式之後，用返同一個瀏覽器，冇網絡都可以再開。字幕軌可以還原，段片或者錄音就要自己開多次。如果打算清除網站資料，記得先匯出字幕，留返一份。",
    },
    "media-formats": {
      question: "點解我個影片檔或者錄音檔播唔到？",
      answer: [
        "播唔播到，要睇瀏覽器同作業系統支唔支援個檔用嘅容器格式同編解碼器。未開檔嗰陣，媒體面板會列出瀏覽器報稱支援嘅格式。如果個檔播唔到，可以用 ",
        { link: "ffmpeg", label: "FFmpeg" },
        " 喺自己部機轉去支援嘅格式，再開轉好嗰個檔。",
      ],
    },
    transcription: {
      question: "點樣由錄音自動整一份字幕出嚟？",
      answer: [
        "可以先用 ",
        { link: "whisper", label: "Whisper" },
        " 呢類語音轉文字工具將錄音轉成字幕，儲做 SRT 或者 WebVTT，再喺呢度開個檔，改返啱啲字同時間。語音轉文字同自動翻譯都要用另外嘅工具做。",
      ],
    },
    "youtube-subtitles": {
      question: "點樣改 YouTube 影片嘅字幕？",
      answer: [
        "將條片嘅字幕儲做 SRT 或者 WebVTT，再撳「載入 .srt/.vtt」開檔。如果你用 yt-dlp，可以用佢嘅",
        { link: "ytdlp", label: "字幕選項" },
        "睇吓有邊啲字幕軌，同埋下載要用嗰條。想對時間嘅話，就撳「載入媒體」開返自己部機上面嗰份影片。",
      ],
    },
    "why-this-editor": {
      question: "點解你會自己寫多個字幕編輯器？",
      answer: [
        "我自己整字幕嗰陣試過 ",
        { link: "happyScribe", label: "Happy Scribe" },
        "、",
        { link: "subtitleEdit", label: "Subtitle Edit" },
        " 同 ",
        { link: "aegisub", label: "Aegisub" },
        "。我想喺 Mac 一開個檔就睇到波形，聽吓句字幕有冇對啱，又唔使裝軟件、開戶口。所以我寫咗呢個編輯器，等大家都可以免費喺瀏覽器用，有需要仲可以自己改源碼。",
      ],
    },
    contribute: {
      question: "用嗰陣遇到問題點報？我可以點樣幫手？",
      answer: [
        "你可以",
        { link: "issues", label: "喺 GitHub 開個 issue" },
        "，講低用緊邊個瀏覽器，同埋做咗邊幾步先出問題。我有時間就會睇 issue 同 pull request，亦歡迎大家一齊",
        { link: "repo", label: "改進呢個開源編輯器" },
        "。如果你想提議加新功能，我喺",
        { link: "scope", label: "項目範圍嘅討論" },
        "講過點解想個編輯器集中做好邊幾樣嘢。",
      ],
    },
  },
} satisfies FaqContent;

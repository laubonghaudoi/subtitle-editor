import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "FAQ | Edytor napisów",
    description: "Często zadawane pytania dotyczące edytora napisów.",
  },
  heading: "Często zadawane pytania",
  backToEditor: "Wróć do edytora",
  languageLabel: "Język pytań i odpowiedzi",
  questions: {
    "why-this-editor": {
      question: "Po co kolejny edytor napisów?",
      answer: [
        "Tak, wiem, jest już wiele edytorów napisów. Okazało się jednak, że żaden z nich nie jest dla mnie idealny, więc stworzyłem własny. Poniżej opisuję edytory, które wypróbowałem, i to, czego moim zdaniem w nich brakuje:",
        {
          list: "ul",
          items: [
            [
              { link: "happyScribe", label: "Happy Scribe" },
              " oferuje darmowy edytor napisów online. Nie trzeba zakładać konta. Bardzo łatwo edytuje się w nim napisy i sprawdza, jak wyglądają na filmie. To edytor najbliższy temu, czego potrzebuję. Niestety brakuje w nim wykresu fali dźwiękowej, a to dla mnie przekreśla ten edytor. Nie ma też otwartego kodu źródłowego i nie możemy go dostosować do swoich potrzeb.",
            ],
            [
              { link: "subtitleEdit", label: "Subtitle Edit" },
              " to świetny wybór. Ma wszystkie funkcje, których potrzebuję. Wyświetla wykres fali dźwiękowej, pozwala łatwo podglądać i edytować napisy, a nawet robić transkrypcje za pomocą AI. To jednak program komputerowy, który wymaga instalacji i nie działa na Macu. Żeby edytować napisy, muszę korzystać z urządzenia z Windowsem lub Linuksem.",
            ],
            [
              { link: "aegisub", label: "Aegisub" },
              " jest podobny do Subtitle Edit. To program komputerowy, który nadaje się do bardziej zaawansowanej edycji napisów. Poza tym wykres fali dźwiękowej wydał mi się mało intuicyjny. (Swoją drogą, te programy mają interfejsy jak z lat 90., co naprawdę odbiera mi chęć do pracy)",
            ],
            [
              "Inne rozwiązania, takie jak ",
              { link: "openSubtitleEditor", label: "Open Subtitle Editor" },
              " czy ",
              { link: "movavi", label: "Movavi" },
              ", są albo zbyt skomplikowane i przeładowane funkcjami, albo płatne.",
            ],
          ],
        },
        "Żaden z nich nie ma otwartego kodu źródłowego, a interfejsy są albo zbyt brzydkie, albo zbyt skomplikowane. Naprawdę przeszkadza mi to przy edycji napisów. Chcę edytora, który:",
        {
          list: "ol",
          items: [
            "Zawsze będzie darmowy",
            "Ma otwarty kod źródłowy",
            "Działa w całości w przeglądarce, bez pobierania ani instalowania",
            "Nie wymaga zakładania konta ani logowania",
            "Stawia na prostotę obsługi",
            "Wyświetla wykres fali dźwiękowej",
          ],
        },
        "Więc stworzyłem ten edytor.",
      ],
    },
    maintenance: {
      question: "Czy będziesz aktywnie utrzymywać tę aplikację?",
      answer: [
        [
          "Kod źródłowy aplikacji jest otwarty i dostępny na GitHubie w repozytorium ",
          { link: "repo", label: "laubonghaudoi/subtitle-editor" },
          ". Będę regularnie przeglądać zgłoszenia i przyjmować pull requesty, ale ostatnio mam sporo zajęć, więc mogę nie mieć czasu na opracowywanie nowych funkcji. To projekt społecznościowy i każda pomoc jest zawsze mile widziana!",
        ],
      ],
    },
    "media-formats": {
      question:
        "Czy możesz dodać obsługę większej liczby formatów wideo i audio?",
      answer: [
        [
          "Aplikacja korzysta z odtwarzacza wbudowanego w przeglądarkę, żeby zdekodować wczytany plik wideo lub audio. To od przeglądarki zależy więc, które formaty są obsługiwane, i nic na to nie poradzę. Na przykład Safari i Microsoft Edge obsługują format AC3, a Chrome i Firefox go nie obsługują. Możesz jednak użyć ",
          { link: "ffmpeg", label: "ffmpeg" },
          ", żeby przekonwertować pliki multimedialne na obsługiwany format przed wczytaniem ich do edytora.",
        ],
      ],
    },
    contribute: {
      question: "Masz jakieś uwagi?",
      answer: [
        [
          "Śmiało, ",
          { link: "issues", label: "otwórz zgłoszenie na GitHubie" },
          ". Chcę, żeby aplikacja pozostała jak najprostsza, więc poniższe funkcje nie należą do celów projektu i nie planuję ich dodawać:",
        ],
        {
          list: "ul",
          items: [
            "Rejestracja kont",
            "Przechowywanie w chmurze",
            "Wspólna edycja",
            "Transkrypcja za pomocą AI",
            "Tłumaczenie",
            "Zaawansowana edycja napisów, np. plików VTT.",
          ],
        },
        [
          "Powody, dla których nie uwzględniam tych funkcji, omówiłem ",
          { link: "scope", label: "w tym zgłoszeniu na GitHubie" },
          ". Jeśli potrzebujesz którejś z tych zaawansowanych funkcji, skorzystaj z innych rozwiązań, które wymieniłem wyżej.",
        ],
      ],
    },
    transcription: {
      question:
        "Potrzebuję narzędzia do transkrypcji za pomocą AI lub generatora plików srt. Co polecasz?",
      answer: [
        "Tak. Polecam najpierw wygenerować plik srt za pomocą narzędzia do transkrypcji opartego na AI, a potem poprawić go w tym edytorze. Dlatego wyżej wymieniłem „transkrypcję za pomocą AI” wśród funkcji, których nie planuję dodawać. Znacznie łatwiej jest użyć do tego specjalistycznego narzędzia niż wbudować je w ten edytor. Na Hugging Face jest wiele darmowych generatorów plików srt, na przykład:",
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
          "Możesz też pobrać wspomniany wyżej ",
          { link: "subtitleEdit", label: "Subtitle Edit" },
          ", który ma wbudowaną funkcję transkrypcji za pomocą AI.",
        ],
      ],
    },
    "youtube-subtitles": {
      question:
        "Chcę pobrać film z YouTube i wyodrębnić z niego napisy. Jak to zrobić?",
      answer: [
        [
          "Użyj ",
          { link: "ytdlp", label: "yt-dlp" },
          ". To darmowe i najbardziej niezawodne narzędzie do pobierania filmów z YouTube. Pozwala też pobrać bezpośrednio napisy, jeśli są dostępne.",
        ],
      ],
    },
  },
} satisfies FaqContent;

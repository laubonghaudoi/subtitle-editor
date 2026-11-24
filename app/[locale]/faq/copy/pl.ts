import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "Pytania o Subtitle Editor | Edycja, synchronizacja i zapis napisów",
    description:
      "Dowiedz się, jak poprawiać i synchronizować napisy SRT i WebVTT, pracować z kilkoma ścieżkami językowymi i zapisywać gotowe pliki w przeglądarce.",
  },
  heading: "Pytania i odpowiedzi o Subtitle Editor",
  backToEditor: "Wróć do edytora napisów",
  languageLabel: "Język pytań i odpowiedzi",
  questions: {
    "edit-subtitles": {
      question: "Jak edytować plik z napisami SRT lub WebVTT?",
      answer:
        "Wybierz „Wczytaj napisy” i otwórz plik .srt lub .vtt. Kliknij tekst napisu, popraw go i zatwierdź klawiszem Enter. Aby porównać napis z nagraniem, wybierz „Wczytaj media” i otwórz odpowiedni plik wideo lub audio.",
    },
    "sync-subtitles": {
      question: "Co zrobić, gdy napisy pojawiają się za wcześnie lub za późno?",
      answer:
        "Aby poprawić jedną kwestię, przeciągnij lewą lub prawą krawędź jej bloku na wykresie fali do początku lub końca wypowiedzi. Jeśli cała ścieżka wyprzedza nagranie o ten sam czas, otwórz „Masowe przesunięcie”, wybierz „Cały napis” i ustaw dodatnie przesunięcie w sekundach. Gdy napisy się spóźniają, ustaw wartość ujemną. Sprawdź podgląd i wybierz „Zastosuj przesunięcie”.",
    },
    "convert-srt-vtt": {
      question:
        "Jak przekonwertować napisy z SRT na WebVTT lub z WebVTT na SRT?",
      answer:
        "Otwórz plik źródłowy przez „Wczytaj napisy”. Wybierz „Zapisz”, odszukaj odpowiednią ścieżkę i wybierz .vtt, aby utworzyć plik WebVTT, lub .srt, aby utworzyć plik SRT. Oba formaty przechowują tekst i czasy wyświetlania. Zachowaj oryginalny plik WebVTT, jeśli zależy Ci również na położeniu lub stylu napisów.",
    },
    "multiple-tracks": {
      question:
        "Czy mogę opracować napisy w dwóch językach do tego samego filmu?",
      answer:
        "Tak. Otwórz pierwszy plik z napisami, a następnie w menu „Wczytaj napisy” wybierz „Dodaj nową ścieżkę” dla drugiego języka. Do jednego nagrania możesz otworzyć do czterech ścieżek. Przełączaj się między językami za pomocą kart i zapisuj każdą ścieżkę osobno.",
    },
    "save-subtitles": {
      question: "Który format wybrać i gdzie po zapisaniu znajdę plik?",
      answer:
        "W menu „Zapisz” wybierz format dla swojej ścieżki. SRT i WebVTT zawierają znaczniki czasu potrzebne do odtwarzania. TXT zawiera sam tekst. W CSV znajdziesz identyfikator, czas początku, czas końca i tekst każdego napisu. Jeśli przeglądarka otworzy okno zapisu, podaj w nim nazwę i wybierz folder. W pozostałych przypadkach podaj nazwę w edytorze i wybierz „Pobierz”. O miejscu zapisu decydują wtedy ustawienia pobierania w przeglądarce.",
    },
    privacy: {
      question: "Kto ma dostęp do otwieranych przeze mnie filmów i napisów?",
      answer:
        "Przeglądarka odczytuje pliki multimedialne i napisy na Twoim urządzeniu. Edytor przetwarza ich zawartość lokalnie, bez wysyłania plików na serwer i bez zakładania konta. Zachowuje w przeglądarce kopię ścieżek napisów i ustawień, aby można było je przywrócić. Witryna korzysta też z usług hostingowych i analitycznych, które mogą otrzymywać informacje o wizycie.",
    },
    offline: {
      question: "Czy mogę pracować bez internetu i wrócić później do edycji?",
      answer:
        "Najpierw otwórz edytor z dostępem do internetu i poczekaj, aż się załaduje. Gdy aplikacja znajdzie się w pamięci podręcznej, możesz ponownie otworzyć ją offline w tej samej przeglądarce. Ścieżki napisów można przywrócić, a plik multimedialny trzeba otworzyć ponownie. Przed wyczyszczeniem danych witryny wyeksportuj napisy, aby zachować swoją pracę.",
    },
    "media-formats": {
      question: "Dlaczego mój plik wideo lub audio się nie odtwarza?",
      answer: [
        "Odtwarzanie zależy od tego, jakie kontenery i kodeki obsługują Twoja przeglądarka i system operacyjny. W pustym panelu multimediów zobaczysz listę formatów, których obsługę zgłasza przeglądarka. Jeśli plik się nie otwiera, możesz przekonwertować go lokalnie za pomocą ",
        { link: "ffmpeg", label: "FFmpeg" },
        " i otworzyć nową kopię.",
      ],
    },
    transcription: {
      question: "Jak automatycznie utworzyć napisy z nagrania?",
      answer: [
        "Użyj narzędzia do transkrypcji, na przykład ",
        { link: "whisper", label: "Whisper" },
        ", i zapisz wynik jako SRT lub WebVTT. Następnie otwórz plik w edytorze, aby poprawić tekst i czasy wyświetlania. Transkrypcję i tłumaczenie automatyczne wykonuje się poza edytorem.",
      ],
    },
    "youtube-subtitles": {
      question: "Jak edytować napisy do filmu z YouTube?",
      answer: [
        "Zapisz napisy do filmu w formacie SRT lub WebVTT i otwórz je przez „Wczytaj napisy”. Jeśli korzystasz z yt-dlp, jego ",
        { link: "ytdlp", label: "opcje pobierania napisów" },
        " pozwalają wyświetlić i pobrać dostępne ścieżki. Aby sprawdzić synchronizację, wybierz „Wczytaj media” i otwórz lokalną kopię filmu.",
      ],
    },
    "why-this-editor": {
      question: "Skąd pomysł na kolejny edytor napisów?",
      answer: [
        "Przy pracy nad własnymi napisami wypróbowałem ",
        { link: "happyScribe", label: "Happy Scribe" },
        ", ",
        { link: "subtitleEdit", label: "Subtitle Edit" },
        " i ",
        { link: "aegisub", label: "Aegisub" },
        ". Chciałem móc otworzyć plik na Macu, zobaczyć falę dźwiękową i posłuchać, czy napis pojawia się we właściwym momencie. Zależało mi też na pracy bez instalacji i rejestracji. Dlatego stworzyłem ten edytor. Każdy może używać go bezpłatnie w przeglądarce i dostosować kod źródłowy do swoich potrzeb.",
      ],
    },
    contribute: {
      question: "Jak zgłosić problem albo pomóc w rozwoju edytora?",
      answer: [
        "Możesz ",
        { link: "issues", label: "zgłosić problem na GitHubie" },
        ". Podaj nazwę przeglądarki i opisz kolejne kroki, które prowadzą do błędu. W miarę możliwości przeglądam zgłoszenia i proponowane zmiany w kodzie. Zapraszam do współpracy nad ",
        { link: "repo", label: "otwartym kodem edytora" },
        ". Jeśli masz pomysł na nową funkcję, w ",
        { link: "scope", label: "dyskusji o zakresie projektu" },
        " wyjaśniam, na czym chcę się skupić.",
      ],
    },
  },
} satisfies FaqContent;

import heroFlag from "@/assets/hero-flag.jpg";
import newsPolitics from "@/assets/news-politics.jpg";
import newsBusiness from "@/assets/news-business.jpg";
import newsNature from "@/assets/news-nature.jpg";
import newsSociety from "@/assets/news-society.jpg";

export type Story = {
  title: string;
  section: string;
  author: string;
  time: string;
  image?: string;
  excerpt?: string;
};

export const NAV: { label: string; slug: string }[] = [
  { label: "መነሻ ገጽ", slug: "" },
  { label: "ዜና", slug: "news" },
  { label: "ፖለቲካ", slug: "politics" },
  { label: "ቢዝነስ", slug: "business" },
  { label: "ርዕሰ አንቀጽ", slug: "editorial" },
  { label: "ቆይታ", slug: "interview" },
  { label: "ማኅበራዊ", slug: "society" },
  { label: "ስፖርት", slug: "sport" },
  { label: "ኪንና ባህል", slug: "culture" },
  { label: "ቪዲዮ", slug: "video" },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  NAV.filter((n) => n.slug).map((n) => [n.slug, n.label]),
);

export const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/EThReporter" },
  { label: "Telegram", href: "https://t.me/EthiopianReporterAmharic" },
  { label: "X", href: "https://twitter.com/ethioreporter" },
  { label: "YouTube", href: "https://www.youtube.com/@ethiopiareporter" },
  { label: "TikTok", href: "https://www.tiktok.com/@ethiopianreporter" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/107230554" },
] as const;

export const LEAD: Story = {
  title: "የኢትዮጵያ ሰንደቅ ዓላማ ባለበት እንዲቀጥል ምክረ ሐሳብ ቀረበ",
  section: "ዜና",
  author: "ሃይማኖት ደስታ",
  time: "ነሐሴ 12 ቀን 2018",
  image: heroFlag,
  excerpt:
    "በ500 ቡድን ተመካካሪዎች መግባባት ላይ የተደረሰባቸውን ምክረሐሳቦች ለማጣጣም የተቋቋመው 15 አባላት ያሉት ቡድን፣ አሁን ያለው የኢትዮጵያ ሰንደቅ ዓላማ ባለበት ይቀጥል የሚል ምክረሐሳብ ማቅረቡ ተገለጸ።",
};

export const SIDE: Story[] = [
  {
    title: "በሙስና ወንጀል በሕግ ማስከበር ሒደት የሚታዩ ክፍተቶች ይፋ ተደረጉ",
    section: "ፖለቲካ",
    author: "ሲሳይ ሳህሉ",
    time: "ከ2 ሰዓት በፊት",
    image: newsPolitics,
  },
  {
    title: "ኢትዮጵያ በአሥር ዓመታት ከዓለም ባንክ 13.4 ቢሊዮን ዶላር እንድታገኝ መታቀዱ ተሰማ",
    section: "ቢዝነስ",
    author: "ናርዶስ ዮሴፍ",
    time: "ከ4 ሰዓት በፊት",
    image: newsBusiness,
  },
];

export const GRID: Story[] = [
  {
    title: "ለሥራ ወደ መካከለኛው ምሥራቅ የሚሄዱ ኢትዮጵያውያን ከ600 ሺሕ ብር በላይ እንደሚጠየቁ ተገለጸ",
    section: "ማኅበራዊ",
    author: "ሲሳይ ሳህሉ",
    time: "ዛሬ",
    image: newsSociety,
    excerpt: "ወደ ውጭ አገር በሕጋዊ መንገድ ለሚደረግ ጉዞ የሚጠየቀው ወጪ ከፍተኛ መሆኑ ተመልክቷል።",
  },
  {
    title: "የዱር እንስሳት ጥበቃን ለማጠናከር የ12 ሚሊዮን ዶላር ፕሮጀክት ይፋ ተደረገ",
    section: "ቢዝነስ",
    author: "ሃይማኖት ደስታ",
    time: "ዛሬ",
    image: newsNature,
    excerpt: "የተራቆቱ ሥነ ምኅዳሮችን መልሶ ለማቋቋም የሚያግዝ ፕሮጀክት መጀመሩ ተነገረ።",
  },
  {
    title: "ኬሚካሎችንና መድኃኒቶችን ጨምሮ አደገኛ ቁሳቁሶችን ያለ ቅድመ ፈቃድ ማንቀሳቀስ ተከለከለ",
    section: "ማኅበራዊ",
    author: "ሲሳይ ሳህሉ",
    time: "ትናንት",
    image: newsBusiness,
    excerpt: "አዲሱ መመርያ የደኅንነት ቁጥጥርን ለማጥበቅ ያለመ መሆኑ ተብራርቷል።",
  },
  {
    title: "የቡና ኤክስፖርት ገቢ አዲስ ክብረ ወሰን አስመዘገበ",
    section: "ቢዝነስ",
    author: "ናርዶስ ዮሴፍ",
    time: "ትናንት",
    image: newsNature,
    excerpt: "የዘንድሮው የግብይት ዘመን ከፍተኛ የውጭ ምንዛሪ ገቢ ማስገኘቱ ተገለጸ።",
  },
  {
    title: "ምርጫ 2018፦ የፓርቲዎች ዝግጅት በምን ደረጃ ላይ ነው?",
    section: "ፖለቲካ",
    author: "ሃይማኖት ደስታ",
    time: "ከ2 ቀን በፊት",
    image: newsPolitics,
    excerpt: "የምርጫ ቦርድ የጊዜ ሰሌዳና የፓርቲዎች ቅሬታ በዝርዝር።",
  },
  {
    title: "የከተማ ትራንስፖርት ማሻሻያው ምን ይዞ መጣ?",
    section: "ማኅበራዊ",
    author: "ብሌን አለሙ",
    time: "ከ3 ቀን በፊት",
    image: newsSociety,
    excerpt: "የአዲስ አበባ ነዋሪዎች ስለ አዲሱ የመስመር ሥርዓት ምን ይላሉ?",
  },
];

export const ALL_STORIES: Story[] = [LEAD, ...SIDE, ...GRID];

export const MOST_READ: string[] = [
  "የባንኮች የውጭ ምንዛሪ ገበያ ተለዋዋጭነት ምን ያሳያል?",
  "ምርጫ 2018፦ የፓርቲዎች ዝግጅት በምን ደረጃ ላይ ነው?",
  "የአዲስ አበባ የቤት ኪራይ ጭማሪና የነዋሪው ጫና",
  "የቡና ኤክስፖርት ገቢ አዲስ ክብረ ወሰን አስመዘገበ",
  "የከተማ ትራንስፖርት ማሻሻያው ምን ይዞ መጣ?",
];

export const OPINION = [
  { title: "ምክክሩ ውጤታማ እንዲሆን ምን ይጠበቃል?", author: "ርዕሰ አንቀጽ" },
  { title: "የኢኮኖሚ ማሻሻያው ሁለተኛ ምዕራፍ", author: "ዓምደኛ · ተስፋዬ ገብረ" },
  { title: "ወጣቶችና የሥራ ዕድል ፈጠራ ጥያቄ", author: "ዓምደኛ · ብሌን አለሙ" },
];

export const BREAKING = [
  "የኢትዮጵያ ሰንደቅ ዓላማ ባለበት እንዲቀጥል ምክረ ሐሳብ ቀረበ",
  "የሥራ ቋንቋዎች ከ13 ወደ አምስት እንዲጠጋጉ ተደርጓል",
  "ኢትዮጵያ በአሥር ዓመታት ከዓለም ባንክ 13.4 ቢሊዮን ዶላር እንድታገኝ መታቀዱ ተሰማ",
  "አደገኛ ቁሳቁሶችን ያለ ቅድመ ፈቃድ ማንቀሳቀስ ተከለከለ",
];

export function storySlug(title: string): string {
  return title.trim().replace(/\s+/g, "-").slice(0, 80);
}

export function findStory(slug: string): Story | undefined {
  return ALL_STORIES.find((s) => storySlug(s.title) === slug);
}

export const SECTION_TO_SLUG: Record<string, string> = Object.fromEntries(
  NAV.filter((n) => n.slug).map((n) => [n.label, n.slug]),
);

export function storiesForCategory(slug: string): Story[] {
  const label = CATEGORY_LABEL[slug];
  const matched = ALL_STORIES.filter((s) => s.section === label);
  return matched.length ? matched : ALL_STORIES;
}

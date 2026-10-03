import {
  siAngular,
  siAnthropic,
  siBehance,
  siBluesky,
  siBun,
  siCelery,
  siCloudflare,
  siCss,
  siDart,
  siDeno,
  siDevdotto,
  siDigitalocean,
  siDiscord,
  siDjango,
  siDocker,
  siDribbble,
  siElasticsearch,
  siElectron,
  siExpo,
  siExpress,
  siFastapi,
  siFigma,
  siFirebase,
  siFlask,
  siFlutter,
  siGit,
  siGithub,
  siGithubactions,
  siGitlab,
  siGmail,
  siGo,
  siGooglecloud,
  siGooglegemini,
  siGraphql,
  siHashnode,
  siHtml5,
  siHuggingface,
  siInstagram,
  siJavascript,
  siJest,
  siKaggle,
  siKotlin,
  siKubernetes,
  siLangchain,
  siLaravel,
  siLeetcode,
  siLinux,
  siMedium,
  siMongodb,
  siMongoosedotws,
  siMysql,
  siN8n,
  siNestjs,
  siNetlify,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siNotion,
  siNpm,
  siNumpy,
  siOllama,
  siPandas,
  siPhp,
  siPnpm,
  siPostgresql,
  siPostman,
  siPrisma,
  siPython,
  siPytorch,
  siQuickbooks,
  siRabbitmq,
  siReact,
  siRedis,
  siRedux,
  siRust,
  siSass,
  siSelenium,
  siSentry,
  siSocketdotio,
  siSqlite,
  siStackoverflow,
  siStripe,
  siSupabase,
  siSvelte,
  siSwift,
  siTailwindcss,
  siTauri,
  siTelegram,
  siTensorflow,
  siTerraform,
  siTrpc,
  siTypescript,
  siUpwork,
  siVercel,
  siVite,
  siVuedotjs,
  siWhatsapp,
  siX,
  siYoutube,
  siZod,
} from 'simple-icons';

/**
 * Monochrome brand marks, drawn in `currentColor` so they take whatever
 * token the surrounding text uses — never a brand's own hex (AGENTS.md §4
 * rule 2), which would also turn a stack list into a rainbow.
 *
 * A curated set of named imports rather than the whole of simple-icons:
 * the full package is ~5 MB of path data and named imports tree-shake
 * down to just these. A stack item with no entry here renders as a plain
 * tag, which is the correct fallback, not a bug — to give a new one an
 * icon, add its import to TECH below. simple-icons no longer carries some
 * marks at their owners' request (LinkedIn, AWS, OpenAI, Microsoft); those
 * stay plain unless drawn here by hand, as LinkedIn is.
 */
export interface BrandIconData {
  title: string;
  path: string;
  /** Drawn as an outline rather than filled — for the generic glyphs below. */
  stroke?: boolean;
  /**
   * Inner shapes punch holes in the outer one. Only for the hand-drawn
   * marks here: simple-icons paths are authored for the default nonzero
   * rule, and some render wrong under evenodd.
   */
  evenOdd?: boolean;
}

/**
 * Hand-drawn, not from simple-icons (removed there at LinkedIn's request).
 * LinkedIn's brand guidelines allow the mark for linking to a profile,
 * which is the only thing it is used for here.
 */
const LINKEDIN: BrandIconData = {
  title: 'LinkedIn',
  evenOdd: true,
  path:
    'M20.4 2H3.6A1.6 1.6 0 0 0 2 3.6v16.8A1.6 1.6 0 0 0 3.6 22h16.8a1.6 1.6 0 0 0 1.6-1.6V3.6A1.6 1.6 0 0 0 20.4 2z' +
    'M7 5.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM5.6 9.8h2.8v8.6H5.6z' +
    'M10.4 9.8H13V11c.5-.8 1.5-1.4 2.8-1.4 2.4 0 3.2 1.6 3.2 3.9v4.9h-2.7v-4.3c0-1.2-.3-2-1.4-2-1.2 0-1.8.9-1.8 2.1v4.2h-2.7z',
};

/** A plain envelope — email is a protocol, not a brand. */
const EMAIL: BrandIconData = {
  title: 'Email',
  path: 'M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5',
  stroke: true,
};

/** Keyed by normalizeName() of each icon's own title, plus a few aliases. */
const TECH = new Map<string, BrandIconData>();
for (const icon of [
  siAngular,
  siAnthropic,
  siBun,
  siCelery,
  siCloudflare,
  siCss,
  siDart,
  siDeno,
  siDigitalocean,
  siDjango,
  siDocker,
  siElasticsearch,
  siElectron,
  siExpo,
  siExpress,
  siFastapi,
  siFigma,
  siFirebase,
  siFlask,
  siFlutter,
  siGit,
  siGithub,
  siGithubactions,
  siGitlab,
  siGmail,
  siGo,
  siGooglecloud,
  siGooglegemini,
  siGraphql,
  siHtml5,
  siHuggingface,
  siJavascript,
  siJest,
  siKotlin,
  siKubernetes,
  siLangchain,
  siLaravel,
  siLinux,
  siMongodb,
  siMongoosedotws,
  siMysql,
  siN8n,
  siNestjs,
  siNetlify,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siNotion,
  siNpm,
  siNumpy,
  siOllama,
  siPandas,
  siPhp,
  siPnpm,
  siPostgresql,
  siPostman,
  siPrisma,
  siPython,
  siPytorch,
  siQuickbooks,
  siRabbitmq,
  siReact,
  siRedis,
  siRedux,
  siRust,
  siSass,
  siSelenium,
  siSentry,
  siSocketdotio,
  siSqlite,
  siStripe,
  siSupabase,
  siSvelte,
  siSwift,
  siTailwindcss,
  siTauri,
  siTelegram,
  siTensorflow,
  siTerraform,
  siTrpc,
  siTypescript,
  siVercel,
  siVite,
  siVuedotjs,
  siWhatsapp,
  siZod,
]) {
  TECH.set(normalizeName(icon.title), { title: icon.title, path: icon.path });
}
// How these are commonly written in a stack list, where it differs from
// the official title the map is keyed on.
for (const [alias, title] of [
  ['postgres', 'postgresql'],
  ['node', 'nodejs'],
  ['tailwind', 'tailwindcss'],
  ['golang', 'go'],
  ['vue', 'vuejs'],
  ['k8s', 'kubernetes'],
  ['nest', 'nestjs'],
] as const) {
  const icon = TECH.get(title);
  if (icon) TECH.set(alias, icon);
}

/** "Next.js" → "nextjs", "Tailwind CSS" → "tailwindcss". */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** The mark for a stack item as written in a project, or undefined. */
export function techIcon(name: string): BrandIconData | undefined {
  return TECH.get(normalizeName(name));
}

const SOCIAL_HOSTS: [string, BrandIconData][] = [
  ['github.com', siGithub],
  ['gitlab.com', siGitlab],
  ['linkedin.com', LINKEDIN],
  ['x.com', siX],
  ['twitter.com', siX],
  ['bsky.app', siBluesky],
  ['medium.com', siMedium],
  ['dev.to', siDevdotto],
  ['hashnode.com', siHashnode],
  ['stackoverflow.com', siStackoverflow],
  ['leetcode.com', siLeetcode],
  ['kaggle.com', siKaggle],
  ['youtube.com', siYoutube],
  ['instagram.com', siInstagram],
  ['behance.net', siBehance],
  ['dribbble.com', siDribbble],
  ['discord.gg', siDiscord],
  ['discord.com', siDiscord],
  ['t.me', siTelegram],
  ['wa.me', siWhatsapp],
  ['upwork.com', siUpwork],
];

/**
 * The mark for a social link, from where it points rather than from its
 * label — labels are free text in the admin ("GitHub", "Code", "My
 * GitHub"), the host is not. `/whatsapp` is this site's own redirect.
 */
export function socialIcon(href: string): BrandIconData | undefined {
  if (href.startsWith('mailto:')) return EMAIL;
  if (href === '/whatsapp') return { title: siWhatsapp.title, path: siWhatsapp.path };
  let host: string;
  try {
    host = new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
  const match = SOCIAL_HOSTS.find(([h]) => host === h || host.endsWith(`.${h}`));
  return match ? { title: match[1].title, path: match[1].path } : undefined;
}

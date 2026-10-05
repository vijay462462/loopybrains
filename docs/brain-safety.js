// Loopy Search safety: sexual and romantic requests are not allowed. Pure function, no network.
// Study topics stay open: anatomy, health, law, history of art and literature, carbon dating and so on.
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };
export function normalise(t) {
  let s = String(t || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[01345@$7!]/g, (c) => LEET[c]);
  s = s.replace(/\b((?:[a-z][\s.\-_*]+){2,}[a-z])\b/g, (m) => m.replace(/[\s.\-_*]+/g, ""));   // "p o r n", "s.e.x"
  s = s.replace(/(\w)[.\-_*]+(?=\w)/g, "$1").replace(/([a-z])\1{2,}/g, "$1").replace(/\s+/g, " ").trim();
  return s;
}
const EXPLICIT = /\b(porn\w*|pron|xxx+|nudes?|nudity|naked|nsfw|erotic\w*|hentai|onlyfans|escorts?|callgirls?|prostitut\w*|boobs?|breasts? (?:pics?|photos?|videos?|show)|penis (?:pics?|size)|pussy|blowjob|handjob|orgasm\w*|masturbat\w*|fetish\w*|hookups?|sexting|sexcam|stripper\w*|strip ?tease|cumshot|milf|threesome|bdsm|camgirls?|adult (?:video|film|movie|content|site)|blue ?films?|bf video|sex (?:video|videos|story|stories|chat|tips|position\w*|pics?|photos?|movie|scene|site|toy\w*|with|call|talk|app|girl|friend)|have sex|having sex|make love|making love|chudai|chut|bhabhi sex|desi (?:hot|sex|aunty)|hot (?:girls?|aunty|aunties|models?|videos?)|sexy (?:girls?|videos?|photos?|pics?))\b/;
const ROMANTIC = /\b(girl ?friends?|boy ?friends?|(?:online )?dating (?:app|apps|site|sites|tips|advice|a girl|a boy|someone)|date a (?:girl|boy)|love letters?|propos(?:e|ing) (?:to )?(?:a |my )?(?:girl|boy|crush)|impress (?:a |my )?(?:girl|boy|crush)|(?:my|his|her) crush|crush on|flirt\w*|seduc\w*|romance|romantic|love stor(?:y|ies)|couple goals|relationship (?:advice|tips)|valentines?|honeymoon\w*|pick ?up lines?|love quotes?|love status|how to kiss|kissing|first kiss|french kiss|make out|making out|break ?up (?:advice|tips|message)|ex ?(?:girlfriend|boyfriend)|propose day|rose day|hug day|kiss day|i love you|love you)\b/;
const ACADEMIC = /\b(reproduct\w*|anatom\w*|biolog\w*|physiolog\w*|hormon\w*|pubert\w*|contracepti\w*|sti|std|stis|stds|hiv|aids|pcos|menstru\w*|pregnan\w*|gestation|fertili\w*|embryo\w*|genetic\w*|chromosom\w*|sexual (?:harassment|assault|offences?|offenses?|violence|abuse|health|dimorphism|selection)|sex (?:ratio|determination|chromosomes?|linked|education|discrimination|trafficking law)|gender (?:equality|studies|bias)|posh act|pocso|consent law|romanticism|romantic (?:era|period|movement|poet|poets|poetry|literature|music|composer|composers|painting)|breast cancer|cancer|carbon dating|radiometric|potassium argon|uranium lead|isotope|archaeolog\w*|geolog\w*|fossil|school|exam|syllabus|lecture|theorem|algorithm|equation)\b/;
const DATING_SCIENCE = /\b(carbon|radiometric|potassium|uranium|isotope|archaeolog\w*|geolog\w*|fossil|rock|tree ring)\b.*\bdating\b|\bdating\b.*\b(method|methods|technique|techniques|of (?:rocks|fossils|artifacts))\b/;
const HARD = /\b(porn\w*|pron|xxx+|nudes?|nsfw|erotic\w*|hentai|onlyfans|escorts?|callgirls?|blowjob|handjob|cumshot|milf|threesome|bdsm|camgirls?|sexting|sexcam|stripper\w*|pussy|boobs?|chudai|chut|sex (?:video|videos|story|stories|chat|tips|position\w*|pics?|photos?|movie|scene|site|toy\w*|call|talk|app|girl)|blue ?films?|bf video|have sex|having sex)\b/;
// Returns { ok: true } or { ok: false, kind: "sexual" | "romantic" }
export function checkQuery(text) {
  const raw = String(text || "").toLowerCase(), n = normalise(text);
  for (const s of [raw, n]) {
    if (HARD.test(s)) return { ok: false, kind: "sexual" };
    if (EXPLICIT.test(s) && !ACADEMIC.test(s)) return { ok: false, kind: "sexual" };
    if (/\bdating\b/.test(s) && !DATING_SCIENCE.test(s)) { if (ROMANTIC.test(s) || !ACADEMIC.test(s)) return { ok: false, kind: "romantic" }; }
    if (ROMANTIC.test(s) && !ACADEMIC.test(s)) return { ok: false, kind: "romantic" };
  }
  return { ok: true };
}

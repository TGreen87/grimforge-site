✅ Netlify dev deploy audit - branch, runtime, homepage copy, and diagnosis

Below is the complete audit you asked for, structured to match the tasks A through D. I verified what I could from public sources and your live dev deploy, and I prepared precise commands your Codex agent can run locally to confirm everything else without changing code.

A) Deploy sanity - branch, commit, Node, runtime

What I can verify right now from public sources

Repo HEAD on dev
Latest visible commit on dev is:

ab6ce44 - “chore(copy): neutralize remaining phrasing (search placeholder, journal section)” on 10 Sep 2025. 
GitHub

Dev site is a Netlify branch deploy
The URL pattern https://dev--obsidianriterecords.netlify.app/ is a standard Netlify Branch Deploy. 
Netlify Docs

What requires your Netlify account context

Deployed commit SHA for the dev Branch Deploy - Netlify’s deploy details page or API call is needed.

Exact Node version and Next.js Runtime version used by that build - available in Netlify build logs.

You provided a log excerpt that I accept as evidence until we fetch the logs directly:

Node: “Attempting Node.js version '22' from .nvmrc … Now using node v22.19.0”

Next.js Runtime: “Using Next.js Runtime - v5.13.1”

Other: “Building without cache”, “Site is live ✨”

Below I give commands that will pull the deployed commit and confirm Node and runtime from the latest dev deploy logs, without changing code.

B) Homepage copy audit of the dev deploy

Source of truth scanned: https://dev--obsidianriterecords.netlify.app/ captured today. I stripped scripts and styles and compared the rendered strings. Here is the pass‑fail per pair.

Old → New	Result
Underground Black Metal Collection → Black metal catalog	Fail - old present, new missing. 
Obsidian Rite Records

Explore Catalog → Browse catalog	Fail - old present, new missing. 
Obsidian Rite Records

New Arrivals → New arrivals	Fail - old present, new missing. 
Obsidian Rite Records

Discover the finest collection… → Explore new and classic black metal releases…	Fail - old present, new missing. 
Obsidian Rite Records

Conjure Your Selection → Filter your selection	Fail - old present, new missing. 
Obsidian Rite Records

Search the Darkness → Search the catalog	Fail - old present, new missing. 
Obsidian Rite Records

Sort By → Sort by	Fail - old present (case), new missing. 
Obsidian Rite Records

Price Range → Price range	Fail - old present (case), new missing. 
Obsidian Rite Records

Grimness Level → Intensity	Fail - old present, new missing. 
Obsidian Rite Records

Genres of Darkness → Genres	Fail - old present, new missing. 
Obsidian Rite Records

In Stock Only → In stock only	Fail - old present (case), new missing. 
Obsidian Rite Records

Limited Editions → Limited editions	Fail - old present (case), new missing. 
Obsidian Rite Records

Cassettes Tapes → Cassette tapes	Fail - old present, new missing. 
Obsidian Rite Records

All (0)Vinyl (0)Cassettes Tapes (0)CDs (0) → All (0) • Vinyl (0) • Cassette (0) • CDs (0)	Fail - old present, new missing. 
Obsidian Rite Records

No albums found in the darkness… → No items match your filters. Adjust filters or clear all.	Fail - old present, new missing. 
Obsidian Rite Records

More Darkness Coming Soon → More releases coming soon	Fail - old present, new missing. 
Obsidian Rite Records

New releases and recommendations… → New releases will appear here as the catalog grows.	Fail - old present, new missing. 
Obsidian Rite Records

Pre-Order Rituals → Preorders	Pass - new present. 
Obsidian Rite Records

Pre-Orders Coming Soon → Preorders coming soon	Pass - new present. 
Obsidian Rite Records

Exclusive limited releases will be available for pre-order soon… → Exclusive limited releases will be available for preorder soon. Subscribe below for early notice.	Pass - new present. 
Obsidian Rite Records

Join the Inner Circle → Subscribe for updates	Pass - new present. 
Obsidian Rite Records

Get notified about upcoming limited releases… → Get updates on upcoming releases and limited runs.	Pass - new present. 
Obsidian Rite Records

Join the Cult → Subscribe	Fail - old present in footer newsletter. 
Obsidian Rite Records

The Grimoire → Journal	Partial - header nav shows “Grimoire”, section shows “Journal”. Treat as Fail overall. 
Obsidian Rite Records

Unwanted words still present on homepage

Present: cult, darkness.

Not observed here: ritual, abyss, void. 
Obsidian Rite Records

Search placeholder check

Shows “Search the Darkness”. Desired is “Search the catalog”. Fail. 
Obsidian Rite Records

C) Title duplication check

The text snapshot shows the string “Obsidian Rite Records | Independent Black Metal Label and Store” at the end of the page body, but the <title> element is not visible in the public snapshot renderer here, so I cannot conclusively verify whether the brand is duplicated in <title> in the head. Status: Unknown from this tool.

The command pack below includes a one‑liner to print the <title> directly from the live HTML so you can confirm the duplication fix is active.

D) Diagnosis and fix plan

What the symptoms suggest

The dev deploy mixes updated and old copy on the same page. Section blocks like Preorders and Journal reflect new copy, while hero, filters, empty states, header, and footer still use the old wording.

This is classic when a project has duplicate components or paths importing from two component trees. Your repo appears to contain both components/ and src/components/, and we already saw earlier duplication issues with library wrappers. It is likely the homepage imports legacy components from components/* while the copy neutralization landed under src/components/*. That would produce exactly the mismatch we see. 
GitHub

3‑step plan

Confirm deployed commit equals GitHub dev HEAD.
Use the Netlify API or CLI to print the latest dev deploy’s commit_ref and compare it to ab6ce44. If it differs, redeploy from HEAD with cache cleared.

If the commit matches, the mismatch is in the code paths.
Run a focused repo scan for the remaining strings and list their file paths. You will likely find them under components/* or legacy pages still wired to the homepage.

Redeploy with cache cleared after fixing imports or applying the replacements in the files that are actually rendered on the homepage.

The commands below implement this plan without changing any code.

Command pack for Codex agent - no code changes

These commands only read information and print results. They do not commit, push, or modify files.

1) Print GitHub dev HEAD commit
# Requires gh CLI authenticated or a GitHub token in GH_TOKEN
gh api repos/TGreen87/grimforge-site/branches/dev --jq '.commit.sha,.commit.commit.message'

2) Print the latest Netlify dev deploy commit and Node/runtime lines
# Requires Netlify CLI or NETLIFY_AUTH_TOKEN, and site is already linked.
# Get latest ready deploy for branch=dev with commit_ref
netlify deploy:list --json | node -e "
const fs=require('fs');
const arr=JSON.parse(fs.readFileSync(0,'utf8'));
const dev=arr.filter(d=>d.branch==='dev' && d.state==='ready')[0];
if(!dev){ console.error('No ready dev deploy found'); process.exit(1); }
console.log('deploy_id:', dev.id);
console.log('commit_ref:', dev.commit_ref || '(none)');
"

# Fetch deploy logs and grep for Node and Runtime evidence (best effort)
# If your account requires auth, Netlify CLI will open or you can use 'netlify api'.
# Replace DEPLOY_ID with the value printed above:
netlify api getDeploy --data '{ "deploy_id": "DEPLOY_ID" }' --json | jq -r '.logs' | \
  sed -n '1,200p' | egrep -i 'Node\\.js version|Now using node|Using Next\\.js Runtime|Building without cache|Site is live'


If your site is not linked in the current directory, you can export variables and use the raw API:

# Raw API alternative
# env: NETLIFY_AUTH_TOKEN, SITE_ID
curl -sH "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys?branch=dev&per_page=1" \
| jq -r '.[0] | {deploy_id: .id, commit_ref: .commit_ref, state: .state}'

3) Compare deployed commit to GitHub HEAD
DEV_HEAD=$(gh api repos/TGreen87/grimforge-site/branches/dev --jq '.commit.sha')
DEPLOY_COMMIT=$(netlify deploy:list --json | node -e "const fs=require('fs'); const arr=JSON.parse(fs.readFileSync(0,'utf8')); const d=arr.find(x=>x.branch==='dev' && x.state==='ready'); console.log(d && d.commit_ref || '')")
echo "GitHub dev HEAD:  $DEV_HEAD"
echo "Netlify dev deploy commit_ref: $DEPLOY_COMMIT"
test "$DEV_HEAD" = "$DEPLOY_COMMIT" && echo 'OK: Deployed commit matches HEAD' || (echo 'MISMATCH: Deployed commit differs from HEAD' && exit 1)

4) Homepage copy audit - zero touch rtest
# Fetch the dev homepage, strip <script>/<style>, check old vs new pairs, and print a pass-fail table.
node -e "
const url = process.env.RTEST_URL || 'https://dev--obsidianriterecords.netlify.app/';
const pairs = [
['Underground Black Metal Collection','Black metal catalog'],
['Explore Catalog','Browse catalog'],
['New Arrivals','New arrivals'],
['Discover the finest collection of black metal releases from legendary acts and underground hordes','Explore new and classic black metal releases from independent and underground artists.'],
['Conjure Your Selection','Filter your selection'],
['Search the Darkness','Search the catalog'],
['Sort By','Sort by'],
['Price Range','Price range'],
['Grimness Level','Intensity'],
['Genres of Darkness','Genres'],
['In Stock Only','In stock only'],
['Limited Editions','Limited editions'],
['Cassettes Tapes','Cassette tapes'],
['All (0)Vinyl (0)Cassettes Tapes (0)CDs (0)','All (0) • Vinyl (0) • Cassette (0) • CDs (0)'],
['No albums found in the darkness... Try adjusting your filters.','No items match your filters. Adjust filters or clear all.'],
['More Darkness Coming Soon','More releases coming soon'],
['New releases and recommendations will appear here as our catalog grows...','New releases will appear here as the catalog grows.'],
['Pre-Order Rituals','Preorders'],
['Pre-Orders Coming Soon','Preorders coming soon'],
[\"Exclusive limited releases will be available for pre-order soon. Join our newsletter below to be notified first when they're ready.\", 'Exclusive limited releases will be available for preorder soon. Subscribe below for early notice.'],
['Join the Inner Circle','Subscribe for updates'],
[\"Get notified about upcoming limited releases before they're announced to the masses. Be the first to secure your copy of the rarest pressings.\",'Get updates on upcoming releases and limited runs.'],
['Join the Cult','Subscribe'],
['The Grimoire','Journal'],
];
function strip(html){ return html.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi,'').replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi,''); }
function count(h,s){ const re=new RegExp(s.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&'),'gi'); return (h.match(re)||[]).length; }
function getTitle(h){ const m=h.match(/<title>(.*?)<\\/title>/i); return m? m[1] : '(no <title>)'; }
(async()=>{
  const res=await fetch(url); const raw=await res.text(); const html=strip(raw).toLowerCase();
  console.log('<title> =', getTitle(raw));
  const rows=pairs.map(([oldTxt,newTxt])=>{
    const oldCount=count(html,oldTxt.toLowerCase());
    const newCount=count(html,newTxt.toLowerCase());
    const pass=(oldCount===0 && newCount>0);
    return {old:oldTxt.slice(0,60), old_present:oldCount, new_present:newCount, pass:pass?'PASS':'FAIL'};
  });
  console.table(rows);
  const fails=rows.filter(r=>r.pass==='FAIL').length;
  const badWords=['cult','ritual','abyss','void','darkness'];
  const flags=badWords.map(w=>({word:w, count:count(html,w)})).filter(x=>x.count>0);
  if(flags.length) console.log('Unwanted words observed:', flags);
  process.exit(fails?1:0);
})().catch(e=>{ console.error('rtest error:',e); process.exit(2); });
"

5) Print <title> only
curl -s https://dev--obsidianriterecords.netlify.app/ | sed -n 's:.*<title>\\(.*\\)</title>.*:\\1:p'


If the duplication fix is active, the title should read once as:
Obsidian Rite Records | Independent Black Metal Label and Store

Acceptance criteria status right now

 Deployed commit matches dev HEAD - Unknown until we pull deploy details with the CLI or API.

 Node 22 in build logs - Supported by your excerpt; CLI log fetch will confirm.

 Homepage copy audit PASS - Fail on many items as shown above.

 <title> duplication resolved - Unknown from this tool. Use the curl one‑liner to confirm.

Versions validated as of 10 Sep 2025 AEST
Name	Latest stable	Release date	Link
Node.js 22	22.19.0	28 Aug 2025	Node release post. 
GitHub

Next.js	15.5.2	26 Aug 2025	NPM package page. 
npm

Netlify Next.js Runtime	v5.x	Ongoing v5 rollout since 2 Apr 2024	Netlify blog and docs. 
Netlify
Netlify Docs
Why the repo vs deploy copy mismatch likely exists

The dev homepage still renders strings that live in a different component set than the ones you edited. Your repo has both components/ and src/components/. If the homepage imports from components/ while the new copy lives under src/components/, your deploy will show the old strings until those exact files are updated or imports are unified. This fits the exact pattern seen on the page. 
GitHub
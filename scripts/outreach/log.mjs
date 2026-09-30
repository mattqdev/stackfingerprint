// scripts/outreach/log.mjs
// Records what happened with a repo so it's never contacted twice.
//
//   node scripts/outreach/log.mjs owner/repo sent|skipped|accepted|declined
//   node scripts/outreach/log.mjs            (prints the log)
import { WEEKLY_CAP, readLog, sentThisWeek, writeJSON } from "./lib.mjs";

const STATUSES = ["sent", "skipped", "accepted", "declined"];
const [repo, status] = process.argv.slice(2);
const log = readLog();

if (!repo) {
  for (const e of log)
    console.log(`${e.date.slice(0, 10)}  ${e.status.padEnd(8)}  ${e.repo}`);
  console.log(`\nsent this week: ${sentThisWeek(log)}/${WEEKLY_CAP}`);
  process.exit(0);
}
if (!STATUSES.includes(status)) {
  console.error(`status must be one of: ${STATUSES.join(", ")}`);
  process.exit(1);
}

log.push({ repo, status, date: new Date().toISOString() });
writeJSON("log.json", log);
console.log(
  `${repo} → ${status} (sent this week: ${sentThisWeek(log)}/${WEEKLY_CAP})`
);

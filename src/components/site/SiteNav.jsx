import { Lockup } from "../brand/Brand";
import { GitHubIcon } from "./Icons";
import { GITHUB_REPO, ACTION_URL } from "../../data/site";

// Shared top bar. `howHref` lets the home page keep its in-page anchor.
export default function SiteNav({ howHref = "/#how" }) {
  return (
    <nav className="sf-nav">
      <div className="sf-container sf-nav-inner">
        <a href="/" aria-label="Stack Fingerprint — home">
          <Lockup size={34} />
        </a>
        <div className="sf-nav-links">
          <a className="sf-nav-link hide-sm" href={howHref}>
            How it works
          </a>
          <a className="sf-nav-link" href="/blog">
            Blog
          </a>
          <a className="sf-nav-link hide-sm" href="/tech">
            Tech
          </a>
          <a
            className="sf-nav-link hide-sm"
            href={ACTION_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Action
          </a>
          <a
            className="sf-btn sf-btn-ghost sf-btn-sm"
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon size={14} /> Star
          </a>
        </div>
      </div>
    </nav>
  );
}

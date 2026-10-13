import { Lockup, Monogram } from "../brand/Brand";
import { GITHUB_REPO, DOCS_URL, ACTION_URL } from "../../data/site";

export default function SiteFooter() {
  return (
    <footer className="sf-footer">
      <div className="sf-container sf-footer-inner">
        <div>
          <Lockup size={30} />
          <div className="sf-footer-links">
            <a href="/blog">Blog</a>
            <a href="/tech">Technologies</a>
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              Docs
            </a>
            <a href={ACTION_URL} target="_blank" rel="noopener noreferrer">
              GitHub Action
            </a>
            <a
              href={`${GITHUB_REPO}/issues/new/choose`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Report an issue
            </a>
            <a href="/blog/rss.xml">RSS</a>
            <a href="/schema.json">Config schema</a>
          </div>
          <p className="sf-footer-note">
            Made by mattqdev · Not affiliated with GitHub
          </p>
        </div>
        <Monogram />
      </div>
    </footer>
  );
}

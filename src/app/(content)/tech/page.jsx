import { getAllTechs, getTechsByCategory } from "../../../lib/tech";
import { TechPills } from "../../../components/blog/MdxComponents";
import JsonLd from "../../../components/site/JsonLd";
import { TECH_CONTENT_UPDATED } from "../../../data/techContent.mjs";
import { Eyebrow } from "../../../components/brand/Brand";
import { SITE_URL } from "../../../data/site";

const count = getAllTechs().length;
const DESCRIPTION = `Every technology Stack Fingerprint detects in a GitHub repo: ${count} frameworks, languages, databases, build tools and services, with the files and dependencies each one is detected from.`;

export const metadata = {
  title: "Supported technologies — what Stack Fingerprint detects",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/tech` },
};

export default function TechIndex() {
  const groups = getTechsByCategory();
  return (
    <div className="sf-container sf-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Technologies detected by Stack Fingerprint",
          url: `${SITE_URL}/tech`,
          description: DESCRIPTION,
          dateModified: TECH_CONTENT_UPDATED,
        }}
      />
      <header className="sf-page-head">
        <Eyebrow index="01">Technologies</Eyebrow>
        <h1 className="sf-display sf-h1">{count} technologies, one scan.</h1>
        <p className="sf-lead">{DESCRIPTION}</p>
      </header>
      <div className="sf-tech-groups">
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="sf-tech-group">
            <h2 className="sf-label">
              {g.label} <span>{g.techs.length}</span>
            </h2>
            <TechPills techs={g.techs} />
          </section>
        ))}
      </div>
    </div>
  );
}

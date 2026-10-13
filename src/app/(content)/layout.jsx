import SiteNav from "../../components/site/SiteNav";
import SiteFooter from "../../components/site/SiteFooter";

// Shell for the server-rendered content sections (/blog, /tech).
export default function ContentLayout({ children }) {
  return (
    <>
      <div className="sf-canvas" aria-hidden="true" />
      <div className="sf-shell">
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}

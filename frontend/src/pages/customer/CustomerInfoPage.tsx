import { useLocation } from "react-router-dom";
import { INFO_PAGES, type InfoPageKey } from "../../constants/infoPages";

export default function CustomerInfoPage() {
  const location = useLocation();
  const slug = location.pathname.split("/").pop() as InfoPageKey | undefined;
  const page = slug ? INFO_PAGES[slug] : undefined;

  if (!page) {
    return <p className="text-spa-muted">Không tìm thấy trang thông tin.</p>;
  }

  return (
    <article className="rounded-2xl bg-spa-white p-6 shadow-sm sm:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-spa-accent">Lumina Spa</p>
      <h2 className="mt-2 text-3xl font-semibold text-spa-dark">{page.title}</h2>
      <p className="mt-4 leading-7 text-spa-muted">{page.intro}</p>
      <div className="mt-8 space-y-6">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="text-lg font-semibold text-spa-dark">{section.heading}</h3>
            <p className="mt-2 leading-7 text-spa-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}

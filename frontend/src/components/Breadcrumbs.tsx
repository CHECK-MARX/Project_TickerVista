import { Link, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../data/navigation";

const navMap = NAV_ITEMS.reduce<Record<string, string>>((acc, item) => {
  acc[item.path] = item.label;
  return acc;
}, {});

const toTitle = (segment: string) => {
  return segment
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    return {
      path,
      label: navMap[path] ?? toTitle(segment)
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            Home
          </Link>
        </li>
        {crumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center gap-2">
            <span>/</span>
            {index === crumbs.length - 1 ? (
              <span className="text-slate-900 dark:text-white">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

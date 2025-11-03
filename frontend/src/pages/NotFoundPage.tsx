import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";

const NotFoundPage = () => (
  <Card className="text-center">
    <p className="text-xl font-semibold text-slate-900 dark:text-white">404 - Page not found</p>
    <p className="mt-2 text-sm text-slate-500">The page you requested does not exist.</p>
    <Link to="/" className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
      Back to dashboard
    </Link>
  </Card>
);

export default NotFoundPage;

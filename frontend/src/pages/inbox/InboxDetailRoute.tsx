import { useLocation } from "react-router-dom";
import InboxDetailPage from "./InboxDetailPage";

export default function InboxDetailRoute() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const listPath = segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : "/customer/inbox";
  return <InboxDetailPage listPath={listPath} />;
}
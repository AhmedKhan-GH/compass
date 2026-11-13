import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import "@/components/site.css";

export default function NotFound() {
  return (
    <SiteFrame trail={["Not found"]}>
      <div className="site-page">
        <h1 className="sb-page-title">Not found</h1>
        <p className="not-found-link">
          <Link href="/">Courses</Link>
        </p>
      </div>
    </SiteFrame>
  );
}

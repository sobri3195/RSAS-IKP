import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import PublicReport, { TrackReport } from "../pages/PublicReport";
import {
  CommitteeEnroll,
  CommitteeGuard,
  CommitteeLogin,
} from "../pages/CommitteeAuth";
const CommitteeLayout = lazy(() =>
  import("../pages/CommitteeDashboard").then((m) => ({
    default: m.CommitteeLayout,
  })),
);
const Dashboard = lazy(() => import("../pages/CommitteeDashboard"));
const Detail = lazy(() => import("../pages/CommitteeDetail"));
const Tools = lazy(() => import("../pages/CommitteeTools"));
const Catalog = lazy(() => import("../pages/QualityCatalog"));
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <ScrollReset />
      <Suspense
        fallback={
          <div className="loading-state" role="status">
            Memuat RSAS…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/lapor" replace />} />
          <Route path="/lapor" element={<PublicReport />} />
          <Route path="/lacak" element={<TrackReport />} />
          <Route path="/komite/login" element={<CommitteeLogin />} />
          <Route path="/komite/aktivasi" element={<CommitteeEnroll />} />
          <Route element={<CommitteeGuard />}>
            <Route path="/komite" element={<CommitteeLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="laporan/:id" element={<Detail />} />
              <Route path="qr" element={<Tools mode="qr" />} />
              <Route path="audit" element={<Tools mode="audit" />} />
              <Route path="akun" element={<Tools mode="accounts" />} />
              <Route path="unit" element={<Tools mode="units" />} />
              <Route path="data" element={<Tools mode="data" />} />
              <Route path="indikator-mutu" element={<Catalog />} />
              <Route path="indikator-mutu/:id" element={<Catalog />} />
              <Route
                path="*"
                element={<Navigate to="/komite/dashboard" replace />}
              />
            </Route>
          </Route>
          <Route
            path="/laporan/baru"
            element={<Navigate to="/lapor" replace />}
          />
          <Route
            path="/indikator-mutu"
            element={<Navigate to="/komite/indikator-mutu" replace />}
          />
          <Route path="/indikator-mutu/:id" element={<LegacyCatalog />} />
          <Route
            path="*"
            element={<Navigate to="/komite/dashboard" replace />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
function LegacyCatalog() {
  const { pathname } = useLocation();
  return <Navigate to={`/komite${pathname}`} replace />;
}

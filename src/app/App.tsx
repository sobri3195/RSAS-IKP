import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Provider } from "./store";
import { Layout } from "../components/layout";
import { Empty } from "../components/ui";
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Reports = lazy(() => import("../pages/Reports"));
const IncidentForm = lazy(() => import("../pages/IncidentForm"));
const Detail = lazy(() => import("../pages/Detail"));
const Workbench = lazy(() => import("../pages/Workbench"));
const Analytics = lazy(() => import("../pages/Analytics"));
const QualityCatalog = lazy(() => import("../pages/QualityCatalog"));
const Quality = lazy(() => import("../pages/Quality"));
const Settings = lazy(() =>
  import("../pages/Settings").then((m) => ({ default: m.Settings })),
);
const Units = lazy(() =>
  import("../pages/Settings").then((m) => ({ default: m.Units })),
);
const ActivityPage = lazy(() =>
  import("../pages/Settings").then((m) => ({ default: m.ActivityPage })),
);
const Help = lazy(() =>
  import("../pages/Help").then((m) => ({ default: m.Help })),
);
const Login = lazy(() =>
  import("../pages/Help").then((m) => ({ default: m.Login })),
);
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <Provider>
      <BrowserRouter>
        <ScrollReset />
        <Suspense
          fallback={
            <div className="loading-state" role="status">
              <span />
              Memuat ruang kerja RSAS…
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="laporan" element={<Reports />} />
              <Route path="laporan/baru" element={<IncidentForm />} />
              <Route path="laporan/:id" element={<Detail />} />
              <Route path="laporan/:id/edit" element={<IncidentForm />} />
              <Route path="verifikasi" element={<Reports verification />} />
              <Route path="grading" element={<Workbench mode="risk" />} />
              <Route path="investigasi" element={<Workbench mode="rca" />} />
              <Route path="tindak-lanjut" element={<Workbench mode="capa" />} />
              <Route path="analisis" element={<Analytics />} />
              <Route path="mutu" element={<Quality />} />
              <Route path="indikator-mutu" element={<QualityCatalog />} />
              <Route path="indikator-mutu/:id" element={<QualityCatalog />} />
              <Route path="aktivitas" element={<ActivityPage />} />
              <Route path="unit" element={<Units />} />
              <Route path="pengaturan" element={<Settings />} />
              <Route path="bantuan" element={<Help />} />
              <Route
                path="*"
                element={
                  <Empty title="Halaman tidak ditemukan">
                    <Link className="btn primary" to="/">
                      Kembali ke Dashboard
                    </Link>
                  </Empty>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}

import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { isTeacherLoggedIn } from "./lib/pb";
import Landing from "./pages/Landing.jsx";
import TeacherAuth from "./pages/TeacherAuth.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import FolderDetail from "./pages/FolderDetail.jsx";
import StudentSubmit from "./pages/StudentSubmit.jsx";

function RequireTeacher({ children }) {
  if (!isTeacherLoggedIn()) {
    return <Navigate to="/teacher" replace />;
  }
  return children;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/teacher" element={<TeacherAuth />} />
        <Route
          path="/dashboard"
          element={
            <RequireTeacher>
              <TeacherDashboard />
            </RequireTeacher>
          }
        />
        <Route
          path="/folder/:id"
          element={
            <RequireTeacher>
              <FolderDetail />
            </RequireTeacher>
          }
        />
        <Route path="/s/:folderId" element={<StudentSubmit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

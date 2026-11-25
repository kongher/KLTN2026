import { AuthProvider } from "./contexts/AuthContext";
import { HomeContentProvider } from "./contexts/HomeContentContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AuthProvider>
      <HomeContentProvider>
        <AppRoutes />
      </HomeContentProvider>
    </AuthProvider>
  );
}

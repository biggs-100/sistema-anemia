// App.tsx is used as the root layout element by app/router.tsx
// It renders AppLayout with an Outlet for nested routes.
import { Outlet } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

function App() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default App;

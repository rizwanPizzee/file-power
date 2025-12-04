import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import MainScreen from "./components/MainScreen";
import { ToastProvider } from "./components/Toast";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ToastProvider>
      {!session ? (
        <Login />
      ) : (
        <MainScreen
          session={session}
          onSignOut={() => supabase.auth.signOut()}
        />
      )}
    </ToastProvider>
  );
}

export default App;

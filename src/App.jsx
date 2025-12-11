import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import MainScreen from "./components/MainScreen";
import LandingScreen from "./components/LandingScreen";
import FormulasScreen from "./components/FormulasScreen";
import {
  StandardInverseOvercurrent,
  SiemensRelayThermalOverload,
  MicomRelayThermalOverload,
  ImpedanceToReactance,
  SiemensDiff7UT61X,
  Siemens7UT86Slope,
} from "./components/calculators";
import AboutPage from "./components/AboutPage";
import { ToastProvider } from "./components/Toast";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("landing");
  useEffect(() => {
    document.title = "Grid Power";
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFilePower = () => {
    setScreen("filePower");
  };

  const handleFormulasPower = () => {
    setScreen("formulas");
  };

  const handleNavigateToCalculator = (calculatorId) => {
    setScreen(calculatorId);
  };

  const handleBackToLanding = () => {
    setScreen("landing");
  };

  const handleBackToFormulas = () => {
    setScreen("formulas");
  };

  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return (
          <LandingScreen
            onFilePower={handleFilePower}
            onFormulasPower={handleFormulasPower}
            onAbout={() => setScreen("about")}
          />
        );

      case "formulas":
        return (
          <FormulasScreen
            onBack={handleBackToLanding}
            onNavigate={handleNavigateToCalculator}
          />
        );

      case "filePower":
        return !session ? (
          <Login onBack={handleBackToLanding} />
        ) : (
          <MainScreen
            session={session}
            onSignOut={() => supabase.auth.signOut()}
            onGoToLanding={handleBackToLanding}
          />
        );

      case "standardInverse":
        return <StandardInverseOvercurrent onBack={handleBackToFormulas} />;

      case "simensThermal":
        return <SiemensRelayThermalOverload onBack={handleBackToFormulas} />;

      case "micomThermal":
        return <MicomRelayThermalOverload onBack={handleBackToFormulas} />;

      case "impedanceToReactance":
        return <ImpedanceToReactance onBack={handleBackToFormulas} />;

      case "siemensDiff7UT61X":
        return <SiemensDiff7UT61X onBack={handleBackToFormulas} />;

      case "siemens7UT86Slope":
        return <Siemens7UT86Slope onBack={handleBackToFormulas} />;

      case "about":
        return <AboutPage onBack={handleBackToLanding} />;

      default:
        return (
          <LandingScreen
            onFilePower={handleFilePower}
            onFormulasPower={handleFormulasPower}
            onAbout={() => setScreen("about")}
          />
        );
    }
  };

  return <ToastProvider>{renderScreen()}</ToastProvider>;
}

export default App;

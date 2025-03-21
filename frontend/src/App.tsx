import "./App.css";
import Home from "./pages/Home";

import { useAuth0 } from "@auth0/auth0-react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Embed from "./pages/Embed";

const App = () => {
    const { isAuthenticated } = useAuth0();

    return (
        <Router>
            <div className="flex flex-col min-h-screen w-full">
                <Navbar />

                <div className="pt-16 flex-grow">
                    {isAuthenticated ? (
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/embed" element={<Embed />} />
                        </Routes>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <h1 className="text-2xl font-bold">
                                Not Logged In
                            </h1>
                        </div>
                    )}
                </div>
            </div>
        </Router>
    );
};

export default App;

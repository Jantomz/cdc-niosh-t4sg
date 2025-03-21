import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./LogoutButton";
import LoginButton from "./LoginButton";

function Navbar() {
    const { isAuthenticated } = useAuth0();

    return (
        <nav className="p-4 w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
                <a
                    href="/"
                    className="mr-6 text-white text-lg font-semibold hover:text-gray-300 transition duration-300 ease-in-out"
                >
                    Query PDFs
                </a>
                <a
                    href="/embed"
                    className="text-white text-lg font-semibold hover:text-gray-300 transition duration-300 ease-in-out"
                >
                    Embed PDFs
                </a>
                <div className="m-4">
                    {isAuthenticated ? <LogoutButton /> : <LoginButton />}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

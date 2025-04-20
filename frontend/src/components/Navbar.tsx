import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./LogoutButton";
import LoginButton from "./LoginButton";

function Navbar() {
    const { isAuthenticated } = useAuth0();

    return (
        <nav className="p-4 w-full flex items-center justify-between bg-white shadow-md">
            <div className="flex items-center gap-4">
                <a
                    href="/"
                    className="mr-6 text-gray-800 text-lg font-semibold hover:text-gray-600 transition duration-300 ease-in-out"
                >
                    Query PDFs
                </a>
                <a
                    href="/embed"
                    className="text-gray-800 text-lg font-semibold hover:text-gray-600 transition duration-300 ease-in-out"
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

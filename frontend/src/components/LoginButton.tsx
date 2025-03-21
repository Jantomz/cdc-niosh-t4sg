import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    if (!isAuthenticated) {
        return (
            <div className="center-button">
                <button
                    className="bg-gray-800 cursor-pointer border-transparent border-2 hover:border-white transition-all text-white font-bold py-2 px-4 rounded"
                    onClick={() => loginWithRedirect()}
                >
                    Log In
                </button>
            </div>
        );
    }
};

export default LoginButton;

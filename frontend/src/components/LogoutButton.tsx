import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
    const { logout, isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return (
            <>
                <button
                    className="bg-gray-800 cursor-pointer border-transparent border-2 hover:border-white transition-all text-white font-bold py-2 px-4 rounded"
                    onClick={() =>
                        logout({
                            logoutParams: { returnTo: window.location.origin },
                        })
                    }
                >
                    Log Out
                </button>
                <br />
            </>
        );
    }
    return null;
};

export default LogoutButton;

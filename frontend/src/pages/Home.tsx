import React, { useState } from "react";

const Home = () => {
    const [query, setQuery] = useState("");

    const backendURL = "http://localhost:3000";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setQuery("");
        fetch(`${backendURL}/pdf/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Success:", data);
            })
            .catch((error) => {
                console.error("Error:", error);
            });

        console.log(query);
    };

    return (
        <>
            <h1 className="text-3xl font-bold">Mining.AI</h1>
            <form onSubmit={handleSubmit} className="mt-5">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Enter your query"
                    className="p-2 text-lg w-72 border border-gray-300 rounded outline-none"
                />
                <button
                    type="submit"
                    className="ml-2 p-2 bg-gray-800 cursor-pointer border-transparent border-2 hover:border-white transition-all text-white font-bold py-2 px-4 rounded"
                >
                    Submit
                </button>
            </form>
        </>
    );
};

export default Home;

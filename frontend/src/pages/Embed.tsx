import React from "react";

const Embed = () => {
    const backendURL = "http://localhost:3000";
    const handleSubmit = () => {
        const fileInput = document.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput?.files?.[0]) {
            console.log("File submitted:", fileInput.files[0]);
            const file = fileInput.files[0];
            fileInput.value = "";
            const preview = document.getElementById("file-preview");
            if (preview) {
                (preview as HTMLIFrameElement).src = "";

                // Send the file to the backend
                const formData = new FormData();
                formData.append("file", file);
                fetch(`${backendURL}/pdf`, {
                    method: "POST",
                    body: formData,
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("Response:", data);
                    });
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("Uploaded file:", file);
            const fileReader = new FileReader();
            fileReader.onload = (event) => {
                const preview = document.getElementById("file-preview");
                if (preview) {
                    (preview as HTMLIFrameElement).src = event.target
                        ?.result as string;
                }
            };
            fileReader.readAsDataURL(file);
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold">Mining.AI</h1>
            <div className="bg-white p-6 rounded-lg shadow-md m-4">
                <input
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-4"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                />
                <button
                    className="bg-gray-800 mt-4 cursor-pointer border-transparent border-2 hover:bg-gray-500 transition-all text-white font-bold py-2 px-4 rounded"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </div>
            <h2 className="text-xl font-semibold mt-4">Preview</h2>
            <iframe
                id="file-preview"
                className="mt-4 w-full h-[50vh] border rounded-lg"
            ></iframe>
        </>
    );
};

export default Embed;

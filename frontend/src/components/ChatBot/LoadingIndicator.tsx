import React from "react";

const LoadingIndicator: React.FC = () => {
    return (
        <div className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-md max-w-xs">
            <div className="flex space-x-1">
                <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                ></div>
                <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                ></div>
                <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                ></div>
            </div>
            <span className="text-sm text-gray-700">
                Generating response...
            </span>
        </div>
    );
};

export default LoadingIndicator;

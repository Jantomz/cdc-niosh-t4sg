import React from 'react';
import { SourceReference } from '../../types/chat';
import ReactMarkdown from 'react-markdown';

interface SourcePanelProps {
  sources: SourceReference[];
}

const SourcePanel: React.FC<SourcePanelProps> = ({ sources }) => {
  if (sources.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium">No source selected</h3>
          <p className="mt-1">
            Click on a source reference in the chat to see its content here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      {sources.map((source) => (
        <div key={source.id} className="p-4 border-b">
          <div className="mb-3">
            <h2 className="text-lg font-semibold">{source.title}</h2>
            {source.pageTitle && (
              <p className="text-sm text-gray-500">
                From: {source.pageTitle}
              </p>
            )}
            {source.confidence && (
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 mr-2">Relevance:</span>
                <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.round(source.confidence * 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {Math.round(source.confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Display content based on type */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            {source.type === 'image' && source.imageUrl && (
              <div>
                <img
                  src={source.imageUrl}
                  alt={source.title || 'Image'}
                  className="max-w-full rounded"
                />
                {source.textContent && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p className="font-medium text-xs text-gray-500 mb-1">
                      Image Description:
                    </p>
                    <p>{source.textContent}</p>
                  </div>
                )}
              </div>
            )}

            {source.type === 'chart' && source.imageUrl && (
              <div>
                <img
                  src={source.imageUrl}
                  alt={source.title || 'Chart'}
                  className="max-w-full rounded"
                />
                {source.textContent && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p className="font-medium text-xs text-gray-500 mb-1">
                      Chart Description:
                    </p>
                    <p>{source.textContent}</p>
                  </div>
                )}
              </div>
            )}

            {source.type === 'code' && (
              <div className="relative">
                <div className="absolute top-2 right-2 text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-700">
                  {source.language || 'code'}
                </div>
                <pre className="text-sm p-2 overflow-x-auto rounded bg-gray-800 text-gray-100 mt-2">
                  <code>{source.textContent || source.content}</code>
                </pre>
              </div>
            )}

            {source.type === 'text' && (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {source.textContent || source.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Source metadata */}
          <div className="mt-3 text-xs text-gray-500">
            {source.pagePath && (
              <p className="truncate">
                <span className="font-medium">Path:</span> {source.pagePath}
              </p>
            )}
            {source.referenceId && (
              <p className="truncate">
                <span className="font-medium">Reference ID:</span>{' '}
                {source.referenceId}
              </p>
            )}
            {source.position && (
              <p>
                {source.position.blockId && (
                  <span>
                    <span className="font-medium">Block:</span>{' '}
                    {source.position.blockId}
                  </span>
                )}
                {source.position.startLine && (
                  <span>
                    <span className="font-medium ml-2">Lines:</span>{' '}
                    {source.position.startLine}
                    {source.position.endLine &&
                      ` - ${source.position.endLine}`}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* View in context button */}
          {source.url && (
            <div className="mt-3">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View in original context
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SourcePanel;

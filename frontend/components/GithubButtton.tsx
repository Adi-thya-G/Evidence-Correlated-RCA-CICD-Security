import React from 'react'
import { AiFillGithub } from "react-icons/ai";
interface GithubButtonProps {
  title?: string;
  className?: string;
}
function GithubButtton({className="",title}:GithubButtonProps) {
 const handleLogin = () => {
    // Redirects to your backend, which then redirects to GitHub's OAuth screen.
    // Must be a full page redirect (not fetch/axios) since GitHub needs the
    // browser itself to navigate through the OAuth consent flow.
    const apiBaseUrl = (import.meta as ImportMeta & {
      env: { VITE_API_BASE_URL: string };
    }).env.VITE_BACKEND_URL;
    window.location.href = `${apiBaseUrl}/api/v1/auth/github`;
  };
 
  return (
    <button
      onClick={handleLogin}
      className={`flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white transition hover:bg-gray-800 ${className}`}
    >
      <AiFillGithub className="text-xl" />
      <span className='text-xl font-bold '>{title}</span>
    </button>
  );
}

export default GithubButtton
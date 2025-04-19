"use client";

import React, { useState, useEffect } from "react";
import { useTries } from "./TriesContext";
import { User, X, ExternalLink } from "lucide-react";
import sdk from "@farcaster/frame-sdk";

interface HeaderProps {}

const Header = ({}: HeaderProps) => {
  const { tries, fetchTries } = useTries();
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [fid, setFid] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Fetch tries when fid changes
  React.useEffect(() => {
    if (fid) {
      fetchTries(fid);
    }
  }, [fid, fetchTries]);



  useEffect(() => {
    const loadFarcasterUser = async () => {
      try {
        setIsLoading(true);
        const context = await sdk.context;

        // Mark the frame as ready
        sdk.actions.ready({});

        if (context?.user) {
          setUsername(context.user.username || null);
          setDisplayName(context.user.displayName || null);
          setPfpUrl(context.user.pfpUrl || null);
          setFid(context.user.fid);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Error loading Farcaster user:", error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    const handleFrameAdded = ({ notificationDetails }: { notificationDetails?: any }) => {
      console.log("Frame added to client", notificationDetails);
    };

    const handleFrameRemoved = () => {
      console.log("Frame removed from client");
    };

    sdk.on("frameAdded", handleFrameAdded);
    sdk.on("frameRemoved", handleFrameRemoved);

    loadFarcasterUser();

    return () => {
      sdk.removeAllListeners();
    };
  }, []);

  const toggleModal = () => {
    if (isConnected) {
      setShowModal(!showModal);
    }
  };

  const handleViewProfile = () => {
    if (fid) {
      sdk.actions.viewProfile({ fid });
      setShowModal(false);
    }
  };

  const userDisplayName = username || displayName || (fid ? String(fid) : null);

  return (
    <>
      <header className="flex items-center justify-between w-full p-4 shadow-sm">
        <div
          className={`flex items-center space-x-2 ${isConnected ? "cursor-pointer" : ""}`}
          onClick={toggleModal}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse"></div>
              <div className="h-4 w-24 bg-neutral-700 rounded animate-pulse"></div>
            </div>
          ) : isConnected && userDisplayName ? (
            <>
              {pfpUrl ? (
                <img
                  src={pfpUrl}
                  alt={`${userDisplayName}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover border border-neutral-400"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-500 text-white">
                  <User size={16} />
                </div>
              )}
              <span className="font-medium text-white">@{userDisplayName}</span>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-700 text-white">
                <User size={16} />
              </div>
              <span className="font-medium text-white text-sm">Not connected to Farcaster</span>
            </div>
          )}
        </div>

        <div className="text-white font-medium">
          {tries === null ? <span className="animate-pulse">-</span> : tries} Tries
        </div>
      </header>

      {showModal && isConnected && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-lg shadow-lg max-w-md w-full p-5 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-4 mb-4">
              {pfpUrl ? (
                <img
                  src={pfpUrl}
                  alt={`${userDisplayName}'s avatar`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-neutral-600"
                />
              ) : (
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-500 text-white">
                  <User size={30} />
                </div>
              )}

              <div>
                <h3 className="text-white font-bold text-xl">
                  {displayName || `@${username}`}
                </h3>
                <p className="text-neutral-400">
                  {username ? `@${username}` : `FID: ${fid}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-700 rounded p-3">
                <p className="text-neutral-400 text-sm">FID</p>
                <p className="text-white font-bold">{fid}</p>
              </div>
              <div className="bg-neutral-700 rounded p-3">
                <p className="text-neutral-400 text-sm">Connected</p>
                <p className="text-white font-bold">✓</p>
              </div>
            </div>

            <button
              onClick={handleViewProfile}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
            >
              <span>View Full Profile</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

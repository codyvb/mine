import React from "react";
import sdk from "@farcaster/frame-sdk";

const GEMS_FID = 1049335; // Gems profile FID

const ViewProfileButton: React.FC = () => {
  const handleClick = async () => {
    if (sdk && sdk.actions && typeof sdk.actions.viewProfile === "function") {
      try {
        await sdk.actions.viewProfile({ fid: GEMS_FID });
      } catch (e) {
        // Optionally: show error toast
      }
    }
  };

  return (
    <button
      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full max-w-xs border border-purple-800 shadow-lg text-lg"
      onClick={handleClick}
      type="button"
    >
      Follow Gems
    </button>
  );
};

export default ViewProfileButton;

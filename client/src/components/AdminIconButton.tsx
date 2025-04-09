import React from "react";

interface AdminIconButtonProps {
  setShowSettings: (value: boolean) => void;
  showSettings: boolean;
}

export const AdminIconButton: React.FC<AdminIconButtonProps> = ({
  setShowSettings,
  showSettings,
}) => {
  return (
    <button 
      className="flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md mb-4"
      onClick={() => setShowSettings(!showSettings)}
      aria-label={showSettings ? "Close settings" : "Open settings"}
    >
      <img 
        src={`https://sdk-style.s3.amazonaws.com/icons/${showSettings ? "arrow" : "cog"}.svg`} 
        alt={showSettings ? "Back" : "Settings"}
        className="w-5 h-5 mr-2 invert"
      />
      <span>{showSettings ? "Back to User View" : "Admin Settings"}</span>
    </button>
  );
};

export default AdminIconButton;

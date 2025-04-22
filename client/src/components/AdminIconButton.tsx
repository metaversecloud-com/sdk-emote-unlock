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
      className="flex items-center justify-center p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
      onClick={() => setShowSettings(!showSettings)}
      aria-label={showSettings ? "Close settings" : "Open settings"}
    >
      <img 
        src={`https://sdk-style.s3.amazonaws.com/icons/${showSettings ? "arrow" : "cog"}.svg`} 
        alt={showSettings ? "Back" : "Settings"}
        className="w-5 h-5" style={{ filter: 'brightness(0) invert(1)' }}
      />
    </button>
  );
};

export default AdminIconButton;

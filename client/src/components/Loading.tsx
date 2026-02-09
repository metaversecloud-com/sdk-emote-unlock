export const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="treasure-loader" />
      <p className="font-display text-secondary text-sm tracking-wide">Loading...</p>
    </div>
  );
};

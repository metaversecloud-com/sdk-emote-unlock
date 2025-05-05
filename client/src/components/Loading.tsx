export const Loading = ({ message }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <img src="/icons/loading.svg" alt="Loading..." className="w-12 h-12 animate-spin" />
      <p className="mt-4 text-gray-600">{message || 'Loading...'}</p>
    </div>
  );
};

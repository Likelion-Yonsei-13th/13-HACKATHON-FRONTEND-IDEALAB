export default function Marker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block px-1 ${className}`}
      style={{
        background: "linear-gradient(transparent 60%, rgba(250,204,21,0.55) 0)", // 노란 형광펜
        borderRadius: "2px",
      }}
    >
      {children}
    </span>
  );
}

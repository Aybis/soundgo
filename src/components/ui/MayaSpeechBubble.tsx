interface Props {
  message: string;
  className?: string;
}

/** MAYA's speech bubble — rounded, warm, with a little tail. */
export function MayaSpeechBubble({ message, className = "" }: Props) {
  return (
    <div className={`relative inline-block rounded-3xl rounded-bl-md bg-white px-5 py-3 text-lg font-bold text-[#3a3352] shadow-lg ${className}`}>
      {message}
      <span className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 rounded-sm bg-white" />
    </div>
  );
}
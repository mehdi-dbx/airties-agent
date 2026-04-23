import { motion } from 'framer-motion';
import { useSession } from '@/contexts/SessionContext';

export const Greeting = () => {
  const { session } = useSession();
  const displayName =
    session?.user?.preferredUsername ||
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    '';
  const firstName = displayName.split(/\s+/)[0] || 'there';

  return (
    <div
      key="overview"
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-xl font-semibold text-foreground md:text-2xl"
      >
        Hello, {firstName}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-lg text-muted-foreground md:text-xl"
      >
        Welcome to Veron. How can I help you today?
      </motion.div>
    </div>
  );
};

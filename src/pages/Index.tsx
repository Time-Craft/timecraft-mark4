
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <span className="inline-block px-3 py-1 text-sm rounded-full bg-secondary text-secondary-foreground mb-4">
          Welcome
        </span>
        <h1 className="text-4xl font-medium tracking-tight sm:text-6xl mb-6">
          Your New Project Awaits
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Begin crafting your vision with this clean foundation.
          Built with modern tools for exceptional performance and developer experience.
        </p>
        <button className="hover-effect inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90">
          Get Started
        </button>
      </motion.div>
    </div>
  );
};

export default Index;

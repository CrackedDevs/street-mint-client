import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessPopup({ isOpen, onClose }: SuccessPopupProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 10,
            }}
            className="mb-6"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              <PartyPopper size={96} className="text-primary relative z-10" />
            </div>
          </motion.div>

          <DialogTitle className="text-3xl font-bold mb-4 text-primary">
            Congratulations!
          </DialogTitle>

          <p className="text-lg mb-6">
            Your Collectible has been successfully minted! You&apos;re now the
            proud owner of this unique piece. 🎉
          </p>

          <Button
            onClick={onClose}
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors duration-200"
          >
            Awesome!
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

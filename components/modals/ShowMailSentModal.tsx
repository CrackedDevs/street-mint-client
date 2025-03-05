import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { Mail } from "lucide-react";

const CheckInboxModal = ({
  showModal,
  onClose,
}: {
  showModal: boolean;
  onClose: () => void;
}) => {
  if (!showModal) return null;

  return (
    <Dialog open={showModal} onOpenChange={onClose}>
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
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
              <Mail size={96} className="text-blue-500 relative z-10" />
            </div>
          </motion.div>

          <DialogTitle className="text-3xl font-bold mb-4 text-primary">
            Check Your Inbox!
          </DialogTitle>

          <p className="text-lg mb-6">
            Your collectible is on its way to your email! 🎉
          </p>

          <Button
            onClick={onClose}
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors duration-200"
          >
            Got it, thanks!
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInboxModal;

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const WaitlistModal = ({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}) => {
  if (!showModal) return null;

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-center">Join the Waiting List</DialogTitle>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            <Image
              src="https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/photo_2024-10-11_17-07-18.jpg"
              alt="Investment Image 1"
              width={150}
              height={150}
              className="rounded-lg"
            />
            <Image
              src="https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/photo_2024-10-11_17-07-09.jpg"
              alt="Investment Image 2"
              width={150}
              height={150}
              className="rounded-lg"
            />
          </div>
          <p className="text-center">
            Be part of London&apos;s first tokenised real estate investment in
            partnership with MetaWealth & Superteam UK
          </p>
          <Button
            onClick={() => {
              window.open(
                "https://www.metawealth.co/square-wailist#Waitlist",
                "_blank"
              );
              setShowModal(false);
            }}
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors duration-200"
          >
            Join Waitlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;

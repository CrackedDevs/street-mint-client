import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CollectionCard({
  collection,
  isAdmin = false,
}: {
  collection: {
    id: string;
    name: string;
    description: string;
    collectible_image_urls: string[];
  };
  isAdmin?: boolean;
}) {
  const imagesToShow =
    collection.collectible_image_urls.length >= 9
      ? 9
      : collection.collectible_image_urls.length >= 4
      ? 4
      : 1;

  return (
    <Card className="overflow-hidden bg-white h-[300px] flex flex-col justify-between z-20">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4">
          <div className={`grid gap-1 grid-cols-6 overflow-hidden`}>
            {collection.collectible_image_urls.slice(0, 5).map((url, index) => (
              <div key={index} className="aspect-square overflow-hidden">
                <Image
                  src={url}
                  alt={`Collectible ${index + 1}`}
                  width={60}
                  height={60}
                  className="rounded-md object-cover object-center w-full h-full"
                />
              </div>
            ))}
            {collection.collectible_image_urls.length > imagesToShow && (
              <div className="flex items-center justify-center rounded-md bg-muted text-xs font-medium aspect-square">
                +{collection.collectible_image_urls.length - imagesToShow}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-semibold leading-tight">
            {collection.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {collection.description}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-3">
            Total collectibles: {collection.collectible_image_urls.length}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-3">
            Collection ID: {collection.id}
          </p>
        </div>
        <div className="mt-4">
          <Link
            href={
              isAdmin
                ? `/admin/collection/${collection.id}`
                : `/dashboard/collection/${collection.id}`
            }
          >
            <Button variant="secondary" size="sm" className="w-full h-10 text-sm">
              View Collection
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

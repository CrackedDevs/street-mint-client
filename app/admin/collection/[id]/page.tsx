import {
  getCollectionById,
  fetchCollectiblesByCollectionId,
  Collection,
  Collectible,
  getArtistPassword,
} from "@/lib/supabaseClient";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Badge,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CpuIcon,
  MapPin,
  MapPinned,
  Lock,
} from "lucide-react";
import CopyableText from "@/components/copyableText";
import { Toaster } from "@/components/ui/toaster";
import { StringService } from "@/lib/services/stringService";
import UpdateNfcModal from "./updateNfcModal";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default async function CollectionDetails({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const collection = await getCollectionById(Number(id));
  const collectibles =
    (await fetchCollectiblesByCollectionId(Number(id))) || [];
  const creatorPassword = await getArtistPassword(Number(collection?.artist));

  if (!collection) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Collections
          </Link>
        </div>
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              {collection.name}
            </CardTitle>
            <p className="text-lg text-gray-600">{collection.description}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-600 mt-4">
              <Lock className="mr-2 h-4 w-4" />
              <span className="mr-2">Creator Password:</span>
              <CopyableText
                displayText={creatorPassword?.app_password ?? "None"}
                copyText={creatorPassword?.app_password ?? "None"}
              />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectibles.map((collectible) => (
            <Card
              key={collectible.id}
              className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              <CardContent className="flex pt-5 w-full h-full justify-center flex-col">
                <div className=" relative">
                  <Image
                    width={200}
                    height={200}
                    src={collectible.primary_image_url}
                    alt={collectible.name}
                    className="object-contain w-full h-full object-center items-center"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {collectible.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {collectible.description}
                  </p>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Badge className="mr-2 h-4 w-4" />
                      <span>Collectible ID: {collectible.id}</span>
                    </div>
                    <div className="flex items-center text-sm text-blue-600">
                      <MapPinned className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a
                        href={collectible.location ?? ""}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {(collectible.location && "View Location") ||
                          "Location not specified"}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <Link href={`/admin/collection/${id}/orders/${collectible.id}`}>
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center"
                  >
                    View orders
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

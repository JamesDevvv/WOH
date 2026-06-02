import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string;
}

export function GallerySection({ gallery }: { gallery: GalleryItem[] }) {
  const display = gallery.slice(0, 8);

  return (
    <section id="gallery" className="py-20 bg-[#F6FAFD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1931] mb-3">Gallery</h2>
          <p className="text-[#4A7FA7] text-sm">Moments from our church family</p>
        </div>

        {display.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {display.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-[#B3CFE5]/20 group"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.caption ?? "Gallery image"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.caption && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-white text-xs font-medium">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Placeholder grid when no photos yet */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-[#B3CFE5]/20 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-[#4A7FA7]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


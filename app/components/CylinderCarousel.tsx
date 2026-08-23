"use client";

import Image from "next/image";
import { CSSProperties, HTMLAttributes } from "react";

export type CarouselImage = {
  src: string;
  alt: string;
  position?: string;
};

type CylinderCarouselProps = HTMLAttributes<HTMLDivElement> & {
  images: CarouselImage[];
  animationDuration?: number;
};

export function CylinderCarousel({ images, animationDuration = 30, className = "", ...props }: CylinderCarouselProps) {
  const style = {
    "--carousel-count": Math.max(images.length, 1),
    "--carousel-duration": `${animationDuration}s`,
  } as CSSProperties;

  return (
    <div className={`cylinder-carousel ${className}`.trim()} {...props}>
      <div className="cylinder-stage" style={style}>
        {images.map((image, index) => (
          <div
            className="cylinder-card"
            key={`${image.src}-${index}`}
            style={{ "--carousel-index": index } as CSSProperties}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 620px) 62vw, (max-width: 1000px) 38vw, 300px"
              priority={index === 0}
              unoptimized={image.src.startsWith("http") && !image.src.startsWith("https://res.cloudinary.com/")}
              style={{ objectPosition: image.position ?? "center" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

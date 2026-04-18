import { useEffect, useState } from "react";

function getYoutubeEmbedUrl(url) {
  if (typeof url !== "string" || !url) {
    return "";
  }

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);

  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?feature=oembed`;
  }

  const fullMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);

  if (fullMatch) {
    return `https://www.youtube.com/embed/${fullMatch[1]}?feature=oembed`;
  }

  return "";
}

function VehicleVideo({ src, title }) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const youtubeEmbedUrl = getYoutubeEmbedUrl(src);

  useEffect(() => {
    setHasLoadError(false);
  }, [src]);

  if (!src || hasLoadError) {
    return null;
  }

  if (youtubeEmbedUrl) {
    return (
      <iframe
        title={title}
        width="600"
        height="338"
        src={youtubeEmbedUrl}
        frameBorder="0"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <video
      key={src}
      className="vehica-car-embed__video"
      controls
      preload="metadata"
      playsInline
      src={src}
      onError={() => setHasLoadError(true)}
    />
  );
}

export default VehicleVideo;

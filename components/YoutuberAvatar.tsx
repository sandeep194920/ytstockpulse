'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Props {
  initials: string;
  color: string;
  size?: number;
  avatarUrl?: string | null;
}

export default function YoutuberAvatar({ initials, color, size = 36, avatarUrl }: Props) {
  const [imgError, setImgError] = useState(false);

  const proxiedUrl = avatarUrl ? `/api/avatar?url=${encodeURIComponent(avatarUrl)}` : null;

  if (proxiedUrl && !imgError) {
    return (
      <Image
        src={proxiedUrl}
        alt={initials}
        width={size}
        height={size}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
        unoptimized
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold font-serif text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  );
}

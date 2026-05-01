import { useEffect, useState } from 'react';

const AVATAR_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#e11d48',
  '#0891b2',
  '#4f46e5',
  '#0d9488',
];

function avatarBg(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Minimal fields for photo + initial fallback (includes full `ProjectMember`). */
export type ProjectMemberAvatarMember = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
};

const SIZE_CLASS: Record<'xs' | 'sm' | 'md', { box: string; text: string }> = {
  xs: { box: 'h-5 w-5', text: 'text-[10px]' },
  sm: { box: 'h-6 w-6', text: 'text-[10px]' },
  md: { box: 'h-8 w-8', text: 'text-[13px]' },
};

export function ProjectMemberAvatar({
  member,
  size = 'sm',
  className = '',
}: {
  member: ProjectMemberAvatarMember;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const label = member.displayName || member.email || member.uid;
  const initial = (member.displayName || member.email || '?')[0]?.toUpperCase() ?? '?';
  const { box, text } = SIZE_CLASS[size];

  useEffect(() => {
    setImgFailed(false);
  }, [member.photoURL]);

  if (member.photoURL && !imgFailed) {
    return (
      <img
        src={member.photoURL}
        alt={label}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${box} shrink-0 rounded-full object-cover ring-1 ring-white/10 ${className}`}
        title={label}
      />
    );
  }

  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/10 ${text} ${className}`}
      style={{ backgroundColor: avatarBg(member.uid) }}
      title={label}
    >
      {initial}
    </span>
  );
}
